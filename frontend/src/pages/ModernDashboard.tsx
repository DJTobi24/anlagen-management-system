import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../components/ui/badge';
import { Heading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import clsx from 'clsx';

interface Statistics {
  anlagen: {
    total: number;
    active: number;
    inactive: number;
    wartung_faellig: number;
  };
  liegenschaften: {
    total: number;
  };
  objekte: {
    total: number;
  };
  datenaufnahme: {
    offen: number;
    in_bearbeitung: number;
    abgeschlossen: number;
  };
}

interface MaintenanceAsset {
  id: string;
  bezeichnung: string;
  qr_code: string;
  letzte_wartung: string;
  naechste_wartung: string;
  status: string;
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue'
}: {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <div className={clsx('rounded-lg p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-x-1 text-sm">
            {trend === 'up' ? (
              <>
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">{change}</span>
              </>
            ) : (
              <>
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-600 dark:text-red-400">{change}</span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
        </p>
      </div>
    </div>
  );
}

const ModernDashboard: React.FC = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<Statistics>({
    anlagen: { total: 0, active: 0, inactive: 0, wartung_faellig: 0 },
    liegenschaften: { total: 0 },
    objekte: { total: 0 },
    datenaufnahme: { offen: 0, in_bearbeitung: 0, abgeschlossen: 0 },
  });
  const [maintenanceAssets, setMaintenanceAssets] = useState<MaintenanceAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, maintenanceRes] = await Promise.all([
          api.get('/anlagen/statistics'),
          api.get('/anlagen/wartung/faellig'),
        ]);
        setStatistics(statsRes.data);
        // Handle both array and object response formats
        const maintenanceData = Array.isArray(maintenanceRes.data)
          ? maintenanceRes.data
          : (maintenanceRes.data?.anlagen || []);
        setMaintenanceAssets(maintenanceData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totalAssets = statistics.anlagen?.total || 0;
  const activePercentage = totalAssets > 0
    ? Math.round(((statistics.anlagen?.active || 0) / totalAssets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Heading level={1}>
          Willkommen zurück, {user?.name}!
        </Heading>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Hier ist Ihre Übersicht über das Anlagen-Management-System.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/anlagen/new">
          <Button color="indigo">
            <BuildingOfficeIcon className="mr-2 h-4 w-4" />
            Neue Anlage
          </Button>
        </Link>
        <Link to="/import">
          <Button outline>
            Import starten
          </Button>
        </Link>
        <Link to="/datenaufnahme">
          <Button outline>
            Datenaufnahme
          </Button>
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gesamtanlagen"
          value={statistics.anlagen?.total || 0}
          icon={BuildingOfficeIcon}
          color="blue"
        />
        <StatCard
          title="Aktive Anlagen"
          value={statistics.anlagen?.active || 0}
          change={`${activePercentage}%`}
          trend={activePercentage > 50 ? 'up' : 'down'}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Wartung fällig"
          value={statistics.anlagen?.wartung_faellig || 0}
          icon={WrenchScrewdriverIcon}
          color="yellow"
        />
        <StatCard
          title="Offene Aufnahmen"
          value={statistics.datenaufnahme?.offen || 0}
          icon={ClipboardDocumentCheckIcon}
          color="red"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance Due */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-center justify-between mb-4">
            <Heading level={2}>Wartung fällig</Heading>
            <Link to="/anlagen?filter=wartung">
              <Button  outline>
                Alle anzeigen
              </Button>
            </Link>
          </div>

          {maintenanceAssets.length > 0 ? (
            <div className="space-y-3">
              {maintenanceAssets.map((asset) => (
                <Link
                  key={asset.id}
                  to={`/anlagen/${asset.id}`}
                  className="block rounded-lg border border-zinc-200 p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:hover:border-zinc-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900 dark:text-white">
                        {asset.bezeichnung}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        QR: {asset.qr_code}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-x-2">
                      <ClockIcon className="h-4 w-4 text-yellow-500" />
                      <Badge color="yellow">
                        {new Date(asset.naechste_wartung).toLocaleDateString('de-DE')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Keine Wartungen fällig
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="mb-4">
            <Heading level={2}>Aktivitätsübersicht</Heading>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Liegenschaften
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {statistics.liegenschaften?.total || 0}
                </p>
              </div>
              <Link to="/liegenschaften">
                <Button  outline>
                  Verwalten
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Objekte
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {statistics.objekte?.total || 0}
                </p>
              </div>
              <Link to="/objekte">
                <Button  outline>
                  Verwalten
                </Button>
              </Link>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-white">
                Datenaufnahme Status
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Offen</span>
                  <Badge color="red">{statistics.datenaufnahme?.offen || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">In Bearbeitung</span>
                  <Badge color="yellow">{statistics.datenaufnahme?.in_bearbeitung || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Abgeschlossen</span>
                  <Badge color="green">{statistics.datenaufnahme?.abgeschlossen || 0}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;