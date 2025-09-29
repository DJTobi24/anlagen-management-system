import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { Heading, Subheading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem, DropdownDivider } from '../components/ui/dropdown';
import { Checkbox } from '../components/ui/checkbox';
import { Text } from '../components/ui/text';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Anlage {
  id: string;
  name: string;
  aks_code: string;
  t_nummer?: string;
  liegenschaft_name?: string;
  objekt_name?: string;
  status: 'aktiv' | 'inaktiv' | 'wartung';
  wartung_faellig?: boolean;
  letzte_pruefung?: string;
  naechste_wartung?: string;
  created_at: string;
  has_photos?: boolean;
  photo_count?: number;
  data_complete?: boolean;
  metadaten?: {
    attributsatz?: string;
    [key: string]: any;
  };
}

const PerfectAnlagen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data, isLoading, error, refetch } = useQuery(
    ['anlagen', currentPage, itemsPerPage, searchTerm, statusFilter, sortField, sortOrder],
    async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sort: sortField,
        order: sortOrder
      });
      const response = await api.get(`/anlagen?${params}`);
      return response.data;
    },
    { keepPreviousData: true }
  );

  const anlagen = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  // Filter and sort anlagen
  const filteredAndSortedAnlagen = useMemo(() => {
    let filtered = [...anlagen];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((anlage) =>
        anlage.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.aks_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.t_nummer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.liegenschaft_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anlage.objekt_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((anlage) => anlage.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Anlage] || '';
      const bValue = b[sortField as keyof Anlage] || '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [anlagen, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedAnlagen.map(a => a.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!window.confirm(`Möchten Sie ${selectedItems.size} Anlagen wirklich löschen?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedItems).map(id => api.delete(`/anlagen/${id}`))
      );
      toast.success(`${selectedItems.size} Anlagen wurden gelöscht`);
      setSelectedItems(new Set());
      refetch();
    } catch (error) {
      toast.error('Fehler beim Löschen der Anlagen');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/anlagen/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anlagen-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export erfolgreich');
    } catch (error) {
      toast.error('Fehler beim Exportieren');
    }
  };

  const getStatusBadge = (status: string, wartungFaellig?: boolean) => {
    if (wartungFaellig) {
      return <Badge color="amber">Wartung fällig</Badge>;
    }

    switch (status) {
      case 'aktiv':
        return <Badge color="green">Aktiv</Badge>;
      case 'inaktiv':
        return <Badge color="zinc">Inaktiv</Badge>;
      case 'wartung':
        return <Badge color="amber">In Wartung</Badge>;
      default:
        return <Badge color="zinc">{status}</Badge>;
    }
  };

  const getDataCompleteness = (anlage: Anlage) => {
    const hasPhotos = anlage.photo_count && anlage.photo_count > 0;
    const hasData = anlage.data_complete;

    if (hasData && hasPhotos) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircleIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Vollständig</span>
        </div>
      );
    } else if (hasData || hasPhotos) {
      return (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <ClockIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Teilweise</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-zinc-400">
          <XCircleIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Keine Daten</span>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <Text className="text-lg font-medium">Fehler beim Laden der Anlagen</Text>
          <Button onClick={() => refetch()} className="mt-4">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading>Anlagenverwaltung</Heading>
          <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
            Verwalten Sie alle technischen Anlagen und deren Wartungsstatus
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            plain
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => navigate('/import')}
            plain
            className="flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={() => navigate('/anlagen/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            Neue Anlage
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt</Text>
              <p className="text-2xl font-semibold mt-1">{data?.total || 0}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">Aktiv</Text>
              <p className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-400">
                {anlagen.filter((a: Anlage) => a.status === 'aktiv').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">Wartung fällig</Text>
              <p className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-400">
                {anlagen.filter((a: Anlage) => a.wartung_faellig).length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">Mit Fotos</Text>
              <p className="text-2xl font-semibold mt-1">
                {anlagen.filter((a: Anlage) => a.photo_count && a.photo_count > 0).length}
              </p>
            </div>
            <CameraIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Suche nach Name, AKS-Code, T-Nummer oder Liegenschaft..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="all">Alle Status</option>
              <option value="aktiv">Aktiv</option>
              <option value="inaktiv">Inaktiv</option>
              <option value="wartung">In Wartung</option>
            </Select>
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="name">Name</option>
              <option value="aks_code">AKS-Code</option>
              <option value="t_nummer">T-Nummer</option>
              <option value="liegenschaft_name">Liegenschaft</option>
              <option value="created_at">Erstellt am</option>
              <option value="naechste_wartung">Nächste Wartung</option>
            </Select>
            <Button
              plain
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Selected Items Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Text className="text-sm">
              {selectedItems.size} {selectedItems.size === 1 ? 'Anlage' : 'Anlagen'} ausgewählt
            </Text>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkDelete}
                plain
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Löschen
              </Button>
              <Button
                onClick={() => setSelectedItems(new Set())}
                plain
              >
                Auswahl aufheben
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader className="w-12">
                  <Checkbox
                    checked={selectedItems.size === filteredAndSortedAnlagen.length && filteredAndSortedAnlagen.length > 0}
                    onChange={(checked) => handleSelectAll(checked)}
                  />
                </TableHeader>
                <TableHeader>Anlage</TableHeader>
                <TableHeader>AKS-Code</TableHeader>
                <TableHeader>Standort</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Datenstand</TableHeader>
                <TableHeader>Nächste Wartung</TableHeader>
                <TableHeader className="w-20"></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedAnlagen.map((anlage) => (
                <TableRow
                  key={anlage.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on checkbox or dropdown
                    const target = e.target as HTMLElement;
                    if (
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[data-dropdown]') ||
                      target.closest('button')
                    ) {
                      return;
                    }
                    navigate(`/anlagen/${anlage.id}`);
                  }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(anlage.id)}
                      onChange={(checked) => handleSelectItem(anlage.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                        {anlage.name || '-'}
                      </div>
                      {anlage.t_nummer && (
                        <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          T-Nr: {anlage.t_nummer}
                        </div>
                      )}
                      {anlage.has_photos && (
                        <div className="mt-1 flex items-center gap-1">
                          <CameraIcon className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-500">{anlage.photo_count || 0} Fotos</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <QrCodeIcon className="h-4 w-4 text-zinc-400" />
                      <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        {anlage.aks_code || '-'}
                      </code>
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
                    {getStatusBadge(anlage.status, anlage.wartung_faellig)}
                  </TableCell>
                  <TableCell>
                    {getDataCompleteness(anlage)}
                  </TableCell>
                  <TableCell>
                    {anlage.naechste_wartung ? (
                      <Text className="text-sm">
                        {new Date(anlage.naechste_wartung).toLocaleDateString('de-DE')}
                      </Text>
                    ) : (
                      <Text className="text-sm text-zinc-400">-</Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <div data-dropdown>
                      <Dropdown>
                        <DropdownButton plain>
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </DropdownButton>
                        <DropdownMenu anchor="bottom end">
                        <DropdownItem onClick={() => navigate(`/anlagen/${anlage.id}`)}>
                          <EyeIcon className="h-4 w-4" />
                          Anzeigen
                        </DropdownItem>
                        <DropdownItem onClick={() => navigate(`/anlagen/${anlage.id}/edit`)}>
                          <PencilIcon className="h-4 w-4" />
                          Bearbeiten
                        </DropdownItem>
                        <DropdownItem onClick={() => navigate(`/datenaufnahme?anlage=${anlage.id}`)}>
                          <CameraIcon className="h-4 w-4" />
                          Datenaufnahme
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem>
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          Duplizieren
                        </DropdownItem>
                        <DropdownItem className="text-red-600 dark:text-red-400">
                          <TrashIcon className="h-4 w-4" />
                          Löschen
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Zeige {((currentPage - 1) * itemsPerPage) + 1} bis {Math.min(currentPage * itemsPerPage, data?.total || 0)} von {data?.total || 0} Einträgen
            </Text>
            <div className="flex items-center gap-2">
              <Button
                plain
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (pageNum === currentPage) {
                  return (
                    <Button
                      key={pageNum}
                      className="px-3 bg-indigo-600 text-white"
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return (
                  <Button
                    key={pageNum}
                    plain
                    onClick={() => setCurrentPage(pageNum)}
                    className="px-3"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                plain
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfectAnlagen;