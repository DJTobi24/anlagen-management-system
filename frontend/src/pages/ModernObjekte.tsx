import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Heading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Text } from '../components/ui/text';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogTitle, DialogDescription, DialogActions } from '../components/ui/dialog';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import CreateObjektModal from '../components/CreateObjektModal';
import EditObjektModal from '../components/EditObjektModal';

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

const ModernObjekte: React.FC = () => {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-600 mb-4">Fehler beim Laden der Objekte</div>
          <Button onClick={() => window.location.reload()}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {liegenschaftId && (
              <Button
                plain
                onClick={() => navigate('/liegenschaften')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            )}
            <div>
              <Heading>
                {liegenschaftId ? `Objekte in ${liegenschaft?.name}` : 'Alle Objekte'}
              </Heading>
              {liegenschaft && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{liegenschaft.address}</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Neues Objekt
          </Button>
        </div>
      </div>

      {/* Objekte Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {objekte.map((objekt: Objekt) => (
          <div
            key={objekt.id}
            className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 p-3 shadow-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {objekt.name}
                    </h3>
                    {(objekt.floor || objekt.room) && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {objekt.floor && `Etage: ${objekt.floor}`}
                        {objekt.floor && objekt.room && ' • '}
                        {objekt.room && `Raum: ${objekt.room}`}
                      </p>
                    )}
                  </div>
                </div>
                {objekt.is_active ? (
                  <Badge color="green" className="text-xs">Aktiv</Badge>
                ) : (
                  <Badge color="zinc" className="text-xs">Inaktiv</Badge>
                )}
              </div>

              {objekt.description && (
                <Text className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {objekt.description}
                </Text>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {objekt.anlagen_count} {objekt.anlagen_count === 1 ? 'Anlage' : 'Anlagen'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <Button
                  plain
                  onClick={() => setEditingObjekt(objekt)}
                  className="text-sm flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  <PencilIcon className="h-4 w-4" />
                  Bearbeiten
                </Button>
                <Button
                  plain
                  onClick={() => handleDelete(objekt)}
                  disabled={objekt.anlagen_count > 0}
                  className="text-sm flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4" />
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {objekte.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <BuildingOfficeIcon className="h-12 w-12 text-zinc-400 dark:text-zinc-500" />
          </div>
          <Heading level={3} className="mt-6">
            Keine Objekte vorhanden
          </Heading>
          <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
            Erstellen Sie Ihr erstes Objekt, um zu beginnen.
          </Text>
          <div className="mt-6">
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Neues Objekt erstellen
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateObjektModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(['objekte', liegenschaftId]);
          }}
          liegenschaftId={liegenschaftId}
        />
      )}

      {/* Edit Modal */}
      {editingObjekt && (
        <EditObjektModal
          onClose={() => setEditingObjekt(null)}
          onSuccess={() => {
            setEditingObjekt(null);
            queryClient.invalidateQueries(['objekte', liegenschaftId]);
          }}
          objekt={editingObjekt}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingObjekt} onClose={() => setDeletingObjekt(null)}>
        <DialogTitle>Objekt löschen</DialogTitle>
        <DialogDescription>
          Möchten Sie das Objekt "{deletingObjekt?.name}" wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setDeletingObjekt(null)}>
            Abbrechen
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ModernObjekte;