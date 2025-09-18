import React, { useState, useRef } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    const newPhotos: string[] = [];

    for (const file of files) {
      if (photos.length + newPhotos.length >= maxPhotos) {
        alert(`Maximal ${maxPhotos} Fotos erlaubt`);
        break;
      }

      try {
        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      } catch (error) {
        console.error('Fehler beim Laden des Fotos:', error);
        alert('Fehler beim Laden des Fotos');
      }
    }

    onPhotosChange([...photos, ...newPhotos]);
    setLoading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Fotos
        </label>
        <span className="text-xs text-gray-500">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            capture="environment"
          />
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Lade Fotos...</span>
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">Fotos hinzufügen</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Klicken zum Auswählen oder Kamera verwenden
          </p>
        </div>
      )}
    </div>
  );
}