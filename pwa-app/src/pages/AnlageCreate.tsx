import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { db, CachedAuftrag, CachedObjekt } from '../db/database';
import { apiClient } from '../services/api';
import { useSync } from '../contexts/SyncContext';

export default function AnlageCreate() {
  const { aufnahmeId } = useParams<{ aufnahmeId: string }>();
  const navigate = useNavigate();
  const { isOnline } = useSync();
  const aksDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [auftrag, setAuftrag] = useState<CachedAuftrag | null>(null);
  const [objekte, setObjekte] = useState<CachedObjekt[]>([]);
  const [aksCodes, setAksCodes] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingAks, setSearchingAks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchAks, setSearchAks] = useState('');
  const [showAksDropdown, setShowAksDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    objektId: '',
    aksCode: '',
    tNummer: '',
    name: '',
    description: '',
    status: 'aktiv',
    zustandsBewertung: 3,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadData();
    generateNNumber();
  }, [aufnahmeId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aksDropdownRef.current && !aksDropdownRef.current.contains(event.target as Node)) {
        setShowAksDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateNNumber = () => {
    // Generate a unique N-Number for new Anlagen
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const nNumber = `N-${timestamp}-${random}`;
    setFormData(prev => ({ ...prev, tNummer: nNumber }));
  };

  const loadData = async () => {
    try {
      // Load Auftrag
      const cachedAuftrag = await db.auftraege.get(aufnahmeId!);
      if (cachedAuftrag) {
        setAuftrag(cachedAuftrag);
        
        // Load Objekte from Auftrag
        if (cachedAuftrag.objekte) {
          setObjekte(cachedAuftrag.objekte);
        }
      }
      
      // For offline mode, load cached AKS codes
      if (!isOnline) {
        const codes = await db.aksCodes.toArray();
        console.log('Loaded AKS codes from cache:', codes.length);
        setAksCodes(codes);
      }
      // For online mode, we'll search on demand
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search AKS codes from API
  const searchAksCodesFromApi = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingAks(true);
    try {
      console.log('Searching AKS codes for:', searchTerm);
      
      // Try multiple search strategies
      let response;
      try {
        // First try: Use the main endpoint with search parameters
        response = await apiClient.get(`/aks?code=${encodeURIComponent(searchTerm)}&name=${encodeURIComponent(searchTerm)}&limit=50`);
      } catch (error) {
        // Fallback: Try just the main endpoint
        console.log('Trying fallback search...');
        response = await apiClient.get(`/aks?limit=1000`);
      }
      
      let codes = [];
      if (response.data && response.data.codes) {
        codes = response.data.codes;
      } else if (response.codes) {
        codes = response.codes;
      } else if (Array.isArray(response)) {
        codes = response;
      }
      
      // If we got all codes, filter them client-side
      if (codes.length > 100) {
        const searchLower = searchTerm.toLowerCase();
        codes = codes.filter((aks: any) => 
          aks.code?.toLowerCase().includes(searchLower) ||
          aks.name?.toLowerCase().includes(searchLower) ||
          aks.description?.toLowerCase().includes(searchLower)
        ).slice(0, 20);
      }
      
      console.log('Search results:', codes.length);
      setSearchResults(codes);
    } catch (error) {
      console.error('Failed to search AKS codes:', error);
      setSearchResults([]);
    } finally {
      setSearchingAks(false);
    }
  };

  // Handle search input change with debouncing
  const handleAksSearchChange = (value: string) => {
    setSearchAks(value);
    setShowAksDropdown(true);
    
    if (formData.aksCode && !value) {
      setFormData({ ...formData, aksCode: '' });
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    if (isOnline) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAksCodesFromApi(value);
      }, 300);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.objektId) {
      newErrors.objektId = 'Bitte wählen Sie ein Objekt aus';
    }
    
    if (!formData.aksCode) {
      newErrors.aksCode = 'Bitte wählen Sie einen AKS-Code aus';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setSaveMessage('');
    
    try {
      // Generate a temporary ID for the new Anlage
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the new Anlage locally
      const newAnlage = {
        id: tempId,
        aufnahme_id: aufnahmeId!,
        anlage_id: tempId, // Will be replaced by server
        objekt_id: formData.objektId,
        aks_code: formData.aksCode,
        t_nummer: formData.tNummer || undefined,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        zustands_bewertung: formData.zustandsBewertung,
        qr_code: undefined,
        dynamic_fields: {},
        sichtbar: true,
        such_modus: false,
        notizen: '',
        bearbeitet: false,
        bearbeitet_am: undefined,
        localChanges: true,
        isNew: true, // Mark as new for sync
      };
      
      // Save to local database
      await db.anlagen.add(newAnlage);
      
      // Add to sync queue
      await db.addToSyncQueue({
        type: 'CREATE_ANLAGE' as any,
        entityId: tempId,
        data: {
          objektId: formData.objektId,
          aksCode: formData.aksCode,
          tNummer: formData.tNummer,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          zustandsBewertung: formData.zustandsBewertung,
          aufnahmeId: aufnahmeId,
        }
      });
      
      // Mark Auftrag as having local changes
      await db.auftraege.update(aufnahmeId!, { localChanges: true });
      
      setSaveMessage('Anlage wurde lokal erstellt und wird später synchronisiert');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/aufnahmen/${aufnahmeId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating Anlage:', error);
      setSaveMessage('Fehler beim Erstellen der Anlage');
    } finally {
      setSaving(false);
    }
  };

  // Use search results when online, filtered local codes when offline
  const displayedAksCodes = isOnline ? searchResults : aksCodes.filter(aks => {
    if (!searchAks) return false;
    const searchLower = searchAks.toLowerCase();
    const codeMatch = aks.code?.toLowerCase().includes(searchLower);
    const nameMatch = aks.name?.toLowerCase().includes(searchLower);
    const descMatch = aks.description?.toLowerCase().includes(searchLower);
    return codeMatch || nameMatch || descMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/aufnahmen/${aufnahmeId}`)}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-lg touch-active"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Neue Anlage erstellen</h2>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {saveMessage && (
            <div className={`
              p-3 rounded-lg
              ${saveMessage.includes('Fehler') 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
              }
            `}>
              {saveMessage}
            </div>
          )}

          {/* Objekt Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objekt *
            </label>
            <select
              value={formData.objektId}
              onChange={(e) => setFormData({ ...formData, objektId: e.target.value })}
              className={`input ${errors.objektId ? 'border-red-500' : ''}`}
            >
              <option value="">Bitte wählen...</option>
              {objekte.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
            {errors.objektId && (
              <p className="text-sm text-red-600 mt-1">{errors.objektId}</p>
            )}
          </div>

          {/* AKS Code Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AKS-Code * {!isOnline && aksCodes.length === 0 && <span className="text-xs text-gray-500">(Offline - keine Codes im Cache)</span>}
              {isOnline && <span className="text-xs text-gray-500">(Online - Suche auf Server)</span>}
            </label>
            <div className="relative" ref={aksDropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={isOnline ? "Mindestens 2 Zeichen eingeben..." : "Code oder Name suchen..."}
                  value={searchAks}
                  onChange={(e) => handleAksSearchChange(e.target.value)}
                  onFocus={() => setShowAksDropdown(true)}
                  className={`input pl-10 pr-3 ${errors.aksCode ? 'border-red-500' : ''}`}
                />
              </div>
              
              {/* Selected AKS Code Display */}
              {formData.aksCode && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium">{formData.aksCode}</span>
                  {' - '}
                  <span>
                    {searchResults.find(a => a.code === formData.aksCode)?.name || 
                     aksCodes.find(a => a.code === formData.aksCode)?.name || 
                     'Name wird geladen...'}
                  </span>
                </div>
              )}
              
              {/* Loading indicator */}
              {searchingAks && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-gray-500">Suche läuft...</span>
                  </div>
                </div>
              )}
              
              {/* Dropdown Results */}
              {!searchingAks && showAksDropdown && searchAks && displayedAksCodes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {displayedAksCodes.slice(0, 20).map((aks) => (
                    <button
                      key={aks.code}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, aksCode: aks.code });
                        setSearchAks(aks.code);
                        setShowAksDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium text-sm">{aks.code}</div>
                      <div className="text-xs text-gray-600">{aks.name}</div>
                    </button>
                  ))}
                  {displayedAksCodes.length > 20 && (
                    <div className="px-3 py-2 text-xs text-gray-500 border-t">
                      Weitere Ergebnisse vorhanden - verfeinern Sie die Suche
                    </div>
                  )}
                </div>
              )}
              
              {/* No Results */}
              {!searchingAks && showAksDropdown && searchAks && displayedAksCodes.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <p className="text-sm text-gray-500">Keine Ergebnisse gefunden</p>
                </div>
              )}
            </div>
            {errors.aksCode && (
              <p className="text-sm text-red-600 mt-1">{errors.aksCode}</p>
            )}
          </div>

          {/* N-Nummer (automatisch generiert) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nummer (automatisch)
            </label>
            <input
              type="text"
              value={formData.tNummer}
              readOnly
              className="input bg-gray-50"
              title="Automatisch generierte N-Nummer für neue Anlagen"
            />
            <p className="text-xs text-gray-500 mt-1">
              Neue Anlagen erhalten eine temporäre N-Nummer
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Anlagenbezeichnung"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input"
              placeholder="Zusätzliche Informationen zur Anlage..."
            />
          </div>

          {/* Status */}
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

          {/* Zustandsbewertung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zustandsbewertung (1-5)
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, zustandsBewertung: value })}
                  className={`
                    flex-1 py-3 rounded-lg font-medium transition-colors touch-active
                    ${formData.zustandsBewertung === value
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

          {!isOnline && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                Die Anlage wird lokal gespeichert und bei der nächsten Internetverbindung synchronisiert.
              </p>
            </div>
          )}
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
          <span>{saving ? 'Speichern...' : 'Anlage erstellen'}</span>
        </button>
      </div>
    </div>
  );
}