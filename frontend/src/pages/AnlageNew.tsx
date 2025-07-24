import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { anlageService } from '../services/anlageService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AnlageFormData {
  name: string;
  t_nummer: string;
  aks_code: string;
  description: string;
  status: 'aktiv' | 'wartung' | 'defekt' | 'inaktiv';
  zustands_bewertung: number;
}

const AnlageNew: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<AnlageFormData>({
    name: '',
    t_nummer: '',
    aks_code: '',
    description: '',
    status: 'aktiv',
    zustands_bewertung: 5
  });

  const createMutation = useMutation(
    (data: AnlageFormData) => anlageService.createAnlage(data),
    {
      onSuccess: (newAnlage) => {
        queryClient.invalidateQueries('anlagen');
        navigate(`/anlagen/${newAnlage.id}`);
      },
      onError: (error: any) => {
        console.error('Error creating anlage:', error);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'zustands_bewertung' ? parseInt(value) : value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/anlagen')}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Neue Anlage erstellen
            </h2>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="t_nummer" className="block text-sm font-medium text-gray-700">
                T-Nummer
              </label>
              <input
                type="text"
                id="t_nummer"
                name="t_nummer"
                value={formData.t_nummer}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="aks_code" className="block text-sm font-medium text-gray-700">
                AKS-Code *
              </label>
              <input
                type="text"
                id="aks_code"
                name="aks_code"
                required
                placeholder="z.B. AKS.03 oder AKS.03.330.01"
                value={formData.aks_code}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="aktiv">Aktiv</option>
                <option value="wartung">Wartung</option>
                <option value="defekt">Defekt</option>
                <option value="inaktiv">Inaktiv</option>
              </select>
            </div>

            <div>
              <label htmlFor="zustands_bewertung" className="block text-sm font-medium text-gray-700">
                Zustandsbewertung (1-5)
              </label>
              <select
                id="zustands_bewertung"
                name="zustands_bewertung"
                value={formData.zustands_bewertung}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value={5}>5 - Sehr gut</option>
                <option value={4}>4 - Gut</option>
                <option value={3}>3 - Befriedigend</option>
                <option value={2}>2 - Ausreichend</option>
                <option value={1}>1 - Mangelhaft</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/anlagen')}
              className="btn-secondary"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Erstelle...' : 'Anlage erstellen'}
            </button>
          </div>
        </form>

        {createMutation.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-red-800">
              Fehler beim Erstellen der Anlage: {(createMutation.error as any)?.message || 'Unbekannter Fehler'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnlageNew;