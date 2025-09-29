import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import datenaufnahmeService from '../services/datenaufnahmeService';
import { DatenaufnahmeAuftrag, DatenaufnahmeFilter } from '../types/datenaufnahme';
import CreateDatenaufnahmeModal from '../components/CreateDatenaufnahmeModal';
import DatenaufnahmeDetailModal from '../components/DatenaufnahmeDetailModal';
import { Heading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { Text } from '../components/ui/text';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const ModernDatenaufnahmeVerwaltung: React.FC = () => {
  const { user } = useAuth();
  const [auftraege, setAuftraege] = useState<DatenaufnahmeAuftrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAuftrag, setSelectedAuftrag] = useState<DatenaufnahmeAuftrag | null>(null);
  const [filter, setFilter] = useState<DatenaufnahmeFilter>({});

  useEffect(() => {
    loadAuftraege();
  }, [filter]);

  const loadAuftraege = async () => {
    try {
      setLoading(true);
      const data = await datenaufnahmeService.getDatenaufnahmen(filter);
      setAuftraege(data);
    } catch (error) {
      console.error('Fehler beim Laden der Datenaufnahmen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setFilter({ ...filter, status: status || undefined });
  };

  const handleViewDetails = async (auftrag: DatenaufnahmeAuftrag) => {
    try {
      const details = await datenaufnahmeService.getDatenaufnahme(auftrag.id);
      setSelectedAuftrag(details);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Fehler beim Laden der Details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie diese Datenaufnahme wirklich löschen?')) {
      try {
        await datenaufnahmeService.deleteDatenaufnahme(id);
        loadAuftraege();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: 'blue' | 'amber' | 'green' | 'zinc'; text: string }> = {
      vorbereitet: { color: 'blue', text: 'Vorbereitet' },
      in_bearbeitung: { color: 'amber', text: 'In Bearbeitung' },
      abgeschlossen: { color: 'green', text: 'Abgeschlossen' },
      pausiert: { color: 'zinc', text: 'Pausiert' }
    };

    const config = statusConfig[status] || { color: 'zinc', text: status };

    return <Badge color={config.color}>{config.text}</Badge>;
  };

  const getProgressBar = (auftrag: DatenaufnahmeAuftrag) => {
    const total = auftrag.anzahl_anlagen || 0;
    const completed = auftrag.anzahl_bearbeitet || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {percentage}%
        </span>
      </div>
    );
  };

  const canCreateAuftraege = user?.rolle === 'admin' || user?.rolle === 'supervisor' || user?.rolle === 'system_admin';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Heading>Datenaufnahme-Verwaltung</Heading>
        <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
          Erstellen und verwalten Sie Datenaufnahme-Aufträge für Ihre Mitarbeiter.
        </Text>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt</p>
              <p className="text-2xl font-semibold mt-1">{auftraege.length}</p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-zinc-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Vorbereitet</p>
              <p className="text-2xl font-semibold mt-1">
                {auftraege.filter(a => a.status === 'vorbereitet').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">In Bearbeitung</p>
              <p className="text-2xl font-semibold mt-1">
                {auftraege.filter(a => a.status === 'in_bearbeitung').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-amber-600 dark:bg-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Abgeschlossen</p>
              <p className="text-2xl font-semibold mt-1">
                {auftraege.filter(a => a.status === 'abgeschlossen').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-600 dark:bg-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select
                value={filter.status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="">Alle Status</option>
                <option value="vorbereitet">Vorbereitet</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="pausiert">Pausiert</option>
              </Select>
            </div>

            {canCreateAuftraege && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Neue Datenaufnahme
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Auftrags-Liste */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <Table className="[--gutter:theme(spacing.6)] sm:[--gutter:theme(spacing.8)]">
          <TableHead>
            <TableRow>
              <TableHeader>Titel</TableHeader>
              <TableHeader>Mitarbeiter</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Fortschritt</TableHeader>
              <TableHeader>Umfang</TableHeader>
              <TableHeader>Erstellt am</TableHeader>
              <TableHeader className="relative w-0">
                <span className="sr-only">Aktionen</span>
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : auftraege.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-zinc-400 mb-4" />
                    <Text className="text-zinc-500 dark:text-zinc-400">
                      Keine Datenaufnahmen gefunden
                    </Text>
                    {canCreateAuftraege && (
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4"
                      >
                        Erste Datenaufnahme erstellen
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              auftraege.map((auftrag) => (
                <TableRow key={auftrag.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        {auftrag.titel}
                      </div>
                      {auftrag.beschreibung && (
                        <Text className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1">
                          {auftrag.beschreibung}
                        </Text>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {auftrag.mitarbeiter_name || auftrag.mitarbeiter_email || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(auftrag.status)}
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    {getProgressBar(auftrag)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {(auftrag.anzahl_liegenschaften || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="h-4 w-4 text-zinc-400" />
                          <span>{auftrag.anzahl_liegenschaften} Liegenschaften</span>
                        </div>
                      )}
                      {(auftrag.anzahl_objekte || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <CubeIcon className="h-4 w-4 text-zinc-400" />
                          <span>{auftrag.anzahl_objekte} Objekte</span>
                        </div>
                      )}
                      {(auftrag.anzahl_anlagen || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <ChartBarIcon className="h-4 w-4 text-zinc-400" />
                          <span>{auftrag.anzahl_anlagen} Anlagen</span>
                          {(auftrag.zu_suchende_anlagen || 0) > 0 && (
                            <span className="text-xs text-amber-600">
                              ({auftrag.zu_suchende_anlagen} zu suchen)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {auftrag.created_at &&
                      new Date(auftrag.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        plain
                        onClick={() => handleViewDetails(auftrag)}
                        className="p-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {canCreateAuftraege && (
                        <Button
                          plain
                          onClick={() => handleDelete(auftrag.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDatenaufnahmeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAuftraege();
          }}
        />
      )}

      {showDetailModal && selectedAuftrag && (
        <DatenaufnahmeDetailModal
          isOpen={showDetailModal}
          auftrag={selectedAuftrag}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAuftrag(null);
          }}
        />
      )}
    </div>
  );
};

export default ModernDatenaufnahmeVerwaltung;