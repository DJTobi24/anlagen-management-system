import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import CreateObjektModal from '../components/CreateObjektModal';
import EditObjektModal from '../components/EditObjektModal';
// UI components removed - using standard HTML elements

interface Objekt {
  id: string;
  name: string;
  liegenschaft_id: string;
  floor?: string;
  room?: string;
  description?: string;
  is_active: boolean;
  anlagen_count: number;
  created_at: string;
  updated_at: string;
}

interface Liegenschaft {
  id: string;
  name: string;
  address: string;
}

const Objekte: React.FC = () => {
  const { liegenschaftId } = useParams<{ liegenschaftId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingObjekt, setEditingObjekt] = useState<Objekt | null>(null);
  const [deletingObjekt, setDeletingObjekt] = useState<Objekt | null>(null);

  // Fetch Liegenschaft details
  const { data: liegenschaft } = useQuery(
    ['liegenschaft', liegenschaftId],
    async () => {
      const response = await api.get(`/liegenschaften/${liegenschaftId}`);
      return response.data;
    },
    {
      enabled: !!liegenschaftId
    }
  );

  // Fetch Objekte
  const { data: objekte = [], isLoading, error } = useQuery(
    ['objekte', liegenschaftId],
    async () => {
      const url = liegenschaftId 
        ? `/objekte?liegenschaft_id=${liegenschaftId}`
        : '/objekte';
      const response = await api.get(url);
      return response.data;
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/objekte/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['objekte', liegenschaftId]);
        setDeletingObjekt(null);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Fehler beim Löschen des Objekts');
      }
    }
  );

  const handleDelete = (objekt: Objekt) => {
    if (objekt.anlagen_count > 0) {
      alert('Dieses Objekt kann nicht gelöscht werden, da noch Anlagen vorhanden sind.');
      return;
    }
    setDeletingObjekt(objekt);
  };

  const confirmDelete = () => {
    if (deletingObjekt) {
      deleteMutation.mutate(deletingObjekt.id);
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
        <p className="text-red-600 dark:text-red-500">Fehler beim Laden der Objekte</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {liegenschaftId && (
            <button
              onClick={() => navigate('/liegenschaften')}
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {liegenschaftId ? `Objekte in ${liegenschaft?.name}` : 'Alle Objekte'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">Verwalten Sie Ihre Gebäude und deren Anlagen</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Neues Objekt
        </button>
      </div>

      {/* Objekte Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {objekte.map((objekt: Objekt) => (
          <div
            key={objekt.id}
            className="overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm dark:bg-zinc-900 dark:ring-white/10"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                    <BuildingOfficeIcon className="size-6 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {objekt.name}
                  </h3>
                  {(objekt.floor || objekt.room) && (
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {objekt.floor && `Etage: ${objekt.floor}`}
                      {objekt.floor && objekt.room && ', '}
                      {objekt.room && `Raum: ${objekt.room}`}
                    </p>
                  )}
                </div>
              </div>
              
              {objekt.description && (
                <p className="mt-3 text-sm text-gray-600">
                  {objekt.description}
                </p>
              )}

              <div className="mt-4 flex items-center">
                <WrenchScrewdriverIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                <span className="text-sm text-gray-600">{objekt.anlagen_count} Anlagen</span>
              </div>
            </div>

            <div className="border-t border-zinc-950/5 bg-zinc-50 px-6 py-3 dark:border-white/5 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setEditingObjekt(objekt)}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDelete(objekt)}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={objekt.anlagen_count > 0}
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
      {objekte.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto size-12 text-zinc-400 dark:text-zinc-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Keine Objekte
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie Ihr erstes Objekt, um zu beginnen.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Neues Objekt
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateObjektModal
          liegenschaftId={liegenschaftId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['objekte', liegenschaftId]);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingObjekt && (
        <EditObjektModal
          objekt={editingObjekt}
          onClose={() => setEditingObjekt(null)}
          onSuccess={() => {
            setEditingObjekt(null);
            queryClient.invalidateQueries(['objekte', liegenschaftId]);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingObjekt && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeletingObjekt(null)}></div>
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">Objekt löschen</h3>
              <p className="mt-2 text-sm text-gray-500">
                Sind Sie sicher, dass Sie das Objekt "{deletingObjekt?.name}" löschen möchten? 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            onClick={() => setDeletingObjekt(null)}
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

export default Objekte;