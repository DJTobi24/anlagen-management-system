import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Eye, EyeOff, Filter, Package, Plus, PlayCircle, Pause, Clock } from 'lucide-react';
import { db, CachedAuftrag, CachedAnlage } from '../db/database';
import { useSync } from '../contexts/SyncContext';

export default function AnlagenList() {
  const { aufnahmeId } = useParams<{ aufnahmeId: string }>();
  const navigate = useNavigate();
  const { isOnline } = useSync();
  const [auftrag, setAuftrag] = useState<CachedAuftrag | null>(null);
  const [anlagen, setAnlagen] = useState<CachedAnlage[]>([]);
  const [filteredAnlagen, setFilteredAnlagen] = useState<CachedAnlage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'search' | 'completed' | 'pending'>('all');
  const [changingStatus, setChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (aufnahmeId) {
      loadAuftragAndAnlagen();
    }
  }, [aufnahmeId]);

  useEffect(() => {
    filterAnlagen();
  }, [anlagen, searchTerm, filterMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-menu-container')) {
        setShowStatusMenu(false);
      }
    };

    if (showStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusMenu]);

  const loadAuftragAndAnlagen = async () => {
    try {
      const cachedAuftrag = await db.auftraege.get(aufnahmeId!);
      if (cachedAuftrag) {
        setAuftrag(cachedAuftrag);
        
        const cachedAnlagen = await db.anlagen
          .where('aufnahme_id')
          .equals(aufnahmeId!)
          .and(anlage => anlage.sichtbar)
          .toArray();
        
        setAnlagen(cachedAnlagen);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnlagen = () => {
    let filtered = [...anlagen];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(anlage =>
        anlage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.t_nummer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.aks_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mode filter
    switch (filterMode) {
      case 'search':
        filtered = filtered.filter(a => a.such_modus);
        break;
      case 'completed':
        filtered = filtered.filter(a => a.bearbeitet);
        break;
      case 'pending':
        filtered = filtered.filter(a => !a.bearbeitet);
        break;
    }

    setFilteredAnlagen(filtered);
  };

  const getFilterCount = (mode: string) => {
    switch (mode) {
      case 'search':
        return anlagen.filter(a => a.such_modus).length;
      case 'completed':
        return anlagen.filter(a => a.bearbeitet).length;
      case 'pending':
        return anlagen.filter(a => !a.bearbeitet).length;
      default:
        return anlagen.length;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!auftrag) return;
    
    try {
      setChangingStatus(true);
      
      // Update local database
      await db.auftraege.update(aufnahmeId!, { 
        status: newStatus as any,
        localChanges: true
      });
      
      // Add to sync queue
      await db.addToSyncQueue({
        type: 'UPDATE_AUFTRAG_STATUS',
        entityId: aufnahmeId!,
        data: { status: newStatus }
      });
      
      // Update local state
      setAuftrag({
        ...auftrag,
        status: newStatus as any,
        localChanges: true
      });
      
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Fehler beim Ändern des Status');
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vorbereitet':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_bearbeitung':
        return <PlayCircle className="h-4 w-4 text-yellow-500" />;
      case 'abgeschlossen':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pausiert':
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!auftrag) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Auftrag nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={() => navigate('/aufnahmen')}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-lg touch-active"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 flex-1">{auftrag.titel}</h2>
          <button
            onClick={() => navigate(`/aufnahmen/${aufnahmeId}/anlagen/neu`)}
            className="p-2 hover:bg-gray-100 rounded-lg touch-active"
            title="Neue Anlage erstellen"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Status Section */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex items-center space-x-1">
                {getStatusIcon(auftrag.status)}
                <span className={`text-sm font-medium ${
                  auftrag.status === 'abgeschlossen' ? 'text-green-700' :
                  auftrag.status === 'in_bearbeitung' ? 'text-yellow-700' :
                  auftrag.status === 'pausiert' ? 'text-orange-700' :
                  'text-blue-700'
                }`}>
                  {getStatusText(auftrag.status)}
                </span>
              </div>
            </div>
            
            {auftrag.status !== 'abgeschlossen' && getNextStatuses(auftrag.status).length > 0 && (
              <div className="relative status-menu-container">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={changingStatus}
                  className="px-3 py-1 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Status ändern
                </button>
                
                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    {getNextStatuses(auftrag.status).map((nextStatus) => (
                      <button
                        key={nextStatus.value}
                        onClick={() => handleStatusChange(nextStatus.value)}
                        disabled={changingStatus}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                      >
                        {nextStatus.icon}
                        <span>{nextStatus.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {auftrag.localChanges && (
            <div className="mt-2 text-xs text-orange-600 flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Status lokal geändert - wird synchronisiert</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Suche nach Name, T-Nummer..."
            className="input pl-10"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'Alle', icon: null },
            { id: 'search', label: 'Zu suchen', icon: Search },
            { id: 'pending', label: 'Offen', icon: Eye },
            { id: 'completed', label: 'Bearbeitet', icon: CheckCircle },
          ].map((filter) => {
            const count = getFilterCount(filter.id);
            const Icon = filter.icon;
            
            return (
              <button
                key={filter.id}
                onClick={() => setFilterMode(filter.id as any)}
                className={`
                  flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium
                  whitespace-nowrap transition-colors touch-active
                  ${filterMode === filter.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{filter.label}</span>
                <span className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded-full
                  ${filterMode === filter.id
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Anlagen List */}
      <div className="flex-1 overflow-auto p-4">
        {filteredAnlagen.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterMode !== 'all'
                ? 'Keine Anlagen gefunden'
                : 'Keine Anlagen vorhanden'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAnlagen.map((anlage) => (
              <Link
                key={anlage.id}
                to={`/aufnahmen/${aufnahmeId}/anlagen/${anlage.anlage_id}`}
                className="block card hover:shadow-md transition-shadow touch-active"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{anlage.name}</h3>
                      {anlage.localChanges && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          Lokal
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      {anlage.t_nummer && (
                        <span>T-Nr: {anlage.t_nummer}</span>
                      )}
                      {anlage.aks_code && (
                        <span>AKS: {anlage.aks_code}</span>
                      )}
                    </div>

                    {anlage.notizen && (
                      <p className="text-sm text-gray-600 mt-2">{anlage.notizen}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    {anlage.such_modus && (
                      <div className="bg-yellow-100 text-yellow-700 p-1.5 rounded">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                    {anlage.bearbeitet ? (
                      <div className="bg-green-100 text-green-700 p-1.5 rounded">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 p-1.5 rounded">
                        <Eye className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}