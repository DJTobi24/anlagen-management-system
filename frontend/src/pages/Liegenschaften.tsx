import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import CreateLiegenschaftModal from '../components/CreateLiegenschaftModal';
import EditLiegenschaftModal from '../components/EditLiegenschaftModal';

interface Liegenschaft {
  id: string;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
  objekte_count: number;
  anlagen_count: number;
  created_at: string;
  updated_at: string;
}

const Liegenschaften: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLiegenschaft, setEditingLiegenschaft] = useState<Liegenschaft | null>(null);
  const [deletingLiegenschaft, setDeletingLiegenschaft] = useState<Liegenschaft | null>(null);

  // Fetch Liegenschaften
  const { data: liegenschaften = [], isLoading, error } = useQuery(
    'liegenschaften',
    async () => {
      const response = await api.get('/liegenschaften');
      return response.data;
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/liegenschaften/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('liegenschaften');
        setDeletingLiegenschaft(null);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Fehler beim Löschen der Liegenschaft');
      }
    }
  );

  const handleDelete = (liegenschaft: Liegenschaft) => {
    if (liegenschaft.objekte_count > 0) {
      alert('Diese Liegenschaft kann nicht gelöscht werden, da noch Objekte vorhanden sind.');
      return;
    }
    setDeletingLiegenschaft(liegenschaft);
  };

  const confirmDelete = () => {
    if (deletingLiegenschaft) {
      deleteMutation.mutate(deletingLiegenschaft.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Fehler beim Laden der Liegenschaften</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Liegenschaften
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Verwalten Sie Ihre Liegenschaften und deren Gebäude
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Neue Liegenschaft
          </button>
        </div>
      </div>

      {/* Liegenschaften Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {liegenschaften.map((liegenschaft: Liegenschaft) => (
          <div
            key={liegenschaft.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOffice2Icon className="h-10 w-10 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {liegenschaft.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {liegenschaft.address}
                  </p>
                </div>
              </div>
              
              {liegenschaft.description && (
                <p className="mt-3 text-sm text-gray-600">
                  {liegenschaft.description}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {liegenschaft.objekte_count} Objekte
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <WrenchScrewdriverIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {liegenschaft.anlagen_count} Anlagen
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3">
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <button
                    onClick={() => navigate(`/liegenschaften/${liegenschaft.id}/objekte`)}
                    className="text-sm text-primary-600 hover:text-primary-900 font-medium flex items-center"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-1" />
                    Objekte anzeigen
                  </button>
                  <button
                    onClick={() => setEditingLiegenschaft(liegenschaft)}
                    className="text-sm text-primary-600 hover:text-primary-900 font-medium flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(liegenschaft)}
                  className="text-sm text-red-600 hover:text-red-900 font-medium flex items-center"
                  disabled={liegenschaft.objekte_count > 0}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {liegenschaften.length === 0 && (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Liegenschaften</h3>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie Ihre erste Liegenschaft, um zu beginnen.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Neue Liegenschaft
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateLiegenschaftModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('liegenschaften');
          }}
        />
      )}

      {/* Edit Modal */}
      {editingLiegenschaft && (
        <EditLiegenschaftModal
          liegenschaft={editingLiegenschaft}
          onClose={() => setEditingLiegenschaft(null)}
          onSuccess={() => {
            setEditingLiegenschaft(null);
            queryClient.invalidateQueries('liegenschaften');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingLiegenschaft && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Liegenschaft löschen
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Sind Sie sicher, dass Sie die Liegenschaft "{deletingLiegenschaft.name}" löschen möchten? 
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {deleteMutation.isLoading ? 'Löschen...' : 'Löschen'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingLiegenschaft(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Liegenschaften;