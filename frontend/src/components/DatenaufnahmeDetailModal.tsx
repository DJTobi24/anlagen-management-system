import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Clock, AlertCircle, Eye, Download, Building2, Package, Pause, PlayCircle } from 'lucide-react';
import { DatenaufnahmeAuftrag, DatenaufnahmeFortschritt } from '../types/datenaufnahme';
import datenaufnahmeService from '../services/datenaufnahmeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  auftrag: DatenaufnahmeAuftrag;
  onUpdate?: () => void;
}

const DatenaufnahmeDetailModal: React.FC<Props> = ({ isOpen, onClose, auftrag, onUpdate }) => {
  const [fortschritt, setFortschritt] = useState<DatenaufnahmeFortschritt[]>([]);
  const [loadingFortschritt, setLoadingFortschritt] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'anlagen' | 'fortschritt'>('overview');
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && auftrag) {
      loadFortschritt();
    }
  }, [isOpen, auftrag]);

  const loadFortschritt = async () => {
    try {
      setLoadingFortschritt(true);
      const data = await datenaufnahmeService.getDatenaufnahmeFortschritt(auftrag.id);
      setFortschritt(data);
    } catch (error) {
      console.error('Fehler beim Laden des Fortschritts:', error);
    } finally {
      setLoadingFortschritt(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vorbereitet':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'in_bearbeitung':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'abgeschlossen':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pausiert':
        return <Pause className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setChangingStatus(true);
      await datenaufnahmeService.updateDatenaufnahme(auftrag.id, { 
        status: newStatus as 'vorbereitet' | 'in_bearbeitung' | 'abgeschlossen' | 'pausiert' 
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error);
      alert('Fehler beim Ändern des Status');
    } finally {
      setChangingStatus(false);
    }
  };

  const getNextStatuses = (currentStatus: string): { value: string; label: string; icon: JSX.Element }[] => {
    switch (currentStatus) {
      case 'vorbereitet':
        return [
          { value: 'in_bearbeitung', label: 'Starten', icon: <PlayCircle className="h-4 w-4" /> },
          { value: 'pausiert', label: 'Pausieren', icon: <Pause className="h-4 w-4" /> }
        ];
      case 'in_bearbeitung':
        return [
          { value: 'pausiert', label: 'Pausieren', icon: <Pause className="h-4 w-4" /> },
          { value: 'abgeschlossen', label: 'Abschließen', icon: <CheckCircle className="h-4 w-4" /> }
        ];
      case 'pausiert':
        return [
          { value: 'in_bearbeitung', label: 'Fortsetzen', icon: <PlayCircle className="h-4 w-4" /> },
          { value: 'abgeschlossen', label: 'Abschließen', icon: <CheckCircle className="h-4 w-4" /> }
        ];
      default:
        return [];
    }
  };

  const exportFortschritt = () => {
    // CSV-Export der Fortschrittsdaten
    const csvContent = [
      ['Zeitstempel', 'Anlage', 'T-Nummer', 'Aktion', 'Benutzer'],
      ...fortschritt.map(f => [
        new Date(f.created_at).toLocaleString('de-DE'),
        f.anlage_name || '',
        f.t_nummer || '',
        f.aktion,
        f.benutzer_name || f.benutzer_email || ''
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datenaufnahme_fortschritt_${auftrag.id}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon(auftrag.status)}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{auftrag.titel}</h3>
              <p className="text-sm text-gray-500">
                Erstellt am {new Date(auftrag.created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('anlagen')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'anlagen'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Anlagen ({auftrag.anlagen?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('fortschritt')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fortschritt'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fortschritt
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basis-Informationen */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Basis-Informationen</h4>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mitarbeiter</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {auftrag.mitarbeiter_name || auftrag.mitarbeiter_email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Erstellt von</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {auftrag.ersteller_name || auftrag.ersteller_email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Zeitraum</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {auftrag.start_datum && auftrag.end_datum ? (
                        <>
                          {new Date(auftrag.start_datum).toLocaleDateString('de-DE')} - 
                          {new Date(auftrag.end_datum).toLocaleDateString('de-DE')}
                        </>
                      ) : (
                        'Nicht festgelegt'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          auftrag.status === 'abgeschlossen' ? 'bg-green-100 text-green-800' :
                          auftrag.status === 'in_bearbeitung' ? 'bg-yellow-100 text-yellow-800' :
                          auftrag.status === 'pausiert' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {auftrag.status.replace('_', ' ')}
                        </span>
                        {auftrag.status !== 'abgeschlossen' && getNextStatuses(auftrag.status).length > 0 && (
                          <div className="flex items-center space-x-1">
                            {getNextStatuses(auftrag.status).map((nextStatus) => (
                              <button
                                key={nextStatus.value}
                                onClick={() => handleStatusChange(nextStatus.value)}
                                disabled={changingStatus}
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                                  nextStatus.value === 'abgeschlossen' 
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    : nextStatus.value === 'pausiert'
                                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {nextStatus.icon}
                                <span className="ml-1">{nextStatus.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                </dl>

                {auftrag.beschreibung && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                    <dd className="mt-1 text-sm text-gray-900">{auftrag.beschreibung}</dd>
                  </div>
                )}
              </div>

              {/* Statistik */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Fortschritt</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Gesamtfortschritt</span>
                      <span>{auftrag.statistik?.fortschritt_prozent || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${auftrag.statistik?.fortschritt_prozent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {auftrag.statistik?.gesamt_anlagen || 0}
                      </div>
                      <div className="text-xs text-gray-500">Gesamt</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {auftrag.statistik?.bearbeitete_anlagen || 0}
                      </div>
                      <div className="text-xs text-gray-500">Bearbeitet</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-yellow-600">
                        {auftrag.statistik?.such_modus_anlagen || 0}
                      </div>
                      <div className="text-xs text-gray-500">Zu suchen</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zugewiesene Bereiche */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Liegenschaften ({auftrag.liegenschaften?.length || 0})
                  </h4>
                  <ul className="space-y-1">
                    {auftrag.liegenschaften?.map((l) => (
                      <li key={l.id} className="text-sm text-gray-700">• {l.name}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Objekte ({auftrag.objekte?.length || 0})
                  </h4>
                  <ul className="space-y-1">
                    {auftrag.objekte?.map((o) => (
                      <li key={o.id} className="text-sm text-gray-700">• {o.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'anlagen' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {auftrag.anlagen?.length || 0} Anlagen zugewiesen
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1 text-green-500" /> Sichtbar
                  </span>
                  <span className="flex items-center">
                    <Search className="h-4 w-4 mr-1 text-yellow-500" /> Zu suchen
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-blue-500" /> Bearbeitet
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Anlage
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        T-Nummer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Objekt
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Notizen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auftrag.anlagen?.map((anlage) => (
                      <tr key={anlage.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {anlage.anlage_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {anlage.t_nummer || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {anlage.objekt_name}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {anlage.sichtbar && <Eye className="h-4 w-4 text-green-500" />}
                            {anlage.such_modus && <Search className="h-4 w-4 text-yellow-500" />}
                            {anlage.bearbeitet && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {anlage.notizen || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fortschritt' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {fortschritt.length} Aktivitäten
                </div>
                <button
                  onClick={exportFortschritt}
                  className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </button>
              </div>

              {loadingFortschritt ? (
                <div className="text-center py-8 text-gray-500">
                  Lade Fortschritt...
                </div>
              ) : fortschritt.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Aktivitäten vorhanden
                </div>
              ) : (
                <div className="space-y-3">
                  {fortschritt.map((eintrag) => (
                    <div key={eintrag.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {eintrag.anlage_name}
                            </span>
                            {eintrag.t_nummer && (
                              <span className="text-sm text-gray-500">
                                ({eintrag.t_nummer})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {eintrag.aktion} von {eintrag.benutzer_name || eintrag.benutzer_email}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(eintrag.created_at).toLocaleString('de-DE')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatenaufnahmeDetailModal;