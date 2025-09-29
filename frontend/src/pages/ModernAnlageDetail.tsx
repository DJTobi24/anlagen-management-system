import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { Heading, Subheading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Text, Strong, Code } from '../components/ui/text';
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '../components/ui/description-list';
import { Divider } from '../components/ui/divider';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/table';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem, DropdownDivider } from '../components/ui/dropdown';
import { Alert, AlertTitle, AlertDescription, AlertBody, AlertActions } from '../components/ui/alert';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import {
  BuildingOfficeIcon,
  CameraIcon,
  ClockIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  QrCodeIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PhotoIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  FolderIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface AnlageDetail {
  id: string;
  name: string;
  aks_code: string;
  t_nummer?: string;
  liegenschaft_name?: string;
  liegenschaft_id?: string;
  objekt_name?: string;
  objekt_id?: string;
  status: 'aktiv' | 'inaktiv' | 'wartung';
  wartung_faellig?: boolean;
  letzte_pruefung?: string;
  naechste_wartung?: string;
  created_at: string;
  updated_at: string;
  has_photos?: boolean;
  photo_count?: number;
  data_complete?: boolean;
  metadaten?: {
    hersteller?: string;
    modell?: string;
    seriennummer?: string;
    baujahr?: string;
    leistung?: string;
    spannung?: string;
    attributsatz?: string;
    [key: string]: any;
  };
  wartungshistorie?: Array<{
    id: string;
    datum: string;
    typ: string;
    beschreibung: string;
    techniker: string;
    status: string;
  }>;
  dokumente?: Array<{
    id: string;
    name: string;
    typ: string;
    size: number;
    uploaded_at: string;
    uploaded_by: string;
  }>;
  fotos?: Array<{
    id: string;
    url: string;
    thumbnail_url: string;
    caption?: string;
    uploaded_at: string;
  }>;
}

const ModernAnlageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const { data: anlage, isLoading, error, refetch } = useQuery(
    ['anlage', id],
    async () => {
      const response = await api.get(`/anlagen/${id}`);
      return response.data?.data || response.data;
    }
  );

  const handleDelete = async () => {
    try {
      await api.delete(`/anlagen/${id}`);
      toast.success('Anlage erfolgreich gelöscht');
      navigate('/anlagen');
    } catch (error) {
      toast.error('Fehler beim Löschen der Anlage');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/anlagen/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anlage-${anlage?.aks_code || id}.pdf`);
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
          <Button onClick={() => refetch()} className="mt-4">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: 'Übersicht', icon: InformationCircleIcon },
    { name: 'Technische Daten', icon: WrenchScrewdriverIcon },
    { name: 'Wartung', icon: ClockIcon },
    { name: 'Dokumente', icon: DocumentIcon },
    { name: 'Fotos', icon: PhotoIcon },
    { name: 'Historie', icon: ChartBarIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            plain
            onClick={() => navigate('/anlagen')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Zurück
          </Button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <BuildingOfficeIcon className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Heading>{anlage.name}</Heading>
                  {getStatusBadge(anlage.status, anlage.wartung_faellig)}
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <QrCodeIcon className="h-4 w-4" />
                    <Code>{anlage.aks_code}</Code>
                  </div>
                  {anlage.t_nummer && (
                    <div className="flex items-center gap-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>T-Nr: {anlage.t_nummer}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{anlage.liegenschaft_name || 'Keine Liegenschaft'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(`/datenaufnahme?anlage=${id}`)}
                plain
                className="flex items-center gap-2"
              >
                <CameraIcon className="h-4 w-4" />
                Datenaufnahme
              </Button>
              <Button
                onClick={() => navigate(`/anlagen/${id}/edit`)}
                plain
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Bearbeiten
              </Button>
              <Dropdown>
                <DropdownButton plain>
                  Mehr
                </DropdownButton>
                <DropdownMenu anchor="bottom end">
                  <DropdownItem onClick={handleExport}>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Exportieren
                  </DropdownItem>
                  <DropdownItem onClick={() => setShowQrModal(true)}>
                    <QrCodeIcon className="h-4 w-4" />
                    QR-Code anzeigen
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem onClick={() => setShowDeleteModal(true)} className="text-red-600 dark:text-red-400">
                    <TrashIcon className="h-4 w-4" />
                    Löschen
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Fotos</Text>
                <PhotoIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xl font-semibold mt-1">{anlage.photo_count || 0}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Dokumente</Text>
                <DocumentIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xl font-semibold mt-1">{anlage.dokumente?.length || 0}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Wartungen</Text>
                <WrenchScrewdriverIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xl font-semibold mt-1">{anlage.wartungshistorie?.length || 0}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Datenstand</Text>
                {anlage.data_complete ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <p className="text-sm font-medium mt-1">
                {anlage.data_complete ? 'Vollständig' : 'Unvollständig'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
        <TabList className="flex gap-x-1 border-b border-zinc-200 dark:border-zinc-700 mb-6">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                clsx(
                  'flex items-center gap-x-2 px-4 py-2 text-sm font-medium outline-none',
                  'border-b-2 -mb-px transition-colors',
                  selected
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <Subheading className="mb-6">Allgemeine Informationen</Subheading>
            <DescriptionList>
              <DescriptionTerm>Anlagen-ID</DescriptionTerm>
              <DescriptionDetails>{anlage.id}</DescriptionDetails>

              <DescriptionTerm>AKS-Code</DescriptionTerm>
              <DescriptionDetails>
                <Code>{anlage.aks_code}</Code>
              </DescriptionDetails>

              {anlage.t_nummer && (
                <>
                  <DescriptionTerm>T-Nummer</DescriptionTerm>
                  <DescriptionDetails>{anlage.t_nummer}</DescriptionDetails>
                </>
              )}

              <DescriptionTerm>Liegenschaft</DescriptionTerm>
              <DescriptionDetails>
                {anlage.liegenschaft_name ? (
                  <Button
                    plain
                    onClick={() => navigate(`/liegenschaften/${anlage.liegenschaft_id}`)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {anlage.liegenschaft_name}
                  </Button>
                ) : (
                  'Keine zugewiesen'
                )}
              </DescriptionDetails>

              {anlage.objekt_name && (
                <>
                  <DescriptionTerm>Objekt</DescriptionTerm>
                  <DescriptionDetails>{anlage.objekt_name}</DescriptionDetails>
                </>
              )}

              <DescriptionTerm>Status</DescriptionTerm>
              <DescriptionDetails>
                {getStatusBadge(anlage.status, anlage.wartung_faellig)}
              </DescriptionDetails>

              <DescriptionTerm>Erstellt am</DescriptionTerm>
              <DescriptionDetails>
                {new Date(anlage.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </DescriptionDetails>

              <DescriptionTerm>Letzte Änderung</DescriptionTerm>
              <DescriptionDetails>
                {new Date(anlage.updated_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </DescriptionDetails>
            </DescriptionList>

            {anlage.metadaten?.attributsatz && (
              <>
                <Divider className="my-6" />
                <Subheading className="mb-4">Zusätzliche Attribute</Subheading>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <Text className="text-sm font-mono">{anlage.metadaten.attributsatz}</Text>
                </div>
              </>
            )}
          </TabPanel>

          {/* Technical Data Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <Subheading className="mb-6">Technische Spezifikationen</Subheading>
            {anlage.metadaten && Object.keys(anlage.metadaten).length > 0 ? (
              <DescriptionList>
                {anlage.metadaten.hersteller && (
                  <>
                    <DescriptionTerm>Hersteller</DescriptionTerm>
                    <DescriptionDetails>{anlage.metadaten.hersteller}</DescriptionDetails>
                  </>
                )}
                {anlage.metadaten.modell && (
                  <>
                    <DescriptionTerm>Modell</DescriptionTerm>
                    <DescriptionDetails>{anlage.metadaten.modell}</DescriptionDetails>
                  </>
                )}
                {anlage.metadaten.seriennummer && (
                  <>
                    <DescriptionTerm>Seriennummer</DescriptionTerm>
                    <DescriptionDetails><Code>{anlage.metadaten.seriennummer}</Code></DescriptionDetails>
                  </>
                )}
                {anlage.metadaten.baujahr && (
                  <>
                    <DescriptionTerm>Baujahr</DescriptionTerm>
                    <DescriptionDetails>{anlage.metadaten.baujahr}</DescriptionDetails>
                  </>
                )}
                {anlage.metadaten.leistung && (
                  <>
                    <DescriptionTerm>Leistung</DescriptionTerm>
                    <DescriptionDetails>{anlage.metadaten.leistung}</DescriptionDetails>
                  </>
                )}
                {anlage.metadaten.spannung && (
                  <>
                    <DescriptionTerm>Spannung</DescriptionTerm>
                    <DescriptionDetails>{anlage.metadaten.spannung}</DescriptionDetails>
                  </>
                )}
                {Object.entries(anlage.metadaten).map(([key, value]) => {
                  if (!['hersteller', 'modell', 'seriennummer', 'baujahr', 'leistung', 'spannung', 'attributsatz'].includes(key)) {
                    return (
                      <React.Fragment key={key}>
                        <DescriptionTerm>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1)}</DescriptionTerm>
                        <DescriptionDetails>{value?.toString()}</DescriptionDetails>
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </DescriptionList>
            ) : (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  Keine technischen Daten vorhanden
                </Text>
                <Button onClick={() => navigate(`/anlagen/${id}/edit`)} className="mt-4">
                  Daten hinzufügen
                </Button>
              </div>
            )}
          </TabPanel>

          {/* Maintenance Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <Subheading>Wartungshistorie</Subheading>
              <Button onClick={() => navigate(`/anlagen/${id}/wartung/neu`)} className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Wartung hinzufügen
              </Button>
            </div>

            {/* Maintenance Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Letzte Prüfung</Text>
                <p className="text-lg font-semibold mt-1">
                  {anlage.letzte_pruefung
                    ? new Date(anlage.letzte_pruefung).toLocaleDateString('de-DE')
                    : 'Keine'}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Nächste Wartung</Text>
                <p className="text-lg font-semibold mt-1">
                  {anlage.naechste_wartung
                    ? new Date(anlage.naechste_wartung).toLocaleDateString('de-DE')
                    : 'Nicht geplant'}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">Status</Text>
                <div className="mt-1">
                  {anlage.wartung_faellig ? (
                    <Badge color="amber">Wartung fällig</Badge>
                  ) : (
                    <Badge color="green">In Ordnung</Badge>
                  )}
                </div>
              </div>
            </div>

            {anlage.wartungshistorie && anlage.wartungshistorie.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Datum</TableHeader>
                    <TableHeader>Typ</TableHeader>
                    <TableHeader>Beschreibung</TableHeader>
                    <TableHeader>Techniker</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {anlage.wartungshistorie.map((wartung: any) => (
                    <TableRow key={wartung.id}>
                      <TableCell>
                        {new Date(wartung.datum).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <Badge color="zinc">{wartung.typ}</Badge>
                      </TableCell>
                      <TableCell>{wartung.beschreibung}</TableCell>
                      <TableCell>{wartung.techniker}</TableCell>
                      <TableCell>
                        <Badge color={wartung.status === 'abgeschlossen' ? 'green' : 'amber'}>
                          {wartung.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  Keine Wartungshistorie vorhanden
                </Text>
              </div>
            )}
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <Subheading>Dokumente</Subheading>
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Dokument hochladen
              </Button>
            </div>

            {anlage.dokumente && anlage.dokumente.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {anlage.dokumente.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <DocumentIcon className="h-8 w-8 text-zinc-400" />
                      <Badge color="zinc">{doc.typ}</Badge>
                    </div>
                    <Text className="font-medium text-sm mb-1">{doc.name}</Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(doc.uploaded_at).toLocaleDateString('de-DE')}
                    </Text>
                    <div className="mt-3 flex gap-2">
                      <Button plain className="text-xs">
                        Download
                      </Button>
                      <Button plain className="text-xs text-red-600">
                        Löschen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  Keine Dokumente vorhanden
                </Text>
              </div>
            )}
          </TabPanel>

          {/* Photos Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <Subheading>Fotos</Subheading>
              <Button onClick={() => navigate(`/datenaufnahme?anlage=${id}`)} className="flex items-center gap-2">
                <CameraIcon className="h-4 w-4" />
                Fotos hinzufügen
              </Button>
            </div>

            {anlage.fotos && anlage.fotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {anlage.fotos.map((foto: any) => (
                  <div key={foto.id} className="relative group">
                    <img
                      src={foto.thumbnail_url || foto.url}
                      alt={foto.caption || 'Anlage Foto'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button plain className="bg-white text-zinc-900 px-2 py-1 text-xs">
                          Ansehen
                        </Button>
                        <Button plain className="bg-red-600 text-white px-2 py-1 text-xs">
                          Löschen
                        </Button>
                      </div>
                    </div>
                    {foto.caption && (
                      <Text className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {foto.caption}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <PhotoIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  Keine Fotos vorhanden
                </Text>
                <Button onClick={() => navigate(`/datenaufnahme?anlage=${id}`)} className="mt-4">
                  Erste Fotos aufnehmen
                </Button>
              </div>
            )}
          </TabPanel>

          {/* History Tab */}
          <TabPanel className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <Subheading className="mb-6">Aktivitätsverlauf</Subheading>

            <div className="space-y-4">
              {/* Sample history items - would be fetched from API */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <Text className="font-medium">Wartung durchgeführt</Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                    Jährliche Inspektion abgeschlossen von Max Müller
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Vor 2 Tagen
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <CameraIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <Text className="font-medium">Fotos hinzugefügt</Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                    5 neue Fotos wurden hochgeladen
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Vor 1 Woche
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <Text className="font-medium">Anlage erstellt</Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                    Anlage wurde im System angelegt
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {anlage.created_at && new Date(anlage.created_at).toLocaleDateString('de-DE')}
                  </Text>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Alert open={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
          <AlertTitle>Anlage löschen</AlertTitle>
          <AlertDescription>
            Möchten Sie die Anlage <Strong>{anlage.name}</Strong> wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDescription>
          <AlertActions>
            <Button plain onClick={() => setShowDeleteModal(false)}>
              Abbrechen
            </Button>
            <Button color="red" onClick={handleDelete}>
              Löschen
            </Button>
          </AlertActions>
        </Alert>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <Alert open={showQrModal} onClose={() => setShowQrModal(false)} size="sm">
          <AlertTitle>QR-Code für {anlage.name}</AlertTitle>
          <AlertBody>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                {/* QR Code would be generated here */}
                <div className="h-64 w-64 bg-zinc-100 flex items-center justify-center">
                  <QrCodeIcon className="h-32 w-32 text-zinc-400" />
                </div>
              </div>
              <Code className="mt-4">{anlage.aks_code}</Code>
            </div>
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setShowQrModal(false)}>
              Schließen
            </Button>
            <Button color="indigo">
              QR-Code drucken
            </Button>
          </AlertActions>
        </Alert>
      )}
    </div>
  );
};

export default ModernAnlageDetail;