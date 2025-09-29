import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import QRCode from 'react-qr-code';
import { Heading, Subheading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Text, Code } from '../components/ui/text';
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '../components/ui/description-list';
import { Divider } from '../components/ui/divider';
import {
  BuildingOfficeIcon,
  QrCodeIcon,
  PencilIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const SimplifiedAnlageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'metadata' | 'history'>('details');

  const { data: anlage, isLoading, error, refetch } = useQuery(
    ['anlage', id],
    async () => {
      const response = await api.get(`/anlagen/${id}`);
      return response.data?.data || response.data;
    },
    { enabled: !!id }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktiv':
        return <Badge color="green">Aktiv</Badge>;
      case 'inaktiv':
        return <Badge color="zinc">Inaktiv</Badge>;
      case 'wartung':
        return <Badge color="amber">In Wartung</Badge>;
      case 'defekt':
        return <Badge color="red">Defekt</Badge>;
      default:
        return <Badge color="zinc">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !anlage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <Text className="text-lg font-medium">Fehler beim Laden der Anlage</Text>
          <div className="mt-4 space-x-2">
            <Button onClick={() => refetch()}>
              Erneut versuchen
            </Button>
            <Button plain onClick={() => navigate('/anlagen')}>
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              plain
              onClick={() => navigate('/anlagen')}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Heading>{anlage.name}</Heading>
                {getStatusBadge(anlage.status)}
              </div>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {anlage.t_nummer || 'Keine T-Nummer'}
              </Text>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/anlagen/${id}/edit`)}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Bearbeiten
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            <InformationCircleIcon className="h-5 w-5" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
              activeTab === 'metadata'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            <TagIcon className="h-5 w-5" />
            Metadaten
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors',
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Historie
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'details' && (
          <>
            {/* Grunddaten */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <Subheading className="mb-4">Grunddaten</Subheading>
                <DescriptionList>
                  <DescriptionTerm>Anlagen-Nummer</DescriptionTerm>
                  <DescriptionDetails>{anlage.t_nummer || 'Keine Anlagen-Nummer'}</DescriptionDetails>

                  {anlage.qr_code_manual && (
                    <>
                      <DescriptionTerm>QR-Code (FM-Nummer)</DescriptionTerm>
                      <DescriptionDetails>
                        <Code>{anlage.qr_code_manual}</Code>
                        <span className="ml-2 text-xs text-zinc-500">(Manuell erfasst)</span>
                      </DescriptionDetails>
                    </>
                  )}

                  <DescriptionTerm>AKS-Code</DescriptionTerm>
                  <DescriptionDetails>
                    <Code>{anlage.aks_code}</Code>
                  </DescriptionDetails>

                  <DescriptionTerm>Liegenschaft</DescriptionTerm>
                  <DescriptionDetails>{anlage.liegenschaft_name || '-'}</DescriptionDetails>

                  <DescriptionTerm>Objekt</DescriptionTerm>
                  <DescriptionDetails>{anlage.objekt_name || '-'}</DescriptionDetails>

                  <DescriptionTerm>Status</DescriptionTerm>
                  <DescriptionDetails>{getStatusBadge(anlage.status)}</DescriptionDetails>

                  {anlage.naechste_wartung && (
                    <>
                      <DescriptionTerm>Nächste Wartung</DescriptionTerm>
                      <DescriptionDetails>
                        {new Date(anlage.naechste_wartung).toLocaleDateString('de-DE')}
                      </DescriptionDetails>
                    </>
                  )}

                  <DescriptionTerm>Erstellt am</DescriptionTerm>
                  <DescriptionDetails>
                    {anlage.created_at && new Date(anlage.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </DescriptionDetails>

                  <DescriptionTerm>Letzte Änderung</DescriptionTerm>
                  <DescriptionDetails>
                    {anlage.updated_at && new Date(anlage.updated_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </DescriptionDetails>
                </DescriptionList>
              </div>
            </div>

            {/* QR Code */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <Subheading className="mb-4">QR-Code</Subheading>
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  {anlage.qr_code_manual ? (
                    <QRCode
                      value={anlage.qr_code_manual}
                      size={200}
                      level="H"
                    />
                  ) : anlage.qr_code && anlage.qr_code.startsWith('data:image') ? (
                    <img
                      src={anlage.qr_code}
                      alt="Anlage QR-Code"
                      className="w-[200px] h-[200px]"
                    />
                  ) : anlage.qr_code ? (
                    <QRCode
                      value={anlage.qr_code}
                      size={200}
                      level="H"
                    />
                  ) : (
                    <QRCode
                      value={anlage.t_nummer || `AMS-${anlage.aks_code}`}
                      size={200}
                      level="H"
                    />
                  )}
                </div>
                <div className="mt-4 text-center">
                  <Code className="text-lg font-semibold">
                    {anlage.qr_code_manual || anlage.qr_code || anlage.t_nummer || `AMS-${anlage.aks_code}`}
                  </Code>
                  <div className="mt-1">
                    {anlage.qr_code_manual ? (
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">(Manuell erfasst)</Text>
                    ) : anlage.qr_code ? (
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">(System-generiert)</Text>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'metadata' && (
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <Subheading className="mb-4">Metadaten</Subheading>
              {anlage.metadaten && Object.keys(anlage.metadaten).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(anlage.metadaten).map(([key, value]) => (
                    <div key={key} className="border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1)}
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-900 dark:text-white">
                        {value?.toString() || '-'}
                      </dd>
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="text-zinc-500 dark:text-zinc-400">
                  Keine Metadaten vorhanden
                </Text>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <Subheading className="mb-4">Änderungshistorie</Subheading>
              {anlage.historie && anlage.historie.length > 0 ? (
                <div className="space-y-4">
                  {anlage.historie.map((eintrag: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <CheckCircleIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Text className="font-medium">{eintrag.aktion}</Text>
                        <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                          {eintrag.benutzer} • {new Date(eintrag.zeitpunkt).toLocaleString('de-DE')}
                        </Text>
                        {eintrag.aenderungen && (
                          <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {eintrag.aenderungen}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="text-zinc-500 dark:text-zinc-400">
                  Keine Historie vorhanden
                </Text>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedAnlageDetail;