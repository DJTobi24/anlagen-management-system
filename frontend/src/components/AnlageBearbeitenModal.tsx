import React, { useState, useEffect } from 'react';
import { X, Save, Camera, Search, AlertCircle } from 'lucide-react';
import { Anlage } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anlage: any;
  datenaufnahmeContext?: {
    aufnahmeId: string;
    suchModus: boolean;
    notizen?: string;
  };
  onUpdate: (anlageId: string, data: any) => void;
}

const AnlageBearbeitenModal: React.FC<Props> = ({
  isOpen,
  onClose,
  anlage,
  datenaufnahmeContext,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    t_nummer: '',
    aks_code: '',
    description: '',
    status: 'in_betrieb',
    zustands_bewertung: 1,
    dynamic_fields: {},
    notizen: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (anlage) {
      setFormData({
        name: anlage.name || '',
        t_nummer: anlage.t_nummer || '',
        aks_code: anlage.aks_code || '',
        description: anlage.description || '',
        status: anlage.status || 'in_betrieb',
        zustands_bewertung: anlage.zustands_bewertung || 1,
        dynamic_fields: anlage.dynamic_fields || {},
        notizen: ''
      });
    }
  }, [anlage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        photos: photos.length > 0 ? photos : undefined
      };

      await onUpdate(anlage.id, updateData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (photoData: string) => {
    setPhotos([...photos, photoData]);
    setShowCamera(false);
  };

  const statusOptions = [
    { value: 'in_betrieb', label: 'In Betrieb' },
    { value: 'ausser_betrieb', label: 'Außer Betrieb' },
    { value: 'in_wartung', label: 'In Wartung' },
    { value: 'defekt', label: 'Defekt' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Anlage bearbeiten</h3>
            {datenaufnahmeContext?.suchModus && (
              <div className="flex items-center mt-2 text-yellow-600">
                <Search className="h-4 w-4 mr-2" />
                <span className="text-sm">Diese Anlage soll gesucht werden</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        {datenaufnahmeContext?.notizen && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> {datenaufnahmeContext.notizen}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basis-Informationen */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Basis-Informationen</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  T-Nummer
                </label>
                <input
                  type="text"
                  value={formData.t_nummer}
                  onChange={(e) => setFormData({ ...formData, t_nummer: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status und Zustand */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900">Status und Zustand</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zustandsbewertung
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        value={value}
                        checked={formData.zustands_bewertung === value}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          zustands_bewertung: parseInt(e.target.value) 
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-1 text-sm text-gray-700">{value}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  1 = sehr gut, 5 = sehr schlecht
                </p>
              </div>
            </div>
          </div>

          {/* Notizen für Datenaufnahme */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notizen zur Datenaufnahme
            </label>
            <textarea
              value={formData.notizen}
              onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
              rows={3}
              placeholder="Besonderheiten, Auffälligkeiten, weitere Informationen..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Fotos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Fotos
              </label>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <Camera className="h-4 w-4 mr-1" />
                Foto aufnehmen
              </button>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>Speichern...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern & Als bearbeitet markieren
                </>
              )}
            </button>
          </div>
        </form>

        {/* Kamera-Modal */}
        {showCamera && (
          <CameraModal
            isOpen={showCamera}
            onClose={() => setShowCamera(false)}
            onCapture={handlePhotoCapture}
          />
        )}
      </div>
    </div>
  );
};

// Einfache Kamera-Modal Komponente (Platzhalter)
const CameraModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: string) => void;
}> = ({ isOpen, onClose, onCapture }) => {
  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Foto aufnehmen</h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Klicken Sie hier, um ein Foto auszuwählen
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-input"
            />
            <label
              htmlFor="photo-input"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Foto auswählen
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnlageBearbeitenModal;