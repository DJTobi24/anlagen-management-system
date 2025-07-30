import React, { useState, useEffect } from 'react';
import { Camera, Search, CheckCircle, AlertCircle, Package, Building2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import datenaufnahmeService from '../services/datenaufnahmeService';
import anlageService from '../services/anlageService';
import { DatenaufnahmeAuftrag, DatenaufnahmeAnlage } from '../types/datenaufnahme';
import AnlageBearbeitenModal from '../components/AnlageBearbeitenModal';

const MeineDatenaufnahmen: React.FC = () => {
  const { user } = useAuth();
  const [auftraege, setAuftraege] = useState<DatenaufnahmeAuftrag[]>([]);
  const [selectedAuftrag, setSelectedAuftrag] = useState<DatenaufnahmeAuftrag | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSuchModus, setFilterSuchModus] = useState(false);
  const [filterBearbeitet, setFilterBearbeitet] = useState<'all' | 'bearbeitet' | 'offen'>('all');
  const [selectedAnlage, setSelectedAnlage] = useState<DatenaufnahmeAnlage | null>(null);
  const [selectedAnlageDetails, setSelectedAnlageDetails] = useState<any>(null);
  const [showBearbeitenModal, setShowBearbeitenModal] = useState(false);

  useEffect(() => {
    loadMeineAuftraege();
  }, []);

  const loadMeineAuftraege = async () => {
    try {
      setLoading(true);
      const data = await datenaufnahmeService.getDatenaufnahmen({
        zugewiesen_an: user?.id,
        status: 'in_bearbeitung'
      });
      
      // Lade Details für jeden Auftrag
      const detailsPromises = data.map(auftrag => 
        datenaufnahmeService.getDatenaufnahme(auftrag.id)
      );
      const auftraegeWithDetails = await Promise.all(detailsPromises);
      
      setAuftraege(auftraegeWithDetails);
      
      // Automatisch ersten Auftrag auswählen
      if (auftraegeWithDetails.length > 0 && !selectedAuftrag) {
        setSelectedAuftrag(auftraegeWithDetails[0]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Aufträge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnlageBearbeiten = async (anlage: DatenaufnahmeAnlage) => {
    try {
      // Lade vollständige Anlage-Daten
      const anlageDetails = await anlageService.getAnlage(anlage.anlage_id);
      setSelectedAnlage(anlage);
      setSelectedAnlageDetails(anlageDetails);
      setShowBearbeitenModal(true);
    } catch (error) {
      console.error('Fehler beim Laden der Anlage:', error);
    }
  };

  const handleAnlageUpdate = async (anlageId: string, updateData: any) => {
    if (!selectedAuftrag || !selectedAnlage || !selectedAnlageDetails) return;

    try {
      // Markiere als bearbeitet
      await datenaufnahmeService.markAnlageBearbeitet(
        selectedAuftrag.id,
        anlageId,
        {
          notizen: updateData.notizen,
          alte_werte: selectedAnlageDetails,
          neue_werte: updateData
        }
      );

      // Aktualisiere Anlage
      await anlageService.updateAnlage(anlageId, updateData);

      // Neu laden
      await loadMeineAuftraege();
      setShowBearbeitenModal(false);
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const getFilteredAnlagen = () => {
    if (!selectedAuftrag?.anlagen) return [];

    let filtered = selectedAuftrag.anlagen.filter(a => a.sichtbar);

    if (filterSuchModus) {
      filtered = filtered.filter(a => a.such_modus);
    }

    if (filterBearbeitet === 'bearbeitet') {
      filtered = filtered.filter(a => a.bearbeitet);
    } else if (filterBearbeitet === 'offen') {
      filtered = filtered.filter(a => !a.bearbeitet);
    }

    return filtered;
  };

  const filteredAnlagen = getFilteredAnlagen();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Datenaufnahmen...</p>
        </div>
      </div>
    );
  }

  if (auftraege.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Keine Datenaufnahmen</h2>
          <p className="mt-2 text-gray-500">
            Ihnen wurden noch keine Datenaufnahme-Aufträge zugewiesen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Seitenleiste mit Aufträgen */}
      <div className="w-80 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Meine Aufträge</h2>
          <p className="text-sm text-gray-500 mt-1">
            {auftraege.length} aktive {auftraege.length === 1 ? 'Auftrag' : 'Aufträge'}
          </p>
        </div>

        <div className="p-2">
          {auftraege.map((auftrag) => (
            <button
              key={auftrag.id}
              onClick={() => setSelectedAuftrag(auftrag)}
              className={`w-full text-left p-4 rounded-lg mb-2 transition-colors ${
                selectedAuftrag?.id === auftrag.id
                  ? 'bg-blue-50 border-blue-300 border'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <h3 className="font-medium text-gray-900 mb-1">{auftrag.titel}</h3>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {auftrag.anzahl_liegenschaften || 0}
                </span>
                <span className="flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  {auftrag.anzahl_anlagen || 0}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Fortschritt</span>
                  <span>{auftrag.statistik?.fortschritt_prozent || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${auftrag.statistik?.fortschritt_prozent || 0}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hauptbereich */}
      <div className="flex-1 overflow-hidden">
        {selectedAuftrag ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedAuftrag.titel}
                  </h1>
                  {selectedAuftrag.beschreibung && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedAuftrag.beschreibung}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedAuftrag.statistik?.gesamt_anlagen || 0}
                    </div>
                    <div className="text-xs text-gray-500">Gesamt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedAuftrag.statistik?.bearbeitete_anlagen || 0}
                    </div>
                    <div className="text-xs text-gray-500">Bearbeitet</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedAuftrag.statistik?.such_modus_anlagen || 0}
                    </div>
                    <div className="text-xs text-gray-500">Zu suchen</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterSuchModus}
                    onChange={(e) => setFilterSuchModus(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Nur zu suchende Anlagen
                  </span>
                </label>

                <select
                  value={filterBearbeitet}
                  onChange={(e) => setFilterBearbeitet(e.target.value as any)}
                  className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Alle Anlagen</option>
                  <option value="offen">Offene Anlagen</option>
                  <option value="bearbeitet">Bearbeitete Anlagen</option>
                </select>

                <div className="ml-auto text-sm text-gray-500">
                  {filteredAnlagen.length} von {selectedAuftrag.anlagen?.length || 0} Anlagen
                </div>
              </div>
            </div>

            {/* Anlagen-Liste */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAnlagen.map((anlage) => (
                  <div
                    key={anlage.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all ${
                      anlage.bearbeitet
                        ? 'border-green-200 hover:border-green-300'
                        : anlage.such_modus
                        ? 'border-yellow-200 hover:border-yellow-300'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleAnlageBearbeiten(anlage)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 flex-1">
                        {anlage.anlage_name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {anlage.such_modus && (
                          <Search className="h-4 w-4 text-yellow-500" />
                        )}
                        {anlage.bearbeitet && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {anlage.t_nummer && (
                        <div>T-Nr: {anlage.t_nummer}</div>
                      )}
                      {anlage.aks_code && (
                        <div>AKS: {anlage.aks_code}</div>
                      )}
                      <div className="text-xs">
                        {anlage.objekt_name} • {anlage.liegenschaft_name}
                      </div>
                    </div>

                    {anlage.notizen && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                        {anlage.notizen}
                      </div>
                    )}

                    {anlage.bearbeitet && anlage.bearbeitet_am && (
                      <div className="mt-2 text-xs text-gray-500">
                        Bearbeitet am {new Date(anlage.bearbeitet_am).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredAnlagen.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Keine Anlagen entsprechen den Filterkriterien
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Wählen Sie einen Auftrag aus der Liste aus
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal für Anlage bearbeiten */}
      {showBearbeitenModal && selectedAnlage && (
        <AnlageBearbeitenModal
          isOpen={showBearbeitenModal}
          onClose={() => {
            setShowBearbeitenModal(false);
            setSelectedAnlage(null);
          }}
          anlage={selectedAnlageDetails}
          datenaufnahmeContext={{
            aufnahmeId: selectedAuftrag!.id,
            suchModus: selectedAnlage.such_modus,
            notizen: selectedAnlage.notizen
          }}
          onUpdate={handleAnlageUpdate}
        />
      )}
    </div>
  );
};

export default MeineDatenaufnahmen;