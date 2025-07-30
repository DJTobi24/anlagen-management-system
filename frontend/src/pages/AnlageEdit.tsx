import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import QRCode from 'react-qr-code';
import { anlageService } from '../services/anlageService';
import objektService from '../services/objektService';
import { 
  ArrowLeftIcon, 
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AnlageEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    t_nummer: '',
    aks_code: '',
    objekt_id: '',
    status: 'aktiv',
    zustands_bewertung: 3,
    description: '',
    qr_code: '',
    attributsatz: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Anlage data
  const { data: anlage, isLoading: isLoadingAnlage } = useQuery(
    ['anlage', id],
    () => anlageService.getAnlage(id!),
    {
      enabled: !!id,
      onSuccess: (data) => {
        setFormData({
          name: data.name || '',
          t_nummer: data.t_nummer || '',
          aks_code: data.aks_code || '',
          objekt_id: data.objekt_id || '',
          status: data.status || 'aktiv',
          zustands_bewertung: data.zustands_bewertung || 3,
          description: data.description || '',
          qr_code: data.qr_code || '',
          attributsatz: data.metadaten?.attributsatz || ''
        });
      }
    }
  );

  // Load Objekte for dropdown
  const { data: objekte = [] } = useQuery(
    'objekte',
    () => objektService.getObjekte()
  );

  // Update mutation
  const updateMutation = useMutation(
    (data: any) => anlageService.updateAnlage(id!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['anlage', id]);
        queryClient.invalidateQueries('anlagen');
        navigate(`/anlagen/${id}`);
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const updateData = {
      name: formData.name,
      t_nummer: formData.t_nummer,
      aks_code: formData.aks_code,
      status: formData.status,
      zustands_bewertung: formData.zustands_bewertung,
      description: formData.description,
      metadaten: {
        ...(anlage?.metadaten || {}),
        attributsatz: formData.attributsatz
      }
    };
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    navigate(`/anlagen/${id}`);
  };

  if (isLoadingAnlage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!anlage) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Anlage nicht gefunden</p>
        <Link to="/anlagen" className="text-primary-600 hover:text-primary-500 mt-4 inline-block">
          ← Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Link
            to={`/anlagen/${id}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Anlage bearbeiten</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Grunddaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Bezeichnung *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input ${errors.name ? 'ring-red-500' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
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
                onChange={(e) => setFormData({ ...formData, t_nummer: e.target.value })}
                className="input"
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
                value={formData.aks_code}
                onChange={(e) => setFormData({ ...formData, aks_code: e.target.value })}
                className={`input ${errors.aks_code ? 'ring-red-500' : ''}`}
              />
              {errors.aks_code && (
                <p className="mt-1 text-sm text-red-600">{errors.aks_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="objekt_id" className="block text-sm font-medium text-gray-700">
                Objekt *
              </label>
              <select
                id="objekt_id"
                name="objekt_id"
                required
                value={formData.objekt_id}
                onChange={(e) => setFormData({ ...formData, objekt_id: e.target.value })}
                className={`input ${errors.objekt_id ? 'ring-red-500' : ''}`}
              >
                <option value="">Bitte wählen</option>
                {objekte.map((objekt) => (
                  <option key={objekt.id} value={objekt.id}>
                    {objekt.name}
                  </option>
                ))}
              </select>
              {errors.objekt_id && (
                <p className="mt-1 text-sm text-red-600">{errors.objekt_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
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

            <div>
              <label htmlFor="zustands_bewertung" className="block text-sm font-medium text-gray-700">
                Zustandsbewertung (1-5)
              </label>
              <select
                id="zustands_bewertung"
                name="zustands_bewertung"
                value={formData.zustands_bewertung}
                onChange={(e) => setFormData({ ...formData, zustands_bewertung: parseInt(e.target.value) })}
                className="input"
              >
                <option value="1">1 - Sehr gut</option>
                <option value="2">2 - Gut</option>
                <option value="3">3 - Mittel</option>
                <option value="4">4 - Schlecht</option>
                <option value="5">5 - Sehr schlecht</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="attributsatz" className="block text-sm font-medium text-gray-700">
                Anlagenbeschreibung (Attributsatz)
              </label>
              <textarea
                id="attributsatz"
                name="attributsatz"
                rows={4}
                value={formData.attributsatz}
                onChange={(e) => setFormData({ ...formData, attributsatz: e.target.value })}
                className="input"
                placeholder="Detaillierte technische Beschreibung der Anlage"
              />
              <p className="mt-1 text-sm text-gray-500">
                Wichtige Informationen über die Anlage aus Spalte R der Import-Datei
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700">
                QR-Code
              </label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    id="qr_code"
                    name="qr_code"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    className="input"
                  />
                </div>
                {formData.qr_code && (
                  <div className="flex-shrink-0 p-2 bg-white border border-gray-300 rounded-lg">
                    <QRCode 
                      value={formData.qr_code} 
                      size={64}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 64 64`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {updateMutation.isError && !errors && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Fehler beim Speichern
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Die Anlage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={updateMutation.isLoading}
            className="btn-primary"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            {updateMutation.isLoading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnlageEdit;