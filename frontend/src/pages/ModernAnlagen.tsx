import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { anlageService } from '../services/anlageService';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Heading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '../components/ui/dropdown';
import clsx from 'clsx';

interface Anlage {
  id: string;
  name: string;
  t_nummer?: string;
  liegenschaft_name?: string;
  objekt_name?: string;
  aks_code?: string;
  status: string;
  metadaten?: {
    attributsatz?: string;
  };
  naechste_wartung?: string;
  letzte_wartung?: string;
}

const ModernAnlagen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error, refetch } = useQuery<Anlage[]>(
    ['anlagen', search, statusFilter],
    () => anlageService.getAnlagen({
      search: search || undefined,
      status: statusFilter || undefined,
    }),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aktiv':
        return CheckCircleIcon;
      case 'wartung':
        return WrenchScrewdriverIcon;
      case 'defekt':
        return ExclamationTriangleIcon;
      default:
        return BuildingOfficeIcon;
    }
  };

  const getStatusColor = (status: string): 'green' | 'yellow' | 'red' | 'zinc' => {
    switch (status) {
      case 'aktiv':
        return 'green';
      case 'wartung':
        return 'yellow';
      case 'defekt':
        return 'red';
      default:
        return 'zinc';
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
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          <p className="font-medium text-red-900 dark:text-red-200">Fehler beim Laden der Anlagen</p>
        </div>
      </div>
    );
  }

  const anlagen = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <Heading level={1}>Anlagenverwaltung</Heading>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Verwalten Sie alle Anlagen und deren Status ({anlagen.length} Einträge)
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/anlagen/new">
            <Button color="indigo">
              <PlusIcon className="mr-2 h-4 w-4" />
              Neue Anlage
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white/50 p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800/50 dark:ring-white/10 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="search" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Suche
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <Input
                type="text"
                name="search"
                id="search"
                placeholder="Bezeichnung, Nummer, Hersteller..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="sm:w-48">
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <Dropdown>
              <DropdownButton className="w-full justify-between">
                <span className="flex items-center gap-x-2">
                  <FunnelIcon className="h-4 w-4" />
                  {statusFilter || 'Alle Status'}
                </span>
              </DropdownButton>
              <DropdownMenu anchor="bottom start" className="min-w-48">
                <DropdownItem onClick={() => setStatusFilter('')}>
                  Alle Status
                </DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('aktiv')}>
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Aktiv
                </DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('wartung')}>
                  <WrenchScrewdriverIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Wartung
                </DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('defekt')}>
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Defekt
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex gap-2">
            <Button type="submit" color="indigo">
              Suchen
            </Button>
            {(search || statusFilter) && (
              <Button
                type="button"
                outline
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setStatusFilter('');
                }}
              >
                Zurücksetzen
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
        {anlagen.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Anlage</TableHeader>
                <TableHeader>Standort</TableHeader>
                <TableHeader>AKS-Code</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Nächste Wartung</TableHeader>
                <TableHeader className="text-right">Aktionen</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {anlagen.map((anlage) => {
                const StatusIcon = getStatusIcon(anlage.status);
                return (
                  <TableRow key={anlage.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {anlage.name}
                        </div>
                        {anlage.t_nummer && (
                          <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            T-Nr: {anlage.t_nummer}
                          </div>
                        )}
                        {anlage.metadaten?.attributsatz && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-zinc-600 dark:text-zinc-500" title={anlage.metadaten.attributsatz}>
                            {anlage.metadaten.attributsatz}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-zinc-900 dark:text-white">
                          {anlage.liegenschaft_name || '-'}
                        </div>
                        {anlage.objekt_name && (
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {anlage.objekt_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                        {anlage.aks_code || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusColor(anlage.status)}>
                        <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {anlage.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {anlage.naechste_wartung ? (
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(anlage.naechste_wartung).toLocaleDateString('de-DE')}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-x-1">
                        <Link to={`/anlagen/${anlage.id}`}>
                          <Button plain>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/anlagen/${anlage.id}/edit`}>
                          <Button plain>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <BuildingOfficeIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">Keine Anlagen gefunden</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Erstellen Sie eine neue Anlage oder ändern Sie Ihre Suchkriterien
            </p>
            <Link to="/anlagen/new" className="mt-4">
              <Button color="indigo">
                <PlusIcon className="mr-2 h-4 w-4" />
                Neue Anlage erstellen
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernAnlagen;