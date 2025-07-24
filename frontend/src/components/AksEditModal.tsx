import React, { useState, useEffect } from 'react';
import { AksCode } from '../types/aks';

interface AksEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  aksCode: AksCode | null;
  onSave: (data: Partial<AksCode>) => void;
  isLoading?: boolean;
}

const AksEditModal: React.FC<AksEditModalProps> = ({
  isOpen,
  onClose,
  aksCode,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    maintenanceIntervalMonths: '',
    maintenanceType: '',
    maintenanceDescription: ''
  });

  useEffect(() => {
    if (aksCode) {
      setFormData({
        name: aksCode.name || '',
        description: aksCode.description || '',
        category: aksCode.category || '',
        maintenanceIntervalMonths: aksCode.maintenanceIntervalMonths?.toString() || '',
        maintenanceType: aksCode.maintenanceType || '',
        maintenanceDescription: aksCode.maintenanceDescription || ''
      });
    }
  }, [aksCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: Partial<AksCode> = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      maintenanceIntervalMonths: formData.maintenanceIntervalMonths 
        ? parseInt(formData.maintenanceIntervalMonths) 
        : undefined,
      maintenanceType: formData.maintenanceType || undefined,
      maintenanceDescription: formData.maintenanceDescription || undefined
    };

    onSave(updateData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen || !aksCode) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-w-2xl">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            AKS-Code bearbeiten
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AKS-Code
              </label>
              <input
                type="text"
                value={aksCode.code}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wartungsintervall (Monate)
                </label>
                <input
                  type="number"
                  name="maintenanceIntervalMonths"
                  value={formData.maintenanceIntervalMonths}
                  onChange={handleInputChange}
                  min="1"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wartungstyp
                </label>
                <input
                  type="text"
                  name="maintenanceType"
                  value={formData.maintenanceType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wartungsbeschreibung
              </label>
              <textarea
                name="maintenanceDescription"
                value={formData.maintenanceDescription}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn-secondary"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AksEditModal;