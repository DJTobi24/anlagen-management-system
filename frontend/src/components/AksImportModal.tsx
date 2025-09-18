import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { XMarkIcon, CloudArrowUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { aksService } from '../services/aksService';
import toast from 'react-hot-toast';

interface AksImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AksImportModal: React.FC<AksImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importWithFields, setImportWithFields] = useState(true);

  const importMutation = useMutation(
    (file: File) => {
      if (importWithFields) {
        return aksService.importWithFields(file);
      } else {
        return aksService.importFromExcel(file);
      }
    },
    {
      onSuccess: (result: any) => {
        const { success, failed, errors, importedFields } = result;
        
        if (failed === 0) {
          if (importWithFields && importedFields !== undefined) {
            toast.success(`${success} AKS-Codes und ${importedFields} Felder erfolgreich importiert!`);
          } else {
            toast.success(`${success} AKS-Codes erfolgreich importiert!`);
          }
        } else {
          toast.error(`Import abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen`);
        }
        
        onSuccess();
        handleClose();
      },
      onError: (error: any) => {
        console.error('Import failed:', error);
        toast.error('Fehler beim Import der AKS-Codes');
      }
    }
  );

  const downloadTemplateMutation = useMutation(
    () => {
      if (importWithFields) {
        return aksService.downloadImportTemplateWithFields();
      } else {
        return aksService.downloadImportTemplate();
      }
    },
    {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = importWithFields ? 'aks_import_template_with_fields.xlsx' : 'aks_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Vorlage heruntergeladen');
      },
      onError: () => {
        toast.error('Fehler beim Herunterladen der Vorlage');
      }
    }
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          droppedFile.type === 'application/vnd.ms-excel') {
        setFile(droppedFile);
      } else {
        toast.error('Bitte nur Excel-Dateien (.xlsx, .xls) hochladen');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDragActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                AKS-Codes importieren
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => downloadTemplateMutation.mutate()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={downloadTemplateMutation.isLoading}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Vorlage herunterladen
                </button>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importWithFields}
                    onChange={(e) => setImportWithFields(e.target.checked)}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Mit Felddefinitionen importieren</span>
                </label>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
              }`}
            >
              <div className="space-y-1 text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Datei auswählen</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">oder hier ablegen</p>
                </div>
                <p className="text-xs text-gray-500">
                  Excel-Dateien bis zu 10MB
                </p>
              </div>
            </div>

            {file && (
              <div className="mt-4">
                <p className="text-sm text-gray-900">
                  Ausgewählte Datei: <span className="font-medium">{file.name}</span>
                </p>
              </div>
            )}

            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Hinweis:</strong> {importWithFields ? 'Die Excel-Datei kann mehrere Blätter enthalten:' : 'Die Excel-Datei sollte folgende Spalten enthalten:'}
                  </p>
                  {importWithFields ? (
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="font-medium">Blatt 1 - AKS-Codes:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>AKS-Code (z.B. 480.010)</li>
                        <li>Bezeichnung</li>
                        <li>Beschreibung (optional)</li>
                      </ul>
                      <p className="font-medium mt-2">Blatt 2 - Felder (optional):</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>AKS-Code</li>
                        <li>Feldname, Bezeichnung, Feldtyp</li>
                        <li>Pflichtfeld, Einheit, etc.</li>
                      </ul>
                    </div>
                  ) : (
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      <li>AKS-Code (z.B. AKS.01.001.01)</li>
                      <li>Name</li>
                      <li>Beschreibung (optional)</li>
                      <li>Wartungsintervall in Monaten (optional)</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importMutation.isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {importMutation.isLoading ? 'Importiere...' : 'Importieren'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AksImportModal;