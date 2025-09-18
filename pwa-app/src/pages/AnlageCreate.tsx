import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, Camera, QrCode } from 'lucide-react';
import { db, CachedAuftrag, CachedObjekt } from '../db/database';
import { apiClient } from '../services/api';
import { useSync } from '../contexts/SyncContext';
import UniversalScanner from '../components/UniversalScanner';
import PhotoUpload from '../components/PhotoUpload';

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
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'anlage' | 'hersteller' | null>(null);
  
  // AKS Field Mapping für Pflichtfelder
  const [aksFieldMapping, setAksFieldMapping] = useState<any>(null);
  const [loadingFields, setLoadingFields] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  
  const [formData, setFormData] = useState({
    objektId: '',
    aksCode: '',
    tNummer: '',
    name: '',
    description: '',
    status: 'aktiv',
    zustandsBewertung: 3,
    // Standard Felder
    etage: '',
    raum: '',
    anzahl: 1,
    hersteller: '',
    typ: '',
    seriennummer: '',
    baujahr: '',
    qrCodeManual: '',
    herstellerQrData: '',
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  
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
        } else if (cachedAuftrag.liegenschaften && cachedAuftrag.liegenschaften.length > 0) {
          // Fallback: Load Objekte from first Liegenschaft
          const firstLiegenschaft = cachedAuftrag.liegenschaften[0];
          if (firstLiegenschaft.objekte) {
            setObjekte(firstLiegenschaft.objekte);
          }
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

  // Load AKS Field Mapping when AKS Code is selected
  const loadAksFieldMapping = async (aksCode: string) => {
    if (!aksCode) {
      setAksFieldMapping(null);
      setDynamicFields({});
      return;
    }
    
    // Only try to load field mapping if online
    if (!isOnline) {
      console.log('Offline - cannot load AKS field mapping');
      // TODO: In future, cache field mappings for offline use
      return;
    }
    
    setLoadingFields(true);
    try {
      console.log('Loading field mapping for AKS code:', aksCode);
      
      // Try the correct endpoint
      const response = await apiClient.get(`/aks-fields/fields/${encodeURIComponent(aksCode)}`);
      
      console.log('API Response:', response);
      
      // Handle different response structures
      let fields = [];
      if (response.data && response.data.data) {
        fields = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        fields = response.data;
      } else if (response.fields) {
        fields = response.fields;
      }
      
      if (fields && fields.length > 0) {
        console.log('Field mapping loaded:', fields.length, 'fields');
        setAksFieldMapping({ fields });
        
        // Initialize dynamic fields with default values
        const initialValues: Record<string, any> = {};
        fields.forEach((field: any) => {
          if (field.defaultValue !== null && field.defaultValue !== undefined) {
            initialValues[field.kasCode] = field.defaultValue;
          } else if (field.fieldType === 'boolean') {
            initialValues[field.kasCode] = false;
          } else if (field.fieldType === 'number' || field.fieldType === 'decimal' || field.fieldType === 'unit_value') {
            initialValues[field.kasCode] = '';
          } else {
            initialValues[field.kasCode] = '';
          }
        });
        setDynamicFields(initialValues);
        console.log('Initialized dynamic fields:', initialValues);
      } else {
        console.log('No fields found for AKS code:', aksCode);
        setAksFieldMapping(null);
        setDynamicFields({});
      }
    } catch (error) {
      console.error('Failed to load field mapping:', error);
      // Try alternative endpoint
      try {
        console.log('Trying alternative endpoint...');
        const response = await apiClient.get(`/aks/code/${encodeURIComponent(aksCode)}/mapping`);
        if (response.data) {
          const data = response.data.data || response.data;
          if (data.fields && data.fields.length > 0) {
            console.log('Field mapping loaded from alternative endpoint:', data.fields.length, 'fields');
            setAksFieldMapping(data);
            
            // Initialize dynamic fields
            const initialValues: Record<string, any> = {};
            data.fields.forEach((field: any) => {
              initialValues[field.kasCode] = field.defaultValue || '';
            });
            setDynamicFields(initialValues);
          }
        }
      } catch (altError) {
        console.error('Alternative endpoint also failed:', altError);
        setAksFieldMapping(null);
        setDynamicFields({});
      }
    } finally {
      setLoadingFields(false);
    }
  };

  // Handle search input change with debouncing
  const handleAksSearchChange = (value: string) => {
    setSearchAks(value);
    setShowAksDropdown(true);
    
    if (formData.aksCode && !value) {
      setFormData({ ...formData, aksCode: '' });
      setAksFieldMapping(null);
      setDynamicFields({});
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
    
    // Standard Validierung
    if (!formData.objektId) {
      newErrors.objektId = 'Bitte wählen Sie ein Objekt aus';
    }
    
    if (!formData.aksCode) {
      newErrors.aksCode = 'Bitte wählen Sie einen AKS-Code aus';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    // Validierung der AKS-Pflichtfelder
    if (aksFieldMapping && aksFieldMapping.fields) {
      aksFieldMapping.fields.forEach((field: any) => {
        const fieldKey = field.kas_code || field.kasCode || field.field_name || field.fieldName || field.id;
        const displayName = field.displayName || field.display_name || 
                           (field.fieldName || field.field_name ? `[${field.fieldName || field.field_name}]` : 'Feld');
        const isRequired = field.is_required === 1 || field.is_required === true || field.isRequired === true;
        
        if (isRequired) {
          const value = dynamicFields[fieldKey];
          
          // Check if field is empty
          if (value === undefined || value === null || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            newErrors[fieldKey] = `${displayName} ist ein Pflichtfeld`;
          }
          
          // Additional validation based on field type
          if (value !== undefined && value !== null && value !== '') {
            const fieldType = (field.field_type || field.fieldType || field.data_type || 'text').toLowerCase();
            // Min/Max validation for numbers
            if ((fieldType === 'number' || fieldType === 'decimal' || fieldType === 'integer') && 
                typeof value === 'number') {
              const minValue = field.min_value || field.minValue;
              const maxValue = field.max_value || field.maxValue;
              if (minValue !== null && minValue !== undefined && value < minValue) {
                newErrors[fieldKey] = `${displayName} muss mindestens ${minValue} sein`;
              }
              if (maxValue !== null && maxValue !== undefined && value > maxValue) {
                newErrors[fieldKey] = `${displayName} darf maximal ${maxValue} sein`;
              }
            }
            
            // Length validation for strings
            if (fieldType === 'text' && typeof value === 'string') {
              const minLength = field.min_length || field.minLength;
              const maxLength = field.max_length || field.maxLength;
              if (minLength && value.length < minLength) {
                newErrors[fieldKey] = `${displayName} muss mindestens ${minLength} Zeichen haben`;
              }
              if (maxLength && value.length > maxLength) {
                newErrors[fieldKey] = `${displayName} darf maximal ${maxLength} Zeichen haben`;
              }
            }
            
            // Regex validation
            if (field.regex && typeof value === 'string') {
              const regex = new RegExp(field.regex);
              if (!regex.test(value)) {
                newErrors[fieldKey] = `${displayName} hat ein ungültiges Format`;
              }
            }
          }
        }
      });
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
        dynamic_fields: dynamicFields, // Füge die dynamischen Felder hinzu
        // Neue Felder
        etage: formData.etage || undefined,
        raum: formData.raum || undefined,
        anzahl: formData.anzahl || 1,
        hersteller: formData.hersteller || undefined,
        typ: formData.typ || undefined,
        seriennummer: formData.seriennummer || undefined,
        baujahr: formData.baujahr ? parseInt(formData.baujahr) : undefined,
        qr_code_manual: formData.qrCodeManual || undefined,
        hersteller_qr_data: formData.herstellerQrData || undefined,
        // Fotos
        fotos: photos.length > 0 ? photos : undefined,
        // Status
        sichtbar: true,
        such_modus: false,
        notizen: '',
        bearbeitet: true, // Neue Anlagen sind automatisch bearbeitet
        bearbeitet_am: new Date().toISOString(),
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
          // Neue Felder
          etage: formData.etage,
          raum: formData.raum,
          anzahl: formData.anzahl,
          hersteller: formData.hersteller,
          typ: formData.typ,
          seriennummer: formData.seriennummer,
          baujahr: formData.baujahr ? parseInt(formData.baujahr) : undefined,
          qrCodeManual: formData.qrCodeManual,
          herstellerQrData: formData.herstellerQrData,
          fotos: photos.length > 0 ? photos : undefined,
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

  // Universal Scanner Handler
  const handleScan = (data: string, type: 'qr' | 'barcode') => {
    console.log(`Scanned ${type}: ${data}`);
    
    if (scannerTarget === 'anlage') {
      setFormData({ ...formData, qrCodeManual: data });
    } else if (scannerTarget === 'hersteller') {
      // Parse scanned data - could be barcode or QR code
      setFormData({ ...formData, herstellerQrData: data });
      
      // Try to extract serial number from the data
      // For barcodes, directly use as serial number
      // For QR codes, might contain structured data
      if (data) {
        if (type === 'barcode') {
          // Barcode is typically the serial number itself
          setFormData(prev => ({ ...prev, seriennummer: data }));
        } else {
          // QR code might contain JSON or structured data
          try {
            const parsed = JSON.parse(data);
            if (parsed.serial) {
              setFormData(prev => ({ ...prev, seriennummer: parsed.serial }));
            }
            if (parsed.manufacturer) {
              setFormData(prev => ({ ...prev, hersteller: parsed.manufacturer }));
            }
            if (parsed.model) {
              setFormData(prev => ({ ...prev, typ: parsed.model }));
            }
          } catch {
            // If not JSON, use as serial number
            if (!formData.seriennummer) {
              setFormData(prev => ({ ...prev, seriennummer: data }));
            }
          }
        }
      }
    }
    setShowQrScanner(false);
    setScannerTarget(null);
  };

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
                        // Load field mapping for selected AKS code
                        loadAksFieldMapping(aks.code);
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

          {/* QR-Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR-Code (optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.qrCodeManual}
                onChange={(e) => setFormData({ ...formData, qrCodeManual: e.target.value })}
                className="input flex-1"
                placeholder="QR-Code eingeben oder scannen"
              />
              <button
                type="button"
                onClick={() => {
                  setScannerTarget('anlage');
                  setShowQrScanner(true);
                }}
                className="btn-secondary p-2"
                title="QR-Code scannen"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Etage und Raum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etage
              </label>
              <input
                type="text"
                value={formData.etage}
                onChange={(e) => setFormData({ ...formData, etage: e.target.value })}
                className="input"
                placeholder="z.B. EG, 1.OG"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raum
              </label>
              <input
                type="text"
                value={formData.raum}
                onChange={(e) => setFormData({ ...formData, raum: e.target.value })}
                className="input"
                placeholder="z.B. R101"
              />
            </div>
          </div>

          {/* Anzahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anzahl (Stück)
            </label>
            <input
              type="number"
              value={formData.anzahl}
              onChange={(e) => setFormData({ ...formData, anzahl: parseInt(e.target.value) || 1 })}
              className="input"
              min="1"
              placeholder="1"
            />
          </div>

          {/* Hersteller und Typ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hersteller
              </label>
              <input
                type="text"
                value={formData.hersteller}
                onChange={(e) => setFormData({ ...formData, hersteller: e.target.value })}
                className="input"
                placeholder="z.B. Siemens"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ/Modell
              </label>
              <input
                type="text"
                value={formData.typ}
                onChange={(e) => setFormData({ ...formData, typ: e.target.value })}
                className="input"
                placeholder="z.B. ABC-123"
              />
            </div>
          </div>

          {/* Seriennummer mit Scanner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seriennummer
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.seriennummer}
                onChange={(e) => setFormData({ ...formData, seriennummer: e.target.value })}
                className="input flex-1"
                placeholder="Seriennummer eingeben oder scannen"
              />
              <button
                type="button"
                onClick={() => {
                  setScannerTarget('hersteller');
                  setShowQrScanner(true);
                }}
                className="btn-secondary p-2"
                title="Barcode/QR-Code scannen"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kann per Barcode/QR-Code gescannt werden
            </p>
          </div>

          {/* Baujahr */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Baujahr
            </label>
            <input
              type="number"
              value={formData.baujahr}
              onChange={(e) => setFormData({ ...formData, baujahr: e.target.value })}
              className="input"
              min="1900"
              max={new Date().getFullYear() + 1}
              placeholder={new Date().getFullYear().toString()}
            />
          </div>

          {/* Dynamische AKS-Pflichtfelder */}
          {aksFieldMapping && aksFieldMapping.fields && aksFieldMapping.fields.length > 0 && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">AKS-spezifische Felder</h3>
                {aksFieldMapping?.fields?.some((f: any) => f.is_required === 1 || f.is_required === true || f.isRequired === true) && (
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    Gelb markierte Felder sind Pflichtfelder
                  </span>
                )}
              </div>
              
              {loadingFields ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Lade Felder...</span>
                </div>
              ) : (
                aksFieldMapping.fields.map((field: any) => {
                  // Debug: Log field structure to understand what we're getting from API
                  console.log('AKS Field from API:', {
                    kas_code: field.kas_code,
                    field_name: field.field_name,
                    display_name: field.display_name,
                    field_type: field.field_type,
                    full_field: field
                  });
                  
                  // Bestimme den tatsächlichen Feldtyp basierend auf verschiedenen Properties
                  const getFieldType = () => {
                    // Check explicit field type
                    if (field.field_type) return field.field_type.toLowerCase();
                    if (field.fieldType) return field.fieldType.toLowerCase();
                    
                    // Check display name for hints
                    const displayName = (field.display_name || field.displayName || '').toLowerCase();
                    if (displayName.includes('ja/nein') || displayName.includes('yes/no')) {
                      return 'boolean';
                    }
                    
                    // Default based on data type
                    if (field.data_type) {
                      const dataType = field.data_type.toLowerCase();
                      if (dataType === 'boolean') return 'boolean';
                      if (dataType === 'text' || dataType === 'string') return 'text';
                      if (dataType === 'number' || dataType === 'integer') return 'number';
                      if (dataType === 'decimal' || dataType === 'float') return 'decimal';
                    }
                    
                    return 'text'; // default
                  };
                  
                  const fieldType = getFieldType();
                  // Use kas_code as the primary key for the field (for data storage)
                  const fieldKey = field.kas_code || field.kasCode || field.field_name || field.fieldName || field.id;
                  // IMPORTANT: Use displayName (from backend) for UI display - fieldName is system internal only!
                  // The backend sends: displayName (display_name from DB) and fieldName (field_name from DB)
                  const displayName = field.displayName || field.display_name || 
                                     (field.fieldName || field.field_name ? `[Bezeichnung fehlt: ${field.fieldName || field.field_name}]` : 'Unbenanntes Feld');
                  const isRequired = field.is_required === 1 || field.is_required === true || field.isRequired === true;
                  const unit = field.unit || field.einheit || '';
                  const helpText = field.help_text || field.helpText || '';
                  
                  return (
                    <div key={fieldKey} className={`p-3 rounded-lg mb-3 ${isRequired ? 'bg-amber-50 border-l-4 border-amber-400' : 'bg-gray-50'}`}>
                      <label className={`block text-sm font-semibold mb-2 ${isRequired ? 'text-amber-800' : 'text-gray-700'}`}>
                        {displayName}
                        {isRequired && <span className="text-red-600 ml-1 font-bold">*</span>}
                        {unit && <span className="text-gray-500 ml-1 font-normal">({unit})</span>}
                      </label>
                      
                      {/* Text Field */}
                      {(fieldType === 'text' || fieldType === 'textarea') && (
                        <div>
                          {fieldType === 'textarea' ? (
                            <textarea
                              value={dynamicFields[fieldKey] || ''}
                              onChange={(e) => setDynamicFields({
                                ...dynamicFields,
                                [fieldKey]: e.target.value
                              })}
                              rows={3}
                              className={`input ${errors[fieldKey] ? 'border-red-500' : ''}`}
                              placeholder={helpText || `${displayName} eingeben`}
                            />
                          ) : (
                            <div className={unit ? 'flex space-x-2' : ''}>
                              <input
                                type="text"
                                value={dynamicFields[fieldKey] || ''}
                                onChange={(e) => setDynamicFields({
                                  ...dynamicFields,
                                  [fieldKey]: e.target.value
                                })}
                                className={`input ${unit ? 'flex-1' : 'w-full'} ${errors[fieldKey] ? 'border-red-500' : ''}`}
                                placeholder={helpText || `${displayName} eingeben`}
                                maxLength={field.maxLength || field.max_length || undefined}
                              />
                              {unit && (
                                <span className="inline-flex items-center px-3 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-md">
                                  {unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Number/Decimal Field */}
                      {(fieldType === 'number' || fieldType === 'decimal' || fieldType === 'integer') && (
                        <div className={unit ? 'flex space-x-2' : ''}>
                          <input
                            type="number"
                            value={dynamicFields[fieldKey] || ''}
                            onChange={(e) => setDynamicFields({
                              ...dynamicFields,
                              [fieldKey]: e.target.value ? parseFloat(e.target.value) : ''
                            })}
                            className={`input ${unit ? 'flex-1' : 'w-full'} ${errors[fieldKey] ? 'border-red-500' : ''}`}
                            placeholder={field.helpText || field.help_text || ''}
                            min={field.minValue || field.min_value || undefined}
                            max={field.maxValue || field.max_value || undefined}
                            step={fieldType === 'decimal' ? '0.01' : '1'}
                          />
                          {unit && (
                            <span className="inline-flex items-center px-3 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-md">
                              {unit}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Boolean / Ja/Nein Field */}
                      {(fieldType === 'boolean' || fieldType === 'checkbox' || displayName.toLowerCase().includes('ja/nein')) && (
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={fieldKey}
                              value="true"
                              checked={dynamicFields[fieldKey] === true || dynamicFields[fieldKey] === 'true' || dynamicFields[fieldKey] === 'Ja'}
                              onChange={() => setDynamicFields({
                                ...dynamicFields,
                                [fieldKey]: true
                              })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Ja</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={fieldKey}
                              value="false"
                              checked={dynamicFields[fieldKey] === false || dynamicFields[fieldKey] === 'false' || dynamicFields[fieldKey] === 'Nein'}
                              onChange={() => setDynamicFields({
                                ...dynamicFields,
                                [fieldKey]: false
                              })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Nein</span>
                          </label>
                        </div>
                      )}
                      
                      {/* Select Field */}
                      {(fieldType === 'select' || fieldType === 'dropdown') && field.options && (
                        <select
                          value={dynamicFields[fieldKey] || ''}
                          onChange={(e) => setDynamicFields({
                            ...dynamicFields,
                            [fieldKey]: e.target.value
                          })}
                          className={`input ${errors[fieldKey] ? 'border-red-500' : ''}`}
                        >
                          <option value="">Bitte wählen...</option>
                          {field.options.map((option: any) => (
                            <option key={option.value || option} value={option.value || option}>
                              {option.label || option}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {/* Date Field */}
                      {fieldType === 'date' && (
                        <input
                          type="date"
                          value={dynamicFields[fieldKey] || ''}
                          onChange={(e) => setDynamicFields({
                            ...dynamicFields,
                            [fieldKey]: e.target.value
                          })}
                          className={`input ${errors[fieldKey] ? 'border-red-500' : ''}`}
                        />
                      )}
                      
                      {/* Error Message */}
                      {errors[fieldKey] && (
                        <p className="text-sm text-red-600 mt-1">{errors[fieldKey]}</p>
                      )}
                      
                      {/* Help Text */}
                      {helpText && !errors[fieldKey] && (
                        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Fotos */}
          <div>
            <PhotoUpload 
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
            />
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
      
      {/* Universal Scanner */}
      {showQrScanner && (
        <UniversalScanner
          onScan={handleScan}
          onClose={() => {
            setShowQrScanner(false);
            setScannerTarget(null);
          }}
          title={scannerTarget === 'anlage' ? 'FM-Code scannen' : 'Seriennummer scannen'}
          scanType={scannerTarget === 'anlage' ? 'qr' : 'both'}
          helpText={
            scannerTarget === 'anlage' 
              ? 'FM-Code (QR-Code) in den Rahmen halten' 
              : 'Barcode oder QR-Code der Seriennummer scannen'
          }
        />
      )}
    </div>
  );
}