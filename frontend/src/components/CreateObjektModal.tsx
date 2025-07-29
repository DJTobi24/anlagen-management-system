import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface CreateObjektModalProps {
  liegenschaftId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Liegenschaft {
  id: string;
  name: string;
}

const CreateObjektModal: React.FC<CreateObjektModalProps> = ({ liegenschaftId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    liegenschaft_id: liegenschaftId || '',
    floor: '',
    room: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch Liegenschaften for dropdown
  const { data: liegenschaften = [] } = useQuery(
    'liegenschaften-dropdown',
    async () => {
      const response = await api.get('/liegenschaften');
      return response.data;
    }
  );

  const createMutation = useMutation(
    async (data: typeof formData) => {
      const response = await api.post('/objekte', data);
      return response.data;
    },
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          alert(error.response?.data?.message || 'Fehler beim Erstellen des Objekts');
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.liegenschaft_id) {
      newErrors.liegenschaft_id = 'Liegenschaft ist erforderlich';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Neues Objekt erstellen
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="liegenschaft" className="block text-sm font-medium text-gray-700">
                    Liegenschaft *
                  </label>
                  <select
                    id="liegenschaft"
                    value={formData.liegenschaft_id}
                    onChange={(e) => setFormData({ ...formData, liegenschaft_id: e.target.value })}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.liegenschaft_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!!liegenschaftId}
                  >
                    <option value="">Liegenschaft auswählen</option>
                    {liegenschaften.map((liegenschaft: Liegenschaft) => (
                      <option key={liegenschaft.id} value={liegenschaft.id}>
                        {liegenschaft.name}
                      </option>
                    ))}
                  </select>
                  {errors.liegenschaft_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.liegenschaft_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="z.B. Gebäude A"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                      Etage
                    </label>
                    <input
                      type="text"
                      id="floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="z.B. EG, 1. OG"
                    />
                  </div>

                  <div>
                    <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                      Raum
                    </label>
                    <input
                      type="text"
                      id="room"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="z.B. 101, A.1.05"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Optionale Beschreibung des Objekts"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isLoading ? 'Erstellen...' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateObjektModal;