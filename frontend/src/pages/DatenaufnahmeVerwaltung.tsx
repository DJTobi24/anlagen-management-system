import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Users, Building2, Package, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import datenaufnahmeService from '../services/datenaufnahmeService';
import { DatenaufnahmeAuftrag, DatenaufnahmeFilter } from '../types/datenaufnahme';
import CreateDatenaufnahmeModal from '../components/CreateDatenaufnahmeModal';
import DatenaufnahmeDetailModal from '../components/DatenaufnahmeDetailModal';

const DatenaufnahmeVerwaltung: React.FC = () => {
  const { user } = useAuth();
  const [auftraege, setAuftraege] = useState<DatenaufnahmeAuftrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAuftrag, setSelectedAuftrag] = useState<DatenaufnahmeAuftrag | null>(null);
  const [filter, setFilter] = useState<DatenaufnahmeFilter>({});

  useEffect(() => {
    loadAuftraege();
  }, [filter]);

  const loadAuftraege = async () => {
    try {
      setLoading(true);
      const data = await datenaufnahmeService.getDatenaufnahmen(filter);
      setAuftraege(data);
    } catch (error) {
      console.error('Fehler beim Laden der Datenaufnahmen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setFilter({ ...filter, status: status || undefined });
  };

  const handleViewDetails = async (auftrag: DatenaufnahmeAuftrag) => {
    try {
      const details = await datenaufnahmeService.getDatenaufnahme(auftrag.id);
      setSelectedAuftrag(details);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Fehler beim Laden der Details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie diese Datenaufnahme wirklich löschen?')) {
      try {
        await datenaufnahmeService.deleteDatenaufnahme(id);
        loadAuftraege();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      vorbereitet: { color: 'bg-blue-100 text-blue-800', text: 'Vorbereitet' },
      in_bearbeitung: { color: 'bg-yellow-100 text-yellow-800', text: 'In Bearbeitung' },
      abgeschlossen: { color: 'bg-green-100 text-green-800', text: 'Abgeschlossen' },
      pausiert: { color: 'bg-gray-100 text-gray-800', text: 'Pausiert' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const canCreateAuftraege = user?.rolle === 'admin' || user?.rolle === 'supervisor';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Datenaufnahme-Verwaltung</h1>
        <p className="text-gray-600 mt-2">
          Erstellen und verwalten Sie Datenaufnahme-Aufträge für Ihre Mitarbeiter.
        </p>
      </div>

      {/* Filter und Aktionen */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filter.status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="">Alle Status</option>
                <option value="vorbereitet">Vorbereitet</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="pausiert">Pausiert</option>
              </select>
            </div>
            
            {canCreateAuftraege && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neue Datenaufnahme
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auftrags-Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fortschritt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Umfang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt am
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Lade Datenaufnahmen...
                  </td>
                </tr>
              ) : auftraege.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Keine Datenaufnahmen gefunden
                  </td>
                </tr>
              ) : (
                auftraege.map((auftrag) => (
                  <tr key={auftrag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {auftrag.titel}
                        </div>
                        {auftrag.beschreibung && (
                          <div className="text-sm text-gray-500">
                            {auftrag.beschreibung.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {auftrag.mitarbeiter_name || auftrag.mitarbeiter_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(auftrag.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                auftrag.anzahl_anlagen 
                                  ? (auftrag.anzahl_bearbeitet! / auftrag.anzahl_anlagen) * 100 
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {auftrag.anzahl_bearbeitet || 0}/{auftrag.anzahl_anlagen || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                          {auftrag.anzahl_liegenschaften || 0}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1 text-gray-400" />
                          {auftrag.anzahl_objekte || 0}
                        </div>
                        <div className="flex items-center">
                          <Search className="h-4 w-4 mr-1 text-gray-400" />
                          {auftrag.anzahl_anlagen || 0}
                          {(auftrag.zu_suchende_anlagen || 0) > 0 && (
                            <span className="ml-1 text-xs text-orange-600">
                              ({auftrag.zu_suchende_anlagen})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(auftrag.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(auftrag)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Details anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canCreateAuftraege && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAuftrag(auftrag);
                                setShowCreateModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Bearbeiten"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(auftrag.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDatenaufnahmeModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedAuftrag(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedAuftrag(null);
            loadAuftraege();
          }}
          auftrag={selectedAuftrag}
        />
      )}

      {showDetailModal && selectedAuftrag && (
        <DatenaufnahmeDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAuftrag(null);
          }}
          auftrag={selectedAuftrag}
          onUpdate={loadAuftraege}
        />
      )}
    </div>
  );
};

export default DatenaufnahmeVerwaltung;