import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { aksService } from '../services/aksService';
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  QueueListIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { AksCode, AksImportResult } from '../types/aks';
import AksTreeView from '../components/AksTreeView';
import AksEditModal from '../components/AksEditModal';
import BulkUpdateModal from '../components/BulkUpdateModal';

const AksManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<AksImportResult | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [editingAksCode, setEditingAksCode] = useState<AksCode | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const limit = 20;

  const queryClient = useQueryClient();

  // Fetch AKS codes
  const { data: aksData, isLoading, error } = useQuery(
    ['aks-codes', { searchTerm, selectedCategory, page, limit }],
    () => aksService.searchAksCodes({
      code: searchTerm,
      category: selectedCategory,
      page,
      limit
    }),
    {
      keepPreviousData: true
    }
  );

  // Fetch categories
  const { data: categories } = useQuery(
    'aks-categories',
    aksService.getCategories
  );

  // Import mutation
  const importMutation = useMutation(
    (file: File) => aksService.importFromExcel(file),
    {
      onSuccess: (result) => {
        setImportResult(result);
        queryClient.invalidateQueries('aks-codes');
        setImportFile(null);
      },
      onError: (error: any) => {
        console.error('Import failed:', error);
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: string, data: Partial<AksCode> }) => aksService.updateAksCode(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
        setShowEditModal(false);
        setEditingAksCode(null);
      },
      onError: (error: any) => {
        console.error('Update failed:', error);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: string) => aksService.deleteAksCode(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
      },
      onError: (error: any) => {
        console.error('Delete failed:', error);
        const errorMessage = error?.response?.data?.error?.message || 'Fehler beim Löschen des AKS-Codes';
        alert(`Fehler: ${errorMessage}`);
      }
    }
  );

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (id: string) => aksService.toggleAksCodeStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
      },
      onError: (error: any) => {
        console.error('Toggle status failed:', error);
      }
    }
  );

  // Bulk mutations
  const bulkDeleteMutation = useMutation(
    (ids: string[]) => aksService.bulkDeleteAksCodes(ids),
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        
        const { successCount, failureCount, errors } = result.data;
        if (failureCount > 0) {
          const errorMessages = errors.map((err: any) => `${err.error}`).join('\n');
          alert(`Bulk-Löschung abgeschlossen:\n✅ ${successCount} erfolgreich gelöscht\n❌ ${failureCount} fehlgeschlagen\n\nFehler:\n${errorMessages}`);
        } else {
          alert(`✅ Alle ${successCount} AKS-Codes erfolgreich gelöscht!`);
        }
      },
      onError: (error: any) => {
        console.error('Bulk delete failed:', error);
        const errorMessage = error?.response?.data?.error?.message || 'Fehler beim Bulk-Löschen';
        alert(`Fehler: ${errorMessage}`);
      }
    }
  );

  const bulkToggleStatusMutation = useMutation(
    ({ ids, isActive }: { ids: string[], isActive: boolean }) => 
      aksService.bulkToggleAksCodesStatus(ids, isActive),
    {
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        
        const { successCount, failureCount, errors } = result.data;
        const action = variables.isActive ? 'aktiviert' : 'deaktiviert';
        if (failureCount > 0) {
          const errorMessages = errors.map((err: any) => `${err.error}`).join('\n');
          alert(`Status-Update abgeschlossen:\n✅ ${successCount} erfolgreich ${action}\n❌ ${failureCount} fehlgeschlagen\n\nFehler:\n${errorMessages}`);
        } else {
          alert(`✅ Alle ${successCount} AKS-Codes erfolgreich ${action}!`);
        }
      },
      onError: (error: any) => {
        console.error('Bulk toggle status failed:', error);
        const errorMessage = error?.response?.data?.error?.message || 'Fehler beim Status-Update';
        alert(`Fehler: ${errorMessage}`);
      }
    }
  );

  const bulkUpdateMutation = useMutation(
    ({ ids, updateData }: { ids: string[], updateData: any }) => 
      aksService.bulkUpdateAksCodes(ids, updateData),
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(['aks-codes']);
        queryClient.invalidateQueries(['aks-tree-root']);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        setShowBulkUpdateModal(false);
        
        const { successCount, failureCount, errors } = result.data;
        if (failureCount > 0) {
          const errorMessages = errors.map((err: any) => `${err.error}`).join('\n');
          alert(`Bulk-Update abgeschlossen:\n✅ ${successCount} erfolgreich aktualisiert\n❌ ${failureCount} fehlgeschlagen\n\nFehler:\n${errorMessages}`);
        } else {
          alert(`✅ Alle ${successCount} AKS-Codes erfolgreich aktualisiert!`);
        }
      },
      onError: (error: any) => {
        console.error('Bulk update failed:', error);
        const errorMessage = error?.response?.data?.error?.message || 'Fehler beim Bulk-Update';
        alert(`Fehler: ${errorMessage}`);
      }
    }
  );

  const handleImport = async () => {
    if (!importFile) return;
    importMutation.mutate(importFile);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await aksService.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aks_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleEditAksCode = (aksCode: AksCode) => {
    setEditingAksCode(aksCode);
    setShowEditModal(true);
  };

  const handleDeleteAksCode = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen AKS-Code löschen möchten?\n\nHinweis: AKS-Codes mit Untergeordneten können nicht gelöscht werden.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const handleUpdateAksCode = (data: Partial<AksCode>) => {
    if (!editingAksCode) return;
    updateMutation.mutate({ id: editingAksCode.id, data });
  };

  // Bulk actions handlers
  const handleSelectAll = () => {
    if (viewMode === 'table' && aksData?.data?.codes) {
      const allIds = aksData.data.codes.map((code: AksCode) => code.id);
      setSelectedIds(new Set(allIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Sind Sie sicher, dass Sie ${selectedIds.size} AKS-Codes löschen möchten?\n\nHinweis: AKS-Codes mit Untergeordneten können nicht gelöscht werden und werden übersprungen.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.size === 0) return;
    bulkToggleStatusMutation.mutate({ ids: Array.from(selectedIds), isActive: true });
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.size === 0) return;
    bulkToggleStatusMutation.mutate({ ids: Array.from(selectedIds), isActive: false });
  };

  const handleBulkUpdate = (updateData: any) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), updateData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Fehler beim Laden der AKS-Codes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            AKS-Verwaltung
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Verwaltung der Anlagen-Kennzeichnungs-System Codes
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'tree'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4 mr-1 inline" />
              Baum
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <QueueListIcon className="h-4 w-4 mr-1 inline" />
              Tabelle
            </button>
          </div>

          <button
            onClick={downloadTemplate}
            className="btn-secondary inline-flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary inline-flex items-centers"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Erstellen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Suche
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="AKS-Code oder Name suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Kategorie
            </label>
            <select
              id="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Alle Kategorien</option>
              {categories?.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setPage(1);
              }}
              className="btn-secondary inline-flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'tree' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View */}
          <div className="lg:col-span-2">
            <div className="card h-96">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  AKS-Hierarchie
                </h3>
                <div className="text-sm text-gray-500">
                  Klicken Sie auf einen Eintrag für Details
                </div>
              </div>
              <AksTreeView 
                onSelectNode={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
            </div>
          </div>

          {/* Details Panel */}
          <div>
            <div className="card">
              {selectedNode ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedNode.name}
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">AKS-Code</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {selectedNode.code}
                      </dd>
                    </div>
                    {selectedNode.description && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedNode.description}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ebene</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedNode.level || 'Nicht definiert'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Typ</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedNode.isCategory 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedNode.isCategory ? 'Kategorie' : 'Anlage'}
                        </span>
                      </dd>
                    </div>
                    {selectedNode.maintenanceIntervalMonths && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Wartungsintervall</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedNode.maintenanceIntervalMonths} Monate
                          {selectedNode.maintenanceType && (
                            <span className="text-gray-500"> ({selectedNode.maintenanceType})</span>
                          )}
                        </dd>
                      </div>
                    )}
                    {selectedNode.maintenanceDescription && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Wartungsbeschreibung</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedNode.maintenanceDescription}
                        </dd>
                      </div>
                    )}
                  </dl>
                  
                  <div className="mt-6 flex space-x-3">
                    <button 
                      className="btn-primary text-sm"
                      onClick={() => handleEditAksCode(selectedNode)}
                    >
                      Bearbeiten
                    </button>
                    <button 
                      className="btn-secondary text-sm"
                      onClick={() => handleToggleStatus(selectedNode.id)}
                    >
                      {selectedNode.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button 
                      className="btn-secondary text-sm text-red-600"
                      onClick={() => handleDeleteAksCode(selectedNode.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Squares2X2Icon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">
                    Wählen Sie einen AKS-Code aus der Hierarchie aus
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Table View with bulk actions
        <div className="space-y-4">
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedIds.size} AKS-Code(s) ausgewählt
                  </span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Auswahl aufheben
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkActivate}
                    className="btn-secondary text-sm"
                    disabled={bulkToggleStatusMutation.isLoading}
                  >
                    Aktivieren
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="btn-secondary text-sm"
                    disabled={bulkToggleStatusMutation.isLoading}
                  >
                    Deaktivieren
                  </button>
                  <button
                    onClick={() => setShowBulkUpdateModal(true)}
                    className="btn-secondary text-sm"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="btn-secondary text-sm text-red-600"
                    disabled={bulkDeleteMutation.isLoading}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === aksData?.data?.codes?.length}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AKS-Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wartungsintervall
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aksData?.data?.codes?.map((aksCode: AksCode) => (
                  <tr key={aksCode.id} className={`hover:bg-gray-50 ${
                    selectedIds.has(aksCode.id) ? 'bg-blue-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(aksCode.id)}
                        onChange={() => handleSelectToggle(aksCode.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {aksCode.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{aksCode.name}</div>
                        {aksCode.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {aksCode.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aksCode.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aksCode.maintenanceIntervalMonths 
                        ? `${aksCode.maintenanceIntervalMonths} Monate`
                        : 'Nicht definiert'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        aksCode.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {aksCode.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        onClick={() => handleEditAksCode(aksCode)}
                      >
                        Bearbeiten
                      </button>
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={() => handleToggleStatus(aksCode.id)}
                      >
                        {aksCode.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteAksCode(aksCode.id)}
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                AKS-Codes aus Excel importieren
              </h3>
              
              {!importResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excel-Datei auswählen
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Die Excel-Datei sollte folgende Spalten enthalten:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>AKS-Code (Format: AKS.XX, AKS.XX.XXX, AKS.XX.XXX.XX oder AKS.XX.XXX.XX.XX)</li>
                      <li>Name</li>
                      <li>Beschreibung</li>
                      <li>Wartungsintervall (Monate)</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                      }}
                      className="btn-secondary"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || importMutation.isLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {importMutation.isLoading ? 'Importiere...' : 'Importieren'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Import-Ergebnis</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt>Gesamtzeilen:</dt>
                        <dd className="font-medium">{importResult.totalRows}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Erfolgreich:</dt>
                        <dd className="font-medium text-green-600">{importResult.successfulImports}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Fehlgeschlagen:</dt>
                        <dd className="font-medium text-red-600">{importResult.failedImports}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Neue AKS-Codes:</dt>
                        <dd className="font-medium text-blue-600">{importResult.createdCodes}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Aktualisierte AKS-Codes:</dt>
                        <dd className="font-medium text-yellow-600">{importResult.updatedCodes}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-md">
                      <h5 className="font-medium text-red-800 mb-2">Fehler:</h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>
                            Zeile {error.row}: {error.message}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="italic">
                            ... und {importResult.errors.length - 5} weitere Fehler
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResult(null);
                        setImportFile(null);
                      }}
                      className="btn-primary"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AksEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAksCode(null);
        }}
        aksCode={editingAksCode}
        onSave={handleUpdateAksCode}
        isLoading={updateMutation.isLoading}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        onSave={handleBulkUpdate}
        selectedCount={selectedIds.size}
        isLoading={bulkUpdateMutation.isLoading}
      />
    </div>
  );
};

export default AksManagement;