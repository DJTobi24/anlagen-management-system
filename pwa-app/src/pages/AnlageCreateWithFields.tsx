import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, Camera, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { db, CachedAuftrag, CachedObjekt } from '../db/database';
import { apiClient } from '../services/api';
import { useSync } from '../contexts/SyncContext';
import QRScanner from '../components/QRScanner';
import PhotoUpload from '../components/PhotoUpload';

interface AksFieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
  unit?: string;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  min_value?: number;
  max_value?: number;
  select_options?: string[];
}

interface FieldValue {
  field_definition_id: string;
  value: string;
  numeric_value?: number;
  unit?: string;
}

export default function AnlageCreateWithFields() {
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
  
  // AKS-spezifische Felder
  const [aksFields, setAksFields] = useState<AksFieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<{[key: string]: FieldValue}>({});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const [formData, setFormData] = useState({
    objektId: '',
    aksCode: '',
    tNummer: '',
    name: '',
    description: '',
    status: 'aktiv',
    zustandsBewertung: 3,
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

  useEffect(() => {
    loadData();
  }, [aufnahmeId]);

  useEffect(() => {
    // Wenn AKS-Code geändert wird, lade die entsprechenden Felder
    if (formData.aksCode) {
      loadAksFields(formData.aksCode);
    } else {
      setAksFields([]);
      setFieldValues({});
    }
  }, [formData.aksCode]);

  const loadData = async () => {
    if (!aufnahmeId) return;
    
    try {
      const cachedAuftrag = await db.auftraege.get(aufnahmeId);
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
      
      const cachedAks = await db.aksCodes.toArray();
      setAksCodes(cachedAks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAksFields = async (aksCode: string) => {
    try {
      // Versuche online zu laden
      if (isOnline) {
        const response = await apiClient.get(`/aks-fields/fields/${aksCode}`);
        if (response.data.success) {
          const fields = response.data.data || [];
          setAksFields(fields);
          
          // Initialisiere Feldwerte mit Standardwerten
          const initialValues: {[key: string]: FieldValue} = {};
          fields.forEach((field: AksFieldDefinition) => {
            initialValues[field.id] = {
              field_definition_id: field.id,
              value: field.default_value || '',
              unit: field.unit
            };
          });
          setFieldValues(initialValues);
          
          // Cache die Felder für Offline-Nutzung
          await db.aksFieldDefinitions.put({
            aksCode,
            fields,
            lastSynced: new Date()
          });
        }
      } else {
        // Offline: Lade aus Cache
        const cached = await db.aksFieldDefinitions.get(aksCode);
        if (cached) {
          setAksFields(cached.fields);
          
          const initialValues: {[key: string]: FieldValue} = {};
          cached.fields.forEach((field: AksFieldDefinition) => {
            initialValues[field.id] = {
              field_definition_id: field.id,
              value: field.default_value || '',
              unit: field.unit
            };
          });
          setFieldValues(initialValues);
        }
      }
    } catch (error) {
      console.error('Error loading AKS fields:', error);
    }
  };

  const validateFields = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;
    
    // Validiere Pflichtfelder
    aksFields.forEach(field => {
      const value = fieldValues[field.id]?.value;
      
      if (field.is_required && (!value || value.trim() === '')) {
        errors[field.id] = `${field.field_label} ist ein Pflichtfeld`;
        isValid = false;
      }
      
      // Weitere Validierungen basierend auf Feldtyp
      if (value) {
        if (field.field_type === 'number' || field.field_type === 'decimal' || field.field_type === 'unit_value') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            errors[field.id] = `${field.field_label} muss eine Zahl sein`;
            isValid = false;
          } else {
            if (field.min_value !== undefined && numValue < field.min_value) {
              errors[field.id] = `${field.field_label} muss mindestens ${field.min_value} sein`;
              isValid = false;
            }
            if (field.max_value !== undefined && numValue > field.max_value) {
              errors[field.id] = `${field.field_label} darf maximal ${field.max_value} sein`;
              isValid = false;
            }
          }
        }
      }
    });
    
    setValidationErrors(errors);
    return isValid;
  };

  const handleFieldChange = (fieldId: string, value: string, unit?: string) => {
    const field = aksFields.find(f => f.id === fieldId);
    if (!field) return;
    
    let numericValue: number | undefined;
    if (field.field_type === 'number' || field.field_type === 'decimal' || field.field_type === 'unit_value') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        numericValue = parsed;
      }
    }
    
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: {
        field_definition_id: fieldId,
        value,
        numeric_value: numericValue,
        unit: unit || field.unit
      }
    }));
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: AksFieldDefinition) => {
    const value = fieldValues[field.id]?.value || '';
    const error = validationErrors[field.id];
    const isRequired = field.is_required;
    
    const fieldClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
      error ? 'border-red-500 focus:ring-red-500' : 
      isRequired ? 'border-orange-400 focus:ring-orange-500' : 
      'border-gray-300 focus:ring-blue-500'
    }`;
    
    const labelClass = `block text-sm font-medium mb-1 ${
      isRequired ? 'text-orange-700' : 'text-gray-700'
    }`;
    
    return (
      <div key={field.id} className="mb-4">
        <label className={labelClass}>
          {field.field_label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {field.unit && field.field_type !== 'unit_value' && 
            <span className="text-gray-500 ml-1">({field.unit})</span>
          }
        </label>
        
        {field.help_text && (
          <p className="text-xs text-gray-500 mb-1">{field.help_text}</p>
        )}
        
        {field.field_type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
          />
        )}
        
        {field.field_type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.min_value}
            max={field.max_value}
            className={fieldClass}
          />
        )}
        
        {field.field_type === 'decimal' && (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.min_value}
            max={field.max_value}
            className={fieldClass}
          />
        )}
        
        {field.field_type === 'unit_value' && (
          <div className="flex space-x-2">
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value, fieldValues[field.id]?.unit)}
              placeholder={field.placeholder || 'Wert'}
              className={`flex-1 ${fieldClass}`}
            />
            <input
              type="text"
              value={fieldValues[field.id]?.unit || field.unit || ''}
              onChange={(e) => handleFieldChange(field.id, value, e.target.value)}
              placeholder="Einheit"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
        
        {field.field_type === 'date' && (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={fieldClass}
          />
        )}
        
        {field.field_type === 'boolean' && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="true"
                checked={value === 'true'}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="mr-2"
              />
              Ja
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="false"
                checked={value === 'false'}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="mr-2"
              />
              Nein
            </label>
          </div>
        )}
        
        {field.field_type === 'select' && (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={fieldClass}
          >
            <option value="">Bitte wählen...</option>
            {field.select_options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
        
        {field.field_type === 'multiselect' && (
          <select
            multiple
            value={value ? value.split(',') : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFieldChange(field.id, selected.join(','));
            }}
            className={fieldClass}
            size={4}
          >
            {field.select_options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
        
        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validiere AKS-spezifische Felder
    if (!validateFields()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    setSaving(true);
    
    try {
      // Generate a temporary ID for the new Anlage
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const anlageData: any = {
        id: tempId,
        aufnahme_id: aufnahmeId!,
        anlage_id: tempId,
        objekt_id: formData.objektId,
        aks_code: formData.aksCode,
        t_nummer: formData.tNummer,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        zustands_bewertung: formData.zustandsBewertung,
        dynamic_fields: fieldValues,
        etage: formData.etage,
        raum: formData.raum,
        anzahl: formData.anzahl,
        hersteller: formData.hersteller,
        typ: formData.typ,
        seriennummer: formData.seriennummer,
        baujahr: formData.baujahr ? parseInt(formData.baujahr) : undefined,
        qr_code_manual: formData.qrCodeManual,
        hersteller_qr_data: formData.herstellerQrData,
        fotos: photos.length > 0 ? photos : undefined,
        sichtbar: true,
        such_modus: false,
        notizen: '',
        bearbeitet: true,
        bearbeitet_am: new Date().toISOString(),
        localChanges: true,
        isNew: true
      };
      
      // Speichere lokal
      await db.anlagen.add(anlageData);
      
      // Versuche zu synchronisieren wenn online
      if (isOnline) {
        try {
          await apiClient.post('/anlagen', anlageData);
          // Markiere als synchronisiert
          // await db.anlagen.update(id, { synced: true });
        } catch (syncError) {
          console.error('Sync failed, will retry later:', syncError);
        }
      }
      
      navigate(`/aufnahme/${aufnahmeId}`);
    } catch (error) {
      console.error('Error saving anlage:', error);
      alert('Fehler beim Speichern der Anlage');
    } finally {
      setSaving(false);
    }
  };

  const handleQrScan = (result: string) => {
    if (scannerTarget === 'anlage') {
      setFormData(prev => ({ ...prev, qrCodeManual: result }));
    } else if (scannerTarget === 'hersteller') {
      setFormData(prev => ({ ...prev, herstellerQrData: result }));
    }
    setShowQrScanner(false);
    setScannerTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Sortiere Felder nach display_order
  const sortedFields = [...aksFields].sort((a, b) => a.display_order - b.display_order);
  const requiredFields = sortedFields.filter(f => f.is_required);
  const optionalFields = sortedFields.filter(f => !f.is_required);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/aufnahme/${aufnahmeId}`)}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Zurück
          </button>
          <h1 className="text-lg font-semibold">Neue Anlage</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Basis-Informationen */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Basis-Informationen</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objekt *
              </label>
              <select
                value={formData.objektId}
                onChange={(e) => setFormData({...formData, objektId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Bitte wählen...</option>
                {objekte.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AKS-Code *
              </label>
              <div className="relative" ref={aksDropdownRef}>
                <div className="flex">
                  <input
                    type="text"
                    value={searchAks}
                    onChange={(e) => {
                      setSearchAks(e.target.value);
                      setShowAksDropdown(true);
                      // Filter AKS codes
                      const filtered = aksCodes.filter(aks => 
                        aks.code.includes(e.target.value) || 
                        aks.bezeichnung.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setSearchResults(filtered);
                    }}
                    onFocus={() => {
                      setShowAksDropdown(true);
                      setSearchResults(aksCodes);
                    }}
                    placeholder="Code oder Bezeichnung suchen..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg"
                    required
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg"
                    onClick={() => setShowAksDropdown(!showAksDropdown)}
                  >
                    <Search className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                {showAksDropdown && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((aks) => (
                      <div
                        key={aks.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({...formData, aksCode: aks.code});
                          setSearchAks(`${aks.code} - ${aks.bezeichnung}`);
                          setShowAksDropdown(false);
                        }}
                      >
                        <div className="font-medium">{aks.code}</div>
                        <div className="text-sm text-gray-600">{aks.bezeichnung}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                T-Nummer / Anlagennummer *
              </label>
              <input
                type="text"
                value={formData.tNummer}
                onChange={(e) => setFormData({...formData, tNummer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bezeichnung *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* AKS-spezifische Pflichtfelder */}
        {requiredFields.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2 text-orange-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Pflichtfelder für {formData.aksCode}
            </h2>
            <p className="text-sm text-orange-600 mb-4">
              Diese Felder müssen ausgefüllt werden
            </p>
            <div className="space-y-4">
              {requiredFields.map(renderField)}
            </div>
          </div>
        )}

        {/* AKS-spezifische optionale Felder */}
        {optionalFields.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Optionale Felder für {formData.aksCode}
            </h2>
            <div className="space-y-4">
              {optionalFields.map(renderField)}
            </div>
          </div>
        )}

        {/* Zusätzliche Informationen */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Zusätzliche Informationen</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etage
                </label>
                <input
                  type="text"
                  value={formData.etage}
                  onChange={(e) => setFormData({...formData, etage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raum
                </label>
                <input
                  type="text"
                  value={formData.raum}
                  onChange={(e) => setFormData({...formData, raum: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anzahl
              </label>
              <input
                type="number"
                value={formData.anzahl}
                onChange={(e) => setFormData({...formData, anzahl: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="aktiv">Aktiv</option>
                <option value="inaktiv">Inaktiv</option>
                <option value="defekt">Defekt</option>
                <option value="ausser_betrieb">Außer Betrieb</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zustandsbewertung (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.zustandsBewertung}
                onChange={(e) => setFormData({...formData, zustandsBewertung: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Sehr schlecht</span>
                <span>{formData.zustandsBewertung}</span>
                <span>Sehr gut</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Fotos</h2>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Anlage speichern
            </>
          )}
        </button>
      </form>

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <QRScanner
          onScan={handleQrScan}
          onClose={() => {
            setShowQrScanner(false);
            setScannerTarget(null);
          }}
        />
      )}
    </div>
  );
}