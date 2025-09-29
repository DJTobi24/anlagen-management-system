import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import ModernCreateLiegenschaftModal from '../components/ModernCreateLiegenschaftModal';
import { Heading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../components/ui/dialog';
import clsx from 'clsx';

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

const ModernLiegenschaften: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLiegenschaft, setEditingLiegenschaft] = useState<Liegenschaft | null>(null);
  const [deletingLiegenschaft, setDeletingLiegenschaft] = useState<Liegenschaft | null>(null);

  // Fetch Liegenschaften
  const { data: liegenschaften = [], isLoading, error } = useQuery<Liegenschaft[]>(
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
      <div className="rounded-xl bg-red-50 p-6 dark:bg-red-900/30">
        <div className="flex items-center gap-x-3">
          <BuildingOffice2Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
          <p className="font-medium text-red-900 dark:text-red-200">Fehler beim Laden der Liegenschaften</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Liegenschaften</Heading>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Verwalten Sie Ihre Liegenschaften und deren Gebäude
          </p>
        </div>
        <Button color="indigo" onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Neue Liegenschaft
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-center gap-x-3">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/30">
              <BuildingOffice2Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Gesamt</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{liegenschaften.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-center gap-x-3">
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/30">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Objekte</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {liegenschaften.reduce((sum, l) => sum + l.objekte_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-center gap-x-3">
            <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/30">
              <BuildingOffice2Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Anlagen</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                {liegenschaften.reduce((sum, l) => sum + l.anlagen_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liegenschaften Grid */}
      {liegenschaften.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liegenschaften.map((liegenschaft) => (
            <div
              key={liegenschaft.id}
              className="group relative rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 transition-all hover:shadow-md dark:bg-zinc-900 dark:ring-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {liegenschaft.name}
                  </h3>
                  <div className="mt-2 flex items-start gap-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{liegenschaft.address}</span>
                  </div>
                  {liegenschaft.description && (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {liegenschaft.description}
                    </p>
                  )}
                </div>
                <Badge color={liegenschaft.is_active ? 'green' : 'zinc'}>
                  {liegenschaft.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-x-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                <div className="flex items-center gap-x-1">
                  <BuildingOfficeIcon className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {liegenschaft.objekte_count} Objekte
                  </span>
                </div>
                <div className="flex items-center gap-x-1">
                  <BuildingOffice2Icon className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {liegenschaft.anlagen_count} Anlagen
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-x-2">
                <Button
                                    plain
                  onClick={() => navigate(`/liegenschaften/${liegenschaft.id}/objekte`)}
                  className="flex-1"
                >
                  <ArrowRightIcon className="mr-1.5 h-3.5 w-3.5" />
                  Objekte anzeigen
                </Button>
                <Button
                                    plain
                  onClick={() => setEditingLiegenschaft(liegenschaft)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                                    plain
                  onClick={() => handleDelete(liegenschaft)}
                  disabled={liegenschaft.objekte_count > 0}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-12 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <BuildingOffice2Icon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
            Keine Liegenschaften vorhanden
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Erstellen Sie Ihre erste Liegenschaft
          </p>
          <Button
            color="indigo"
            className="mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Neue Liegenschaft erstellen
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <ModernCreateLiegenschaftModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries('liegenschaften');
          setShowCreateModal(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLiegenschaft} onClose={() => setDeletingLiegenschaft(null)}>
        <DialogTitle>Liegenschaft löschen</DialogTitle>
        <DialogDescription>
          Möchten Sie die Liegenschaft "{deletingLiegenschaft?.name}" wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </DialogDescription>
        <DialogBody>
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/30">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Achtung:</strong> Alle zugehörigen Daten werden ebenfalls gelöscht.
            </p>
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setDeletingLiegenschaft(null)}>
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

export default ModernLiegenschaften;