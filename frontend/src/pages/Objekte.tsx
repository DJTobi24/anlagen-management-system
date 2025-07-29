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
import { Heading, Subheading } from '../components/ui/heading';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Dialog, DialogBody, DialogActions } from '../components/ui/dialog';

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
        <Text className="text-red-600 dark:text-red-500">Fehler beim Laden der Objekte</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {liegenschaftId && (
            <Button
              onClick={() => navigate('/liegenschaften')}
              plain
              className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400"
            >
              <ArrowLeftIcon className="size-5" />
            </Button>
          )}
          <div>
            <Heading>
              {liegenschaftId ? `Objekte in ${liegenschaft?.name}` : 'Alle Objekte'}
            </Heading>
            <Text className="mt-2">Verwalten Sie Ihre Gebäude und deren Anlagen</Text>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} color="indigo">
          <PlusIcon className="size-4" data-slot="icon" />
          Neues Objekt
        </Button>
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
                  <Subheading level={3} className="truncate">
                    {objekt.name}
                  </Subheading>
                  {(objekt.floor || objekt.room) && (
                    <Text className="mt-1 truncate">
                      {objekt.floor && `Etage: ${objekt.floor}`}
                      {objekt.floor && objekt.room && ', '}
                      {objekt.room && `Raum: ${objekt.room}`}
                    </Text>
                  )}
                </div>
              </div>
              
              {objekt.description && (
                <Text className="mt-3">
                  {objekt.description}
                </Text>
              )}

              <div className="mt-4 flex items-center">
                <WrenchScrewdriverIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                <Text className="text-sm">{objekt.anlagen_count} Anlagen</Text>
              </div>
            </div>

            <div className="border-t border-zinc-950/5 bg-zinc-50 px-6 py-3 dark:border-white/5 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setEditingObjekt(objekt)}
                  plain
                  className="text-sm"
                >
                  <PencilIcon className="size-4" data-slot="icon" />
                  Bearbeiten
                </Button>
                <Button
                  onClick={() => handleDelete(objekt)}
                  plain
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  disabled={objekt.anlagen_count > 0}
                >
                  <TrashIcon className="size-4" data-slot="icon" />
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {objekte.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto size-12 text-zinc-400 dark:text-zinc-500" />
          <Subheading level={3} className="mt-2">
            Keine Objekte
          </Subheading>
          <Text className="mt-1">
            Erstellen Sie Ihr erstes Objekt, um zu beginnen.
          </Text>
          <div className="mt-6">
            <Button onClick={() => setShowCreateModal(true)} color="indigo">
              <PlusIcon className="size-4" data-slot="icon" />
              Neues Objekt
            </Button>
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
      <Dialog open={!!deletingObjekt} onClose={() => setDeletingObjekt(null)}>
        <DialogBody>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <ExclamationTriangleIcon className="size-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
            <div>
              <Subheading level={3}>Objekt löschen</Subheading>
              <Text className="mt-2">
                Sind Sie sicher, dass Sie das Objekt "{deletingObjekt?.name}" löschen möchten? 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </Text>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            plain
            onClick={() => setDeletingObjekt(null)}
          >
            Abbrechen
          </Button>
          <Button
            color="red"
            onClick={confirmDelete}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Löschen...' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Objekte;