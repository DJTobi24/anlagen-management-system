import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { db, CachedAnlage } from '../db/database';
import { apiClient } from '../services/api';
import { useSync } from '../contexts/SyncContext';

export default function AnlageDetail() {
  const { aufnahmeId, anlageId } = useParams<{ aufnahmeId: string; anlageId: string }>();
  const navigate = useNavigate();
  const { isOnline } = useSync();
  
  const [anlage, setAnlage] = useState<CachedAnlage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    zustands_bewertung: 0,
    notizen: '',
    description: '',
  });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (anlageId) {
      loadAnlage();
    }
  }, [anlageId]);

  const loadAnlage = async () => {
    try {
      // First try to load from cache
      const cachedAnlage = await db.anlagen
        .where('anlage_id')
        .equals(anlageId!)
        .first();
      
      if (cachedAnlage) {
        setAnlage(cachedAnlage);
        setFormData({
          status: cachedAnlage.status || 'aktiv',
          zustands_bewertung: cachedAnlage.zustands_bewertung || 1,
          notizen: cachedAnlage.notizen || '',
          description: cachedAnlage.description || '',
        });
      } else {
        // If not in cache, we can't load the Anlage details
        // This shouldn't happen in normal flow as Anlagen are loaded with Aufträge
        console.warn(`Anlage ${anlageId} not found in cache`);
        setAnlage(null);
      }
    } catch (error) {
      console.error('Error loading Anlage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!anlage || !aufnahmeId) return;

    setSaving(true);
    setSaveMessage('');

    try {
      // Update locally (without notizen - that's only for the Datenaufnahme)
      const anlageUpdate = {
        status: formData.status,
        zustands_bewertung: formData.zustands_bewertung,
        description: formData.description,
      };
      await db.updateAnlageLocally(anlage.anlage_id, anlageUpdate);
      
      // Mark as bearbeitet
      await db.markAnlageBearbeitetLocally(aufnahmeId, anlage.anlage_id, {
        notizen: formData.notizen,
        alte_werte: {
          status: anlage.status,
          zustands_bewertung: anlage.zustands_bewertung,
          description: anlage.description,
        },
        neue_werte: formData,
      });

      // Try to sync if online
      if (isOnline) {
        try {
          await apiClient.put(`/anlagen/${anlage.anlage_id}`, {
            status: formData.status,
            zustandsBewertung: formData.zustands_bewertung,
            description: formData.description
          });
          await apiClient.post(`/datenaufnahme/${aufnahmeId}/anlagen/${anlage.anlage_id}/bearbeitet`, {
            notizen: formData.notizen,
          });
          
          // Remove from sync queue after successful sync
          await db.removeSyncedItems(anlage.anlage_id, 'UPDATE_ANLAGE');
          await db.removeSyncedItems(`${aufnahmeId}:${anlage.anlage_id}`, 'MARK_BEARBEITET');
          
          // Update anlage to remove localChanges flag
          await db.anlagen.update(anlage.id, {
            localChanges: false,
            pendingChanges: undefined
          });
          
          setSaveMessage('Erfolgreich gespeichert und synchronisiert');
        } catch (syncError) {
          setSaveMessage('Lokal gespeichert - wird später synchronisiert');
        }
      } else {
        setSaveMessage('Offline gespeichert - wird später synchronisiert');
      }

      // Reload anlage to show updated state
      await loadAnlage();
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/aufnahmen/${aufnahmeId}`);
      }, 1500);
      
    } catch (error: any) {
      setSaveMessage('Fehler beim Speichern');
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!anlage) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Anlage nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/aufnahmen/${aufnahmeId}`)}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-lg touch-active"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{anlage.name}</h2>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                {anlage.t_nummer && <span>T-Nr: {anlage.t_nummer}</span>}
                {anlage.aks_code && <span>AKS: {anlage.aks_code}</span>}
              </div>
            </div>
          </div>
          
          {anlage.bearbeitet && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Bearbeitet</span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {saveMessage && (
            <div className={`
              p-3 rounded-lg flex items-start space-x-2
              ${saveMessage.includes('Fehler') 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
              }
            `}>
              {saveMessage.includes('Fehler') ? (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                saveMessage.includes('Fehler') ? 'text-red-700' : 'text-green-700'
              }`}>
                {saveMessage}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="aktiv">Aktiv</option>
              <option value="wartung">Wartung</option>
              <option value="defekt">Defekt</option>
              <option value="inaktiv">Inaktiv</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zustandsbewertung (1-5)
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, zustands_bewertung: value })}
                  className={`
                    flex-1 py-3 rounded-lg font-medium transition-colors touch-active
                    ${formData.zustands_bewertung === value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 = Sehr gut, 5 = Sehr schlecht
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input"
              placeholder="Zustandsbeschreibung..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen zur Aufnahme
            </label>
            <textarea
              value={formData.notizen}
              onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
              rows={3}
              className="input"
              placeholder="Besonderheiten, Probleme, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos
            </label>
            <button
              type="button"
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors touch-active"
            >
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Foto aufnehmen</p>
              <p className="text-xs text-gray-500 mt-1">
                (Funktion in Entwicklung)
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white border-t border-gray-200 p-4 safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichern...' : 'Speichern & Zurück'}</span>
        </button>
      </div>
    </div>
  );
}