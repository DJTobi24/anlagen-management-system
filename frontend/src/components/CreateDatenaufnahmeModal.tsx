import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, Search, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
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
    } else {
      // Reset when modal closes
      setCurrentStep(1);
      setFormData({
        titel: '',
        beschreibung: '',
        zugewiesen_an: '',
        start_datum: '',
        end_datum: '',
        liegenschaft_ids: [],
        objekt_ids: [],
        anlagen_config: []
      });
      setSelectedAnlagen(new Map());
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
    // Nur Anlagen von ausgewählten Objekten laden
    const relevantObjektIds = formData.objekt_ids && formData.objekt_ids.length > 0 
      ? formData.objekt_ids 
      : objekte.filter(o => formData.liegenschaft_ids?.includes(o.liegenschaft_id)).map(o => o.id);

    if (relevantObjektIds.length === 0) {
      setAnlagen([]);
      return;
    }

    try {
      const anlagenPromises = relevantObjektIds.map(objektId => 
        anlageService.getAnlagenByObjekt(objektId)
      );
      const anlagenArrays = await Promise.all(anlagenPromises);
      
      // Flatten arrays - response is already an array of Anlage objects
      const allAnlagen = anlagenArrays.flat();
      
      // Filter only anlagen that belong to selected objects
      const filteredAnlagen = allAnlagen.filter(anlage => 
        relevantObjektIds.includes(anlage.objekt_id)
      );
      
      // Add object name to each anlage
      const anlagenMitObjektInfo = filteredAnlagen.map(anlage => {
        const objekt = objekte.find(o => o.id === anlage.objekt_id);
        return {
          ...anlage,
          objekt_name: objekt?.name || anlage.objekt_name || 'Unbekanntes Objekt'
        };
      });
      
      setAnlagen(anlagenMitObjektInfo);

      // Alle Anlagen standardmäßig sichtbar
      const newSelectedAnlagen = new Map();
      anlagenMitObjektInfo.forEach(anlage => {
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
    
    // Reset Objekt-Auswahl wenn Liegenschaft entfernt wird
    if (newIds.length < currentIds.length) {
      const removedLiegenschaftId = currentIds.find(id => !newIds.includes(id));
      const objekteToRemove = objekte
        .filter(o => o.liegenschaft_id === removedLiegenschaftId)
        .map(o => o.id);
      setFormData(prev => ({
        ...prev,
        liegenschaft_ids: newIds,
        objekt_ids: prev.objekt_ids?.filter(id => !objekteToRemove.includes(id)) || []
      }));
    }
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

  const validateStep1 = () => {
    if (!formData.titel || !formData.zugewiesen_an) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return false;
    }

    if ((formData.liegenschaft_ids?.length || 0) === 0) {
      setError('Bitte wählen Sie mindestens eine Liegenschaft aus.');
      return false;
    }

    setError('');
    return true;
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && validateStep1()) {
      await loadAnlagen();
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  const toggleAllAnlagen = (sichtbar: boolean) => {
    const newSelectedAnlagen = new Map();
    anlagen.forEach(anlage => {
      const current = selectedAnlagen.get(anlage.id);
      newSelectedAnlagen.set(anlage.id, {
        ...current,
        anlage_id: anlage.id,
        sichtbar: sichtbar,
        such_modus: current?.such_modus || false,
        notizen: current?.notizen || '',
        anlage_details: anlage
      });
    });
    setSelectedAnlagen(newSelectedAnlagen);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
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

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`w-24 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Step 1: Basis-Informationen und Liegenschaften/Objekte */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Linke Spalte: Basis-Informationen */}
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

                {/* Rechte Spalte: Liegenschaften und Objekte */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Liegenschaften auswählen *</h4>
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
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

                  {objekte.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Objekte/Gebäude auswählen (optional)</h4>
                      <p className="text-xs text-gray-500 mt-1">Wenn keine Objekte ausgewählt sind, werden alle Objekte der Liegenschaften verwendet.</p>
                      <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {objekte.map((objekt) => {
                          const liegenschaft = liegenschaften.find(l => l.id === objekt.liegenschaft_id);
                          return (
                            <label key={objekt.id} className="flex items-center py-2 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={formData.objekt_ids?.includes(objekt.id) || false}
                                onChange={() => handleObjektChange(objekt.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {objekt.name}
                                <span className="text-xs text-gray-500 ml-2">({liegenschaft?.name})</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Anlagen-Konfiguration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    Anlagen-Konfiguration ({anlagen.length} Anlagen gefunden)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleAllAnlagen(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Alle anzeigen
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => toggleAllAnlagen(false)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Alle ausblenden
                    </button>
                  </div>
                </div>

                {anlagen.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Keine Anlagen in den ausgewählten Objekten/Liegenschaften gefunden.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Anlage
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Objekt
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sichtbar
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Suchen
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {anlagen.map((anlage) => {
                            const config = selectedAnlagen.get(anlage.id);
                            return (
                              <tr key={anlage.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {anlage.name}
                                  {anlage.t_nummer && (
                                    <span className="text-xs text-gray-500 ml-2">({anlage.t_nummer})</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {anlage.objekt_name}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleAnlageSichtbarkeit(anlage.id)}
                                    className={`p-2 rounded-md transition-colors ${
                                      config?.sichtbar 
                                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                  >
                                    {config?.sichtbar ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleAnlageSuchModus(anlage.id)}
                                    className={`p-2 rounded-md transition-colors ${
                                      config?.such_modus 
                                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                    title="Im Such-Modus muss die Anlage erst gefunden werden"
                                  >
                                    <Search className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Legende:</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-green-600 mr-2" />
                      <span>Sichtbar: Anlage wird direkt angezeigt</span>
                    </div>
                    <div className="flex items-center">
                      <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Ausgeblendet: Anlage wird nicht angezeigt</span>
                    </div>
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-yellow-600 mr-2" />
                      <span>Such-Modus: Anlage muss erst gefunden werden</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </button>
                <div className="flex space-x-3">
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
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateDatenaufnahmeModal;