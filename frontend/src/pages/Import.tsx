import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { importService } from '../services/importService';
import { DocumentArrowUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Import: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: importJobs } = useQuery(
    'import-jobs',
    importService.getImportJobs,
    {
      refetchInterval: 5000, // Refresh every 5 seconds for active jobs
    }
  );

  const uploadMutation = useMutation(importService.uploadFile, {
    onSuccess: (data) => {
      toast.success('Import gestartet!');
      setSelectedFile(null);
      queryClient.invalidateQueries('import-jobs');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Upload fehlgeschlagen');
    },
  });

  const downloadTemplateMutation = useMutation(importService.downloadTemplate, {
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template heruntergeladen');
    },
    onError: () => {
      toast.error('Download fehlgeschlagen');
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setSelectedFile(files[0]);
      } else {
        toast.error('Nur Excel-Dateien (.xlsx) sind erlaubt');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Wartend';
      case 'processing':
        return 'Verarbeitung';
      case 'completed':
        return 'Abgeschlossen';
      case 'failed':
        return 'Fehlgeschlagen';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Excel Import
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Importieren Sie Anlagen-Daten aus Excel-Dateien
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => downloadTemplateMutation.mutate()}
            disabled={downloadTemplateMutation.isLoading}
            className="btn-secondary inline-flex items-center mr-4"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Template herunterladen
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Datei hochladen
          </h3>
          
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Excel-Datei auswählen</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">oder per Drag & Drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Nur .xlsx Dateien bis zu 50MB
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="btn-secondary text-sm"
                  >
                    Entfernen
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadMutation.isLoading}
                    className="btn-primary text-sm"
                  >
                    {uploadMutation.isLoading ? 'Hochladen...' : 'Hochladen'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Jobs */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Import-Verlauf
          </h3>
        </div>

        {!importJobs || importJobs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Noch keine Imports
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Laden Sie eine Excel-Datei hoch, um zu beginnen.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Datei
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Fortschritt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Ergebnis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Erstellt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${job.total_rows > 0 ? (job.processed_rows / job.total_rows) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {job.processed_rows}/{job.total_rows}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="text-green-600">
                          ✓ {job.successful_rows} erfolgreich
                        </div>
                        {job.failed_rows > 0 && (
                          <div className="text-red-600">
                            ✗ {job.failed_rows} fehlgeschlagen
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Import;