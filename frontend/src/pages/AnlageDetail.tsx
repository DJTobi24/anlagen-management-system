import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { anlageService } from '../services/anlageService';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  InformationCircleIcon,
  TagIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AnlageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'details' | 'metadata' | 'history'>('details');
  
  const { data: anlage, isLoading, error } = useQuery(
    ['anlage', id],
    () => anlageService.getAnlage(id!),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !anlage) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Fehler beim Laden der Anlage</p>
        <Link to="/anlagen" className="text-primary-600 hover:text-primary-500 mt-4 inline-block">
          ← Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <Link
              to="/anlagen"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {anlage.name}
            </h2>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              anlage.status === 'aktiv' ? 'bg-green-100 text-green-800' :
              anlage.status === 'wartung' ? 'bg-yellow-100 text-yellow-800' :
              anlage.status === 'defekt' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {anlage.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {anlage.t_nummer || 'Keine T-Nummer'}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to={`/anlagen/${anlage.id}/edit`}
            className="btn-primary inline-flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <InformationCircleIcon className="h-5 w-5 inline-block mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metadata'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TagIcon className="h-5 w-5 inline-block mr-2" />
            Metadaten
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5 inline-block mr-2" />
            Historie
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grunddaten */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Grunddaten
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Anlagen-Nummer</dt>
                <dd className="mt-1 text-sm text-gray-900">{anlage.t_nummer || 'Keine T-Nummer'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">AKS-Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{anlage.aks_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Liegenschaft</dt>
                <dd className="mt-1 text-sm text-gray-900">{anlage.liegenschaft_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Objekt</dt>
                <dd className="mt-1 text-sm text-gray-900">{anlage.objekt_name}</dd>
              </div>
              {anlage.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Zustandsbewertung</dt>
                <dd className="mt-1 text-sm text-gray-900">{anlage.zustands_bewertung}/5</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Wartung */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Wartung
            </h3>
            <p className="text-sm text-gray-500">
              Wartungsinformationen sind noch nicht verfügbar.
            </p>
          </div>

          {/* QR-Code */}
          {anlage.qr_code && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                QR-Code
              </h3>
              <div className="text-center">
                <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                  {/* QR-Code would be generated here */}
                  <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    QR-Code
                    <br />
                    {anlage.qr_code}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadaten */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Metadaten
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Erstellt</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(anlage.created_at).toLocaleString('de-DE')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Zuletzt geändert</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(anlage.updated_at).toLocaleString('de-DE')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'metadata' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Import-Metadaten
          </h3>
          {anlage.metadaten && Object.keys(anlage.metadaten).length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {anlage.metadaten.vertrag && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Vertrag</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.vertrag}</dd>
                </div>
              )}
              {anlage.metadaten.suchbegriff && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Suchbegriff</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.suchbegriff}</dd>
                </div>
              )}
              {anlage.metadaten.suchbegriff1 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Suchbegriff 1</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.suchbegriff1}</dd>
                </div>
              )}
              {anlage.metadaten.kd_wirtschaftseinheit && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">KD Wirtschaftseinheit</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.kd_wirtschaftseinheit}</dd>
                </div>
              )}
              {anlage.metadaten.anzahl !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Anzahl</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {anlage.metadaten.anzahl} {anlage.metadaten.einheit || ''}
                  </dd>
                </div>
              )}
              {anlage.metadaten.vertragspositionen_beschreibung && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Vertragspositionen Beschreibung</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.vertragspositionen_beschreibung}</dd>
                </div>
              )}
              {anlage.metadaten.kunde_ansprechpartner && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kunde Ansprechpartner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.kunde_ansprechpartner}</dd>
                </div>
              )}
              {anlage.metadaten.attributsatz && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Attributsatz</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.attributsatz}</dd>
                </div>
              )}
              {anlage.metadaten.code && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.code}</dd>
                </div>
              )}
              {anlage.metadaten.aks_coba_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">AKS-Coba-ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.aks_coba_id}</dd>
                </div>
              )}
              {anlage.metadaten.aks_dl_alt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">AKS-DL-Alt</dt>
                  <dd className="mt-1 text-sm text-gray-900">{anlage.metadaten.aks_dl_alt}</dd>
                </div>
              )}
              {anlage.pruefpflichtig !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prüfpflichtig</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      anlage.pruefpflichtig ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {anlage.pruefpflichtig ? 'Ja' : 'Nein'}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">Keine Metadaten vorhanden</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Änderungshistorie
          </h3>
          <p className="text-gray-500 text-sm">Historie wird in einer zukünftigen Version implementiert</p>
        </div>
      )}
    </div>
  );
};

export default AnlageDetail;