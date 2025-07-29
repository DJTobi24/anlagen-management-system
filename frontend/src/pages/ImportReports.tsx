import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale/de';
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_by_name?: string;
  rollback_available: boolean;
}

interface ImportError {
  row: number;
  anlagencode?: string;
  anlagenname?: string;
  error: string;
  details?: any;
}

const ImportReports: React.FC = () => {
  const navigate = useNavigate();
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedImports, setExpandedImports] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadImports();
  }, [page]);

  const loadImports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/import/jobs?page=${page}&limit=10`);
      setImports(response.data.data.jobs);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (importId: string) => {
    const newExpanded = new Set(expandedImports);
    if (newExpanded.has(importId)) {
      newExpanded.delete(importId);
    } else {
      newExpanded.add(importId);
    }
    setExpandedImports(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Abgeschlossen';
      case 'failed':
        return 'Fehlgeschlagen';
      case 'processing':
        return 'In Bearbeitung';
      case 'cancelled':
        return 'Abgebrochen';
      case 'pending':
        return 'Ausstehend';
      default:
        return status;
    }
  };

  const downloadErrorReport = async (jobId: string) => {
    try {
      const response = await api.get(`/import/jobs/${jobId}/report`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fehler-report-${jobId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const parseImportErrors = (errors: any[]): ImportError[] => {
    return errors.map(error => {
      if (error.data) {
        return {
          row: error.row,
          anlagencode: error.data.anlagencode,
          anlagenname: error.data.anlagenname,
          error: error.error,
          details: error.data
        };
      }
      return {
        row: error.row,
        error: error.error
      };
    });
  };

  if (loading && imports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Import-Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Übersicht über alle durchgeführten Importe mit detaillierten Fehlerinformationen
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => navigate('/reports')}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {imports.map((importJob) => {
            const isExpanded = expandedImports.has(importJob.id);
            const errors = parseImportErrors(importJob.errors || []);
            
            return (
              <li key={importJob.id}>
                <div
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpanded(importJob.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <div className="flex items-center">
                        {getStatusIcon(importJob.status)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {importJob.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(importJob.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            {importJob.created_by_name && ` • ${importJob.created_by_name}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{importJob.success_count}</span>
                        <span className="text-gray-500"> erfolgreich</span>
                      </div>
                      {importJob.error_count > 0 && (
                        <div className="text-sm text-red-600">
                          <span className="font-medium">{importJob.error_count}</span>
                          <span> Fehler</span>
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        importJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                        importJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                        importJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(importJob.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Gesamtzeilen</dt>
                          <dd className="mt-1 text-sm text-gray-900">{importJob.total_rows}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Verarbeitet</dt>
                          <dd className="mt-1 text-sm text-gray-900">{importJob.processed_rows}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Dauer</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {importJob.completed_at ? 
                              `${Math.round((new Date(importJob.completed_at).getTime() - new Date(importJob.created_at).getTime()) / 1000)}s` :
                              '-'
                            }
                          </dd>
                        </div>
                      </div>

                      {errors.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">Fehlerdetails</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadErrorReport(importJob.id);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              Fehlerbericht herunterladen
                            </button>
                          </div>
                          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                            <div className="max-h-60 overflow-y-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Zeile
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      T-Nummer
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Anlagenname
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Fehler
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {errors.slice(0, 10).map((error, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {error.row}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {error.anlagencode || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        {error.anlagenname || '-'}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-red-600">
                                        {error.error}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {errors.length > 10 && (
                                <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                                  ... und {errors.length - 10} weitere Fehler
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Zurück
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Weiter
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === page
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportReports;