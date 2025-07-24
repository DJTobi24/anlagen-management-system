import React, { useState } from 'react';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  selectedCount: number;
  isLoading?: boolean;
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedCount,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    category: '',
    maintenanceIntervalMonths: '',
    maintenanceType: '',
    maintenanceDescription: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {};
    
    if (formData.category.trim()) {
      updateData.category = formData.category.trim();
    }
    if (formData.maintenanceIntervalMonths.trim()) {
      updateData.maintenance_interval_months = parseInt(formData.maintenanceIntervalMonths);
    }
    if (formData.maintenanceType.trim()) {
      updateData.maintenance_type = formData.maintenanceType.trim();
    }
    if (formData.maintenanceDescription.trim()) {
      updateData.maintenance_description = formData.maintenanceDescription.trim();
    }

    if (Object.keys(updateData).length === 0) {
      alert('Bitte füllen Sie mindestens ein Feld aus.');
      return;
    }

    onSave(updateData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    setFormData({
      category: '',
      maintenanceIntervalMonths: '',
      maintenanceType: '',
      maintenanceDescription: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-w-2xl">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bulk-Bearbeitung ({selectedCount} AKS-Codes)
          </h3>
          
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Nur ausgefüllte Felder werden bei allen ausgewählten AKS-Codes aktualisiert. 
              Leere Felder bleiben unverändert.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Leer lassen um unverändert zu belassen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

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
                placeholder="Leer lassen um unverändert zu belassen"
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
                placeholder="Leer lassen um unverändert zu belassen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wartungsbeschreibung
              </label>
              <textarea
                name="maintenanceDescription"
                value={formData.maintenanceDescription}
                onChange={handleInputChange}
                rows={3}
                placeholder="Leer lassen um unverändert zu belassen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
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
                {isLoading ? 'Aktualisiere...' : `${selectedCount} AKS-Codes aktualisieren`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateModal;