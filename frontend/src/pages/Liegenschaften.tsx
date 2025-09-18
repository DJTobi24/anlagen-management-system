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
// UI components removed - using standard HTML elements

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-500">Fehler beim Laden der Liegenschaften</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liegenschaften</h1>
          <p className="mt-2 text-sm text-gray-600">Verwalten Sie Ihre Liegenschaften und deren Gebäude</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Neue Liegenschaft
        </button>
      </div>

      {/* Liegenschaften Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {liegenschaften.map((liegenschaft: Liegenschaft) => (
          <div
            key={liegenschaft.id}
            className="overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm dark:bg-zinc-900 dark:ring-white/10"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/20">
                    <BuildingOffice2Icon className="size-6 text-indigo-600 dark:text-indigo-500" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-base font-medium text-gray-900 truncate">
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
                <div className="flex items-center">
                  <BuildingOfficeIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-sm text-gray-600">{liegenschaft.objekte_count} Objekte</span>
                </div>
                <div className="flex items-center">
                  <WrenchScrewdriverIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-sm text-gray-600">{liegenschaft.anlagen_count} Anlagen</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-950/5 bg-zinc-50 px-6 py-3 dark:border-white/5 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/liegenschaften/${liegenschaft.id}/objekte`)}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-1" />
                    Objekte anzeigen
                  </button>
                  <button
                    onClick={() => setEditingLiegenschaft(liegenschaft)}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(liegenschaft)}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <BuildingOffice2Icon className="mx-auto size-12 text-zinc-400 dark:text-zinc-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Keine Liegenschaften
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie Ihre erste Liegenschaft, um zu beginnen.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
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

      {/* Delete Confirmation Dialog */}
      {deletingLiegenschaft && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeletingLiegenschaft(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <ExclamationTriangleIcon className="size-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Liegenschaft löschen</h3>
              <p className="mt-2 text-sm text-gray-500">
                Sind Sie sicher, dass Sie die Liegenschaft "{deletingLiegenschaft?.name}" löschen möchten? 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            onClick={() => setDeletingLiegenschaft(null)}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleteMutation.isLoading}
            className="inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteMutation.isLoading ? 'Löschen...' : 'Löschen'}
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