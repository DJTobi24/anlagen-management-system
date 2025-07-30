import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Building2, Package, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { db, CachedAuftrag } from '../db/database';
import { apiClient } from '../services/api';
import { useSync } from '../contexts/SyncContext';

export default function AufnahmenList() {
  const [auftraege, setAuftraege] = useState<CachedAuftrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOnline } = useSync();

  useEffect(() => {
    loadAuftraege();
  }, []);

  const loadAuftraege = async () => {
    try {
      setError('');
      
      if (isOnline) {
        // Try to load from API first
        try {
          // Versuche zuerst den meine-auftraege Endpoint
          let data;
          try {
            data = await apiClient.get('/datenaufnahme/meine-auftraege');
          } catch (error: any) {
            // Falls der Endpoint nicht existiert, verwende den normalen mit Filter
            console.log('Trying alternative endpoint...');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
              const response = await apiClient.get(`/datenaufnahme?zugewiesen_an=${user.id}&status=in_bearbeitung`);
              data = response.data || response;
            } else {
              throw error;
            }
          }
          setAuftraege(data);
          
          // Cache for offline use
          for (const auftrag of data) {
            await db.cacheAuftrag(auftrag);
          }
        } catch (apiError) {
          // Fall back to cached data
          const cached = await db.getCachedAuftraege();
          setAuftraege(cached);
          if (cached.length === 0) {
            setError('Keine Aufträge verfügbar. Bitte synchronisieren Sie online.');
          }
        }
      } else {
        // Load from cache when offline
        const cached = await db.getCachedAuftraege();
        setAuftraege(cached);
      }
    } catch (err: any) {
      setError('Fehler beim Laden der Aufträge');
      console.error('Error loading Aufträge:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vorbereitet':
        return 'bg-blue-100 text-blue-800';
      case 'in_bearbeitung':
        return 'bg-yellow-100 text-yellow-800';
      case 'abgeschlossen':
        return 'bg-green-100 text-green-800';
      case 'pausiert':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'vorbereitet':
        return 'Vorbereitet';
      case 'in_bearbeitung':
        return 'In Bearbeitung';
      case 'abgeschlossen':
        return 'Abgeschlossen';
      case 'pausiert':
        return 'Pausiert';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            {!isOnline && (
              <p className="text-xs text-red-600 mt-1">
                Sie sind offline. Bitte verbinden Sie sich mit dem Internet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Meine Aufnahmen</h2>
      
      {auftraege.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Keine Aufträge zugewiesen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auftraege.map((auftrag) => (
            <Link
              key={auftrag.id}
              to={`/aufnahmen/${auftrag.id}`}
              className="block card hover:shadow-md transition-shadow touch-active"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{auftrag.titel}</h3>
                    {auftrag.localChanges && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        Lokal geändert
                      </span>
                    )}
                  </div>
                  
                  {auftrag.beschreibung && (
                    <p className="text-sm text-gray-600 mb-2">{auftrag.beschreibung}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {auftrag.start_datum && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(auftrag.start_datum), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                    )}
                    
                    {auftrag.liegenschaften && auftrag.liegenschaften.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{auftrag.liegenschaften.length} Liegenschaft(en)</span>
                      </div>
                    )}
                    
                    {auftrag.anlagen && (
                      <div className="flex items-center space-x-1">
                        <Package className="h-3 w-3" />
                        <span>{auftrag.anlagen.length} Anlagen</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(auftrag.status)}`}>
                      {getStatusText(auftrag.status)}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}