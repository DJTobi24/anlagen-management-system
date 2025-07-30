import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import datenaufnahmeService from '../services/datenaufnahmeService';
import liegenschaftService from '../services/liegenschaftService';
import objektService from '../services/objektService';
import anlageService from '../services/anlageService';
import { CreateDatenaufnahmeDto, DatenaufnahmeAuftrag } from '../types/datenaufnahme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  auftrag?: DatenaufnahmeAuftrag | null;
}

const CreateDatenaufnahmeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, auftrag }) => {
  const [formData, setFormData] = useState<CreateDatenaufnahmeDto>({
    titel: '',
    beschreibung: '',
    zugewiesen_an: '',
    start_datum: '',
    end_datum: '',
    liegenschaft_ids: [],
    objekt_ids: [],
    anlagen_config: []
  });

  const [mitarbeiter, setMitarbeiter] = useState<any[]>([]);
  const [liegenschaften, setLiegenschaften] = useState<any[]>([]);
  const [objekte, setObjekte] = useState<any[]>([]);
  const [anlagen, setAnlagen] = useState<any[]>([]);
  const [selectedAnlagen, setSelectedAnlagen] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnlagenConfig, setShowAnlagenConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (auftrag) {
        // Bearbeitungsmodus
        setFormData({
          titel: auftrag.titel,
          beschreibung: auftrag.beschreibung || '',
          zugewiesen_an: auftrag.zugewiesen_an,
          start_datum: auftrag.start_datum || '',
          end_datum: auftrag.end_datum || '',
          liegenschaft_ids: auftrag.liegenschaften?.map(l => l.id) || [],
          objekt_ids: auftrag.objekte?.map(o => o.id) || [],
          anlagen_config: []
        });
      }
    }
  }, [isOpen, auftrag]);

  const loadData = async () => {
    try {
      const [mitarbeiterData, liegenschaftenData] = await Promise.all([
        datenaufnahmeService.getVerfuegbareMitarbeiter(),
        liegenschaftService.getLiegenschaften()
      ]);
      setMitarbeiter(mitarbeiterData);
      setLiegenschaften(liegenschaftenData);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  };

  const loadObjekte = async (liegenschaftIds: string[]) => {
    if (liegenschaftIds.length === 0) {
      setObjekte([]);
      return;
    }

    try {
      const objektePromises = liegenschaftIds.map(id => 
        objektService.getObjekteByLiegenschaft(id)
      );
      const objekteArrays = await Promise.all(objektePromises);
      const allObjekte = objekteArrays.flat();
      setObjekte(allObjekte);
    } catch (error) {
      console.error('Fehler beim Laden der Objekte:', error);
    }
  };

  const loadAnlagen = async () => {
    const relevantObjektIds = formData.objekt_ids && formData.objekt_ids.length > 0 
      ? formData.objekt_ids 
      : objekte.map(o => o.id);

    if (relevantObjektIds.length === 0) {
      setAnlagen([]);
      return;
    }

    try {
      const anlagenPromises = relevantObjektIds.map(objektId => 
        anlageService.getAnlagenByObjekt(objektId)
      );
      const anlagenArrays = await Promise.all(anlagenPromises);
      const allAnlagen = anlagenArrays.flat();
      setAnlagen(allAnlagen);

      // Alle Anlagen standardmäßig sichtbar
      const newSelectedAnlagen = new Map();
      allAnlagen.forEach(anlage => {
        newSelectedAnlagen.set(anlage.id, {
          anlage_id: anlage.id,
          sichtbar: true,
          such_modus: false,
          notizen: '',
          anlage_details: anlage
        });
      });
      setSelectedAnlagen(newSelectedAnlagen);
    } catch (error) {
      console.error('Fehler beim Laden der Anlagen:', error);
    }
  };

  const handleLiegenschaftChange = (liegenschaftId: string) => {
    const currentIds = formData.liegenschaft_ids || [];
    const newIds = currentIds.includes(liegenschaftId)
      ? currentIds.filter(id => id !== liegenschaftId)
      : [...currentIds, liegenschaftId];

    setFormData({ ...formData, liegenschaft_ids: newIds });
    loadObjekte(newIds);
  };

  const handleObjektChange = (objektId: string) => {
    const currentIds = formData.objekt_ids || [];
    const newIds = currentIds.includes(objektId)
      ? currentIds.filter(id => id !== objektId)
      : [...currentIds, objektId];

    setFormData({ ...formData, objekt_ids: newIds });
  };

  const toggleAnlageSichtbarkeit = (anlageId: string) => {
    const current = selectedAnlagen.get(anlageId);
    if (current) {
      selectedAnlagen.set(anlageId, {
        ...current,
        sichtbar: !current.sichtbar
      });
      setSelectedAnlagen(new Map(selectedAnlagen));
    }
  };

  const toggleAnlageSuchModus = (anlageId: string) => {
    const current = selectedAnlagen.get(anlageId);
    if (current) {
      selectedAnlagen.set(anlageId, {
        ...current,
        such_modus: !current.such_modus
      });
      setSelectedAnlagen(new Map(selectedAnlagen));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.titel || !formData.zugewiesen_an) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    if ((formData.liegenschaft_ids?.length || 0) === 0 && (formData.objekt_ids?.length || 0) === 0) {
      setError('Bitte wählen Sie mindestens eine Liegenschaft oder ein Objekt aus.');
      return;
    }

    setLoading(true);

    try {
      const anlagen_config = Array.from(selectedAnlagen.values()).map(config => ({
        anlage_id: config.anlage_id,
        sichtbar: config.sichtbar,
        such_modus: config.such_modus,
        notizen: config.notizen
      }));

      const dataToSubmit = {
        ...formData,
        anlagen_config
      };

      if (auftrag) {
        await datenaufnahmeService.updateDatenaufnahme(auftrag.id, dataToSubmit);
      } else {
        await datenaufnahmeService.createDatenaufnahme(dataToSubmit);
      }

      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Fehler beim Speichern der Datenaufnahme');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {auftrag ? 'Datenaufnahme bearbeiten' : 'Neue Datenaufnahme erstellen'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basis-Informationen */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basis-Informationen</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titel *
              </label>
              <input
                type="text"
                value={formData.titel}
                onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Zugewiesen an *
              </label>
              <select
                value={formData.zugewiesen_an}
                onChange={(e) => setFormData({ ...formData, zugewiesen_an: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Mitarbeiter auswählen</option>
                {mitarbeiter.map((ma) => (
                  <option key={ma.id} value={ma.id}>
                    {ma.name || ma.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={formData.start_datum}
                  onChange={(e) => setFormData({ ...formData, start_datum: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enddatum
                </label>
                <input
                  type="date"
                  value={formData.end_datum}
                  onChange={(e) => setFormData({ ...formData, end_datum: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Liegenschaften-Auswahl */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Liegenschaften auswählen</h4>
            <div className="max-h-40 overflow-y-auto border rounded-md p-3">
              {liegenschaften.map((liegenschaft) => (
                <label key={liegenschaft.id} className="flex items-center py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.liegenschaft_ids?.includes(liegenschaft.id) || false}
                    onChange={() => handleLiegenschaftChange(liegenschaft.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{liegenschaft.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Objekte-Auswahl */}
          {objekte.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Objekte/Gebäude auswählen (optional)</h4>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3">
                {objekte.map((objekt) => (
                  <label key={objekt.id} className="flex items-center py-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.objekt_ids?.includes(objekt.id) || false}
                      onChange={() => handleObjektChange(objekt.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{objekt.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Anlagen-Konfiguration */}
          {((formData.liegenschaft_ids?.length || 0) > 0 || (formData.objekt_ids?.length || 0) > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Anlagen-Konfiguration</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAnlagenConfig(!showAnlagenConfig);
                    if (!showAnlagenConfig) {
                      loadAnlagen();
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAnlagenConfig ? 'Verbergen' : 'Anzeigen'}
                </button>
              </div>

              {showAnlagenConfig && anlagen.length > 0 && (
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="text-xs text-gray-500 mb-3">
                    Konfigurieren Sie die Sichtbarkeit und den Such-Modus für einzelne Anlagen
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Anlage</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Sichtbar</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Suchen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {anlagen.map((anlage) => {
                        const config = selectedAnlagen.get(anlage.id);
                        return (
                          <tr key={anlage.id}>
                            <td className="px-2 py-2 text-sm text-gray-900">
                              {anlage.name}
                              {anlage.t_nummer && (
                                <span className="text-xs text-gray-500 ml-2">({anlage.t_nummer})</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAnlageSichtbarkeit(anlage.id)}
                                className={`p-1 rounded ${config?.sichtbar ? 'text-green-600' : 'text-gray-400'}`}
                              >
                                {config?.sichtbar ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAnlageSuchModus(anlage.id)}
                                className={`p-1 rounded ${config?.such_modus ? 'text-yellow-600' : 'text-gray-400'}`}
                              >
                                <Search className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Speichern...' : (auftrag ? 'Aktualisieren' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDatenaufnahmeModal;