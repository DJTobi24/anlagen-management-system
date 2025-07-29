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
import { Heading, Subheading } from '../components/ui/heading';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/button';
import { Dialog, DialogBody, DialogActions } from '../components/ui/dialog';

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
        <Text className="text-red-600 dark:text-red-500">Fehler beim Laden der Liegenschaften</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading>Liegenschaften</Heading>
          <Text className="mt-2">Verwalten Sie Ihre Liegenschaften und deren Gebäude</Text>
        </div>
        <Button onClick={() => setShowCreateModal(true)} color="indigo">
          <PlusIcon className="size-4" data-slot="icon" />
          Neue Liegenschaft
        </Button>
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
                  <Subheading level={3} className="truncate">
                    {liegenschaft.name}
                  </Subheading>
                  <Text className="mt-1 truncate">
                    {liegenschaft.address}
                  </Text>
                </div>
              </div>
              
              {liegenschaft.description && (
                <Text className="mt-3">
                  {liegenschaft.description}
                </Text>
              )}

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                  <Text className="text-sm">{liegenschaft.objekte_count} Objekte</Text>
                </div>
                <div className="flex items-center">
                  <WrenchScrewdriverIcon className="mr-1.5 size-5 text-zinc-400 dark:text-zinc-500" />
                  <Text className="text-sm">{liegenschaft.anlagen_count} Anlagen</Text>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-950/5 bg-zinc-50 px-6 py-3 dark:border-white/5 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate(`/liegenschaften/${liegenschaft.id}/objekte`)}
                    plain
                    className="text-sm"
                  >
                    <ArrowRightIcon className="size-4" data-slot="icon" />
                    Objekte anzeigen
                  </Button>
                  <Button
                    onClick={() => setEditingLiegenschaft(liegenschaft)}
                    plain
                    className="text-sm"
                  >
                    <PencilIcon className="size-4" data-slot="icon" />
                    Bearbeiten
                  </Button>
                </div>
                <Button
                  onClick={() => handleDelete(liegenschaft)}
                  plain
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  disabled={liegenschaft.objekte_count > 0}
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
      {liegenschaften.length === 0 && (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="mx-auto size-12 text-zinc-400 dark:text-zinc-500" />
          <Subheading level={3} className="mt-2">
            Keine Liegenschaften
          </Subheading>
          <Text className="mt-1">
            Erstellen Sie Ihre erste Liegenschaft, um zu beginnen.
          </Text>
          <div className="mt-6">
            <Button onClick={() => setShowCreateModal(true)} color="indigo">
              <PlusIcon className="size-4" data-slot="icon" />
              Neue Liegenschaft
            </Button>
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
      <Dialog open={!!deletingLiegenschaft} onClose={() => setDeletingLiegenschaft(null)}>
        <DialogBody>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <ExclamationTriangleIcon className="size-6 text-red-600 dark:text-red-500" />
              </div>
            </div>
            <div>
              <Subheading level={3}>Liegenschaft löschen</Subheading>
              <Text className="mt-2">
                Sind Sie sicher, dass Sie die Liegenschaft "{deletingLiegenschaft?.name}" löschen möchten? 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </Text>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            plain
            onClick={() => setDeletingLiegenschaft(null)}
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

export default Liegenschaften;