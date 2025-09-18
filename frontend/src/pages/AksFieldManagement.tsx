import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AksFieldDefinition {
  id?: string;
  aks_code: string;
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
  regex_pattern?: string;
  select_options?: string[];
  validation_rules?: any;
  aks_bezeichnung?: string;
}

interface AksCode {
  code: string;
  bezeichnung: string;
}

const AksFieldManagement: React.FC = () => {
  const token = localStorage.getItem('auth_token');
  const [fields, setFields] = useState<AksFieldDefinition[]>([]);
  const [aksCodes, setAksCodes] = useState<AksCode[]>([]);
  const [selectedAksCode, setSelectedAksCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<AksFieldDefinition | null>(null);
  const [aksSearchTerm, setAksSearchTerm] = useState<string>('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [formData, setFormData] = useState<AksFieldDefinition>({
    aks_code: '',
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    is_visible: true,
    display_order: 0,
    unit: '',
    default_value: '',
    placeholder: '',
    help_text: '',
    select_options: []
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Zahl' },
    { value: 'decimal', label: 'Dezimalzahl' },
    { value: 'date', label: 'Datum' },
    { value: 'boolean', label: 'Ja/Nein' },
    { value: 'select', label: 'Auswahl' },
    { value: 'multiselect', label: 'Mehrfachauswahl' },
    { value: 'unit_value', label: 'Wert mit Einheit' }
  ];

  const commonUnits = [
    'bar', 'Pa', 'kPa', 'MPa',
    'l', 'l/min', 'l/h', 'm³', 'm³/h',
    'kW', 'MW', 'W', 'kWh',
    '°C', 'K',
    'mm', 'cm', 'm', 'km',
    'kg', 'g', 't',
    '%', 'U/min', 'Hz'
  ];

  useEffect(() => {
    fetchAksCodes();
    fetchAllFields();
  }, []);

  const fetchAksCodes = async () => {
    try {
      // Fetch AKS codes with multiple pages if needed
      let allCodes: AksCode[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`/api/v1/aks-codes?limit=100&page=${page}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.data && data.data.codes) {
          const formattedCodes = data.data.codes.map((code: any) => ({
            code: code.code,
            bezeichnung: code.name || code.bezeichnung || ''
          }));
          allCodes = [...allCodes, ...formattedCodes];
          
          // Check if there are more pages
          const totalPages = data.data.pagination?.totalPages || 1;
          hasMore = page < totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setAksCodes(allCodes);
    } catch (error) {
      console.error('Error fetching AKS codes:', error);
    }
  };

  const fetchAllFields = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/aks-fields/fields', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFields(data.data || []);
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Felder');
    }
    setLoading(false);
  };

  const fetchFieldsByAksCode = async (aksCode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/aks-fields/fields/${aksCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFields(data.data || []);
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Felder');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingField ? 'PUT' : 'POST';
      const url = editingField 
        ? `/api/v1/aks-fields/fields/${editingField.id}`
        : '/api/v1/aks-fields/fields';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        setEditingField(null);
        resetForm();
        if (selectedAksCode) {
          fetchFieldsByAksCode(selectedAksCode);
        } else {
          fetchAllFields();
        }
      } else {
        toast.error(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern des Feldes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Feld wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/v1/aks-fields/fields/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Feld erfolgreich gelöscht');
        if (selectedAksCode) {
          fetchFieldsByAksCode(selectedAksCode);
        } else {
          fetchAllFields();
        }
      }
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleEdit = (field: AksFieldDefinition) => {
    setEditingField(field);
    setFormData(field);
    // Check if the unit is a custom one (not in common units)
    const isCustomUnit = field.unit && !['bar', 'Pa', 'kPa', 'MPa', 'l', 'l/min', 'l/h', 'm³', 'm³/h', 
                                         'W', 'kW', 'MW', 'kWh', '°C', 'K', 'mm', 'cm', 'm', 'km', 
                                         'g', 'kg', 't', '%', 'U/min', 'Hz'].includes(field.unit);
    setShowCustomUnit(isCustomUnit || false);
    setShowModal(true);
  };

  const handleCopyFields = async () => {
    const sourceCode = prompt('Von welchem AKS-Code möchten Sie die Felder kopieren?');
    const targetCode = prompt('Zu welchem AKS-Code möchten Sie die Felder kopieren?');
    
    if (!sourceCode || !targetCode) return;
    
    try {
      const response = await fetch('/api/v1/aks-fields/fields/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceAksCode: sourceCode,
          targetAksCode: targetCode
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Felder erfolgreich kopiert');
        fetchAllFields();
      }
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const resetForm = () => {
    setFormData({
      aks_code: selectedAksCode || '',
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      is_visible: true,
      display_order: 0,
      unit: '',
      default_value: '',
      placeholder: '',
      help_text: '',
      select_options: []
    });
    setShowCustomUnit(false);
  };

  const filteredFields = selectedAksCode 
    ? fields.filter(f => f.aks_code === selectedAksCode)
    : fields;

  // Filter AKS codes based on search term
  const filteredAksCodes = aksCodes.filter(aks => 
    aks.code.toLowerCase().includes(aksSearchTerm.toLowerCase()) ||
    aks.bezeichnung.toLowerCase().includes(aksSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">AKS Feldverwaltung</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                AKS-Code Filter:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="AKS-Code suchen..."
                  value={aksSearchTerm}
                  onChange={(e) => setAksSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                {aksSearchTerm && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div 
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => {
                        setSelectedAksCode('');
                        setAksSearchTerm('');
                        fetchAllFields();
                      }}
                    >
                      <div className="font-medium">Alle AKS-Codes</div>
                    </div>
                    {filteredAksCodes.length > 0 ? (
                      filteredAksCodes.map((aks) => (
                        <div
                          key={aks.code}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedAksCode(aks.code);
                            setAksSearchTerm(aks.code + ' - ' + aks.bezeichnung);
                            fetchFieldsByAksCode(aks.code);
                          }}
                        >
                          <div className="font-medium">{aks.code}</div>
                          <div className="text-sm text-gray-600">{aks.bezeichnung}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        Keine AKS-Codes gefunden
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedAksCode && (
                <button
                  onClick={() => {
                    setSelectedAksCode('');
                    setAksSearchTerm('');
                    fetchAllFields();
                  }}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  resetForm();
                  setEditingField(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Neues Feld
              </button>
              
              <button
                onClick={handleCopyFields}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                Felder kopieren
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Definieren Sie hier die Pflicht- und optionalen Felder für jeden AKS-Code.</p>
            <p className="mt-1">
              <span className="inline-flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                Pflichtfelder
              </span>
              {' '}werden in der Datenaufnahme hervorgehoben und müssen ausgefüllt werden.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AKS-Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feldname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bezeichnung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Einheit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pflichtfeld
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reihenfolge
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.aks_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.field_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {field.field_label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.unit || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {field.is_required ? (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500 inline" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-gray-300 inline" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {field.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(field)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(field.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFields.length === 0 && (
            <div className="text-center py-12">
              <AdjustmentsHorizontalIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Felder definiert</h3>
              <p className="mt-1 text-sm text-gray-500">
                Erstellen Sie neue Felder für diesen AKS-Code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal für Feld bearbeiten/erstellen */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingField ? 'Feld bearbeiten' : 'Neues Feld erstellen'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AKS-Code *
                  </label>
                  <input
                    type="text"
                    placeholder="AKS-Code eingeben oder auswählen..."
                    value={formData.aks_code}
                    onChange={(e) => setFormData({...formData, aks_code: e.target.value})}
                    list="aks-codes-list"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <datalist id="aks-codes-list">
                    {aksCodes.map((aks) => (
                      <option key={aks.code} value={aks.code}>
                        {aks.code} - {aks.bezeichnung}
                      </option>
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feldname * (technisch, keine Leerzeichen)
                  </label>
                  <input
                    type="text"
                    value={formData.field_name}
                    onChange={(e) => setFormData({...formData, field_name: e.target.value.replace(/\s/g, '_')})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    pattern="[a-z0-9_]+"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezeichnung *
                  </label>
                  <input
                    type="text"
                    value={formData.field_label}
                    onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feldtyp *
                  </label>
                  <select
                    value={formData.field_type}
                    onChange={(e) => setFormData({...formData, field_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Einheit {(formData.field_type === 'unit_value' || formData.field_type === 'number' || formData.field_type === 'decimal') ? '(empfohlen)' : '(optional)'}
                  </label>
                  {!showCustomUnit ? (
                    <div className="flex space-x-2">
                      <select
                        value={formData.unit || ''}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setShowCustomUnit(true);
                            setFormData({...formData, unit: ''});
                          } else {
                            setFormData({...formData, unit: e.target.value});
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Keine Einheit</option>
                        <option disabled>--- Druck ---</option>
                        <option value="bar">bar</option>
                        <option value="Pa">Pa</option>
                        <option value="kPa">kPa</option>
                        <option value="MPa">MPa</option>
                        <option disabled>--- Volumen/Durchfluss ---</option>
                        <option value="l">l</option>
                        <option value="l/min">l/min</option>
                        <option value="l/h">l/h</option>
                        <option value="m³">m³</option>
                        <option value="m³/h">m³/h</option>
                        <option disabled>--- Leistung/Energie ---</option>
                        <option value="W">W</option>
                        <option value="kW">kW</option>
                        <option value="MW">MW</option>
                        <option value="kWh">kWh</option>
                        <option disabled>--- Temperatur ---</option>
                        <option value="°C">°C</option>
                        <option value="K">K</option>
                        <option disabled>--- Länge ---</option>
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                        <option value="km">km</option>
                        <option disabled>--- Gewicht ---</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="t">t</option>
                        <option disabled>--- Sonstige ---</option>
                        <option value="%">%</option>
                        <option value="U/min">U/min</option>
                        <option value="Hz">Hz</option>
                        <option value="custom">➕ Andere Einheit eingeben...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Eigene Einheit eingeben (z.B. mV, A, V)"
                        value={formData.unit || ''}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomUnit(false);
                          setFormData({...formData, unit: ''});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Zurück
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reihenfolge
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platzhalter
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder || ''}
                    onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hilfetext
                  </label>
                  <textarea
                    value={formData.help_text || ''}
                    onChange={(e) => setFormData({...formData, help_text: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                
                {formData.field_type === 'select' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auswahloptionen (eine pro Zeile)
                    </label>
                    <textarea
                      value={formData.select_options?.join('\n') || ''}
                      onChange={(e) => setFormData({...formData, select_options: e.target.value.split('\n').filter(o => o.trim())})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={4}
                    />
                  </div>
                )}
                
                <div className="col-span-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_required}
                      onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Pflichtfeld</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({...formData, is_visible: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Sichtbar</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingField(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingField ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AksFieldManagement;