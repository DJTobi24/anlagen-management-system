import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Heading, Subheading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Text } from '../components/ui/text';
import {
  CameraIcon,
  ClipboardDocumentCheckIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  PhotoIcon,
  QrCodeIcon,
  FolderOpenIcon
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface DashboardStats {
  totalAnlagen: number;
  anlagenWithData: number;
  anlagenWithoutData: number;
  totalPhotos: number;
  totalAuftraege: number;
  activeAuftraege: number;
  completedAuftraege: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  aufnahmenByStatus: {
    offen: number;
    in_bearbeitung: number;
    abgeschlossen: number;
  };
  topUsers: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  weeklyProgress: Array<{
    day: string;
    count: number;
  }>;
}

const DataCollectionDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        anlagenRes,
        auftraegeRes,
        activityRes
      ] = await Promise.all([
        api.get('/anlagen/statistics'),
        api.get('/datenaufnahme/statistics'),
        api.get('/activity/recent')
      ]);

      // Process the data
      const anlagenStats = anlagenRes.data?.data || {};
      const auftraegeStats = auftraegeRes.data?.data || {};
      const recentActivity = activityRes.data?.data || [];

      // Calculate weekly progress (mock data for now)
      const weeklyProgress = [
        { day: 'Mo', count: 12 },
        { day: 'Di', count: 19 },
        { day: 'Mi', count: 15 },
        { day: 'Do', count: 25 },
        { day: 'Fr', count: 22 },
        { day: 'Sa', count: 8 },
        { day: 'So', count: 5 }
      ];

      // Top performers (mock data for now)
      const topUsers = [
        { name: 'Max Müller', count: 45, percentage: 28 },
        { name: 'Anna Schmidt', count: 38, percentage: 24 },
        { name: 'Tom Wagner', count: 32, percentage: 20 }
      ];

      setStats({
        totalAnlagen: anlagenStats.total || 0,
        anlagenWithData: anlagenStats.withData || 0,
        anlagenWithoutData: anlagenStats.withoutData || 0,
        totalPhotos: anlagenStats.totalPhotos || 0,
        totalAuftraege: auftraegeStats.total || 0,
        activeAuftraege: auftraegeStats.active || 0,
        completedAuftraege: auftraegeStats.completed || 0,
        recentActivity,
        aufnahmenByStatus: auftraegeStats.byStatus || {
          offen: 0,
          in_bearbeitung: 0,
          abgeschlossen: 0
        },
        topUsers,
        weeklyProgress
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values
      setStats({
        totalAnlagen: 0,
        anlagenWithData: 0,
        anlagenWithoutData: 0,
        totalPhotos: 0,
        totalAuftraege: 0,
        activeAuftraege: 0,
        completedAuftraege: 0,
        recentActivity: [],
        aufnahmenByStatus: {
          offen: 0,
          in_bearbeitung: 0,
          abgeschlossen: 0
        },
        topUsers: [],
        weeklyProgress: []
      });
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats
    ? Math.round((stats.anlagenWithData / Math.max(stats.totalAnlagen, 1)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Heading>Datenaufnahme Dashboard</Heading>
        <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
          Willkommen zurück, {user?.name}! Hier ist Ihre Übersicht der Datenaufnahme-Aktivitäten.
        </Text>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => navigate('/datenaufnahme')}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
        >
          <CameraIcon className="h-5 w-5" />
          Neue Aufnahme
        </Button>
        <Button
          onClick={() => navigate('/anlagen')}
          plain
          className="flex items-center justify-center gap-2 border-2 border-zinc-200 dark:border-zinc-700"
        >
          <BuildingOfficeIcon className="h-5 w-5" />
          Anlagen
        </Button>
        <Button
          onClick={() => navigate('/reports')}
          plain
          className="flex items-center justify-center gap-2 border-2 border-zinc-200 dark:border-zinc-700"
        >
          <ChartBarIcon className="h-5 w-5" />
          Reports
        </Button>
        <Button
          onClick={() => navigate('/fm-data-collection')}
          plain
          className="flex items-center justify-center gap-2 border-2 border-zinc-200 dark:border-zinc-700"
        >
          <QrCodeIcon className="h-5 w-5" />
          QR Scanner
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Anlagen */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Badge color="zinc">{completionRate}%</Badge>
          </div>
          <div>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt Anlagen</Text>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">
              {stats?.totalAnlagen || 0}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <Text className="text-xs">
                {stats?.anlagenWithData || 0} mit Daten
              </Text>
            </div>
          </div>
        </div>

        {/* Active Aufträge */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge color="amber">Aktiv</Badge>
          </div>
          <div>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Aktive Aufträge</Text>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">
              {stats?.activeAuftraege || 0}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <ClockIcon className="h-4 w-4 text-amber-500" />
              <Text className="text-xs">
                {stats?.aufnahmenByStatus.in_bearbeitung || 0} in Bearbeitung
              </Text>
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <DocumentCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge color="green">Heute</Badge>
          </div>
          <div>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Abgeschlossen</Text>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">
              {stats?.weeklyProgress[new Date().getDay() - 1]?.count || 0}
            </p>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              <Text className="text-xs font-medium">+12% vs. gestern</Text>
            </div>
          </div>
        </div>

        {/* Total Photos */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <PhotoIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge color="purple">Fotos</Badge>
          </div>
          <div>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt Fotos</Text>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">
              {stats?.totalPhotos || 0}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <CameraIcon className="h-4 w-4 text-purple-500" />
              <Text className="text-xs">
                Durchschnitt: {Math.round((stats?.totalPhotos || 0) / Math.max(stats?.anlagenWithData || 1, 1))} pro Anlage
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <Subheading>Wöchentlicher Fortschritt</Subheading>
            <Button plain className="text-sm">
              Details anzeigen
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="flex items-end justify-between h-48 gap-2">
            {stats?.weeklyProgress.map((day, index) => {
              const maxCount = Math.max(...(stats?.weeklyProgress.map(d => d.count) || [1]));
              const height = (day.count / maxCount) * 100;
              const isToday = index === new Date().getDay() - 1;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <Text className="text-xs font-medium mb-1">{day.count}</Text>
                    <div
                      className={clsx(
                        'w-full rounded-t-lg transition-all duration-300',
                        isToday
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <Text className="text-xs mt-2 font-medium">{day.day}</Text>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <Subheading>Top Aufnehmer</Subheading>
            <UserGroupIcon className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="space-y-4">
            {stats?.topUsers.map((performer, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                  index === 1 ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' :
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Text className="font-medium text-zinc-900 dark:text-white">
                    {performer.name}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                    {performer.count} Aufnahmen
                  </Text>
                </div>
                <div className="text-right">
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {performer.percentage}%
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Aufnahmen by Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <Subheading className="mb-6">Aufnahmen nach Status</Subheading>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <Text>Offen</Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="font-semibold">{stats?.aufnahmenByStatus.offen || 0}</Text>
                <Badge color="yellow">Neu</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <Text>In Bearbeitung</Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="font-semibold">{stats?.aufnahmenByStatus.in_bearbeitung || 0}</Text>
                <Badge color="blue">Aktiv</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Text>Abgeschlossen</Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="font-semibold">{stats?.aufnahmenByStatus.abgeschlossen || 0}</Text>
                <Badge color="green">Fertig</Badge>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${(stats?.aufnahmenByStatus.abgeschlossen || 0) / Math.max((stats?.totalAuftraege || 1), 1) * 100}%` }}
              />
              <div
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${(stats?.aufnahmenByStatus.in_bearbeitung || 0) / Math.max((stats?.totalAuftraege || 1), 1) * 100}%` }}
              />
              <div
                className="bg-yellow-500 transition-all duration-300"
                style={{ width: `${(stats?.aufnahmenByStatus.offen || 0) / Math.max((stats?.totalAuftraege || 1), 1) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <Subheading className="mb-6">Letzte Aktivitäten</Subheading>
          <div className="space-y-3">
            {stats?.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  activity.type === 'completed' ? 'bg-green-100 dark:bg-green-900/50' :
                  activity.type === 'created' ? 'bg-blue-100 dark:bg-blue-900/50' :
                  'bg-amber-100 dark:bg-amber-900/50'
                )}>
                  {activity.type === 'completed' ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : activity.type === 'created' ? (
                    <FolderOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-sm text-zinc-900 dark:text-white">
                    {activity.description}
                  </Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {activity.user} • {activity.timestamp}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Bereit für die nächste Datenaufnahme?</h3>
            <p className="text-indigo-100">
              Starten Sie jetzt eine neue Aufnahme oder sehen Sie sich offene Aufträge an.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/datenaufnahme')}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Neue Aufnahme starten
            </Button>
            <Button
              onClick={() => navigate('/meine-datenaufnahmen')}
              className="bg-white/20 text-white border border-white/30 hover:bg-white/30"
              plain
            >
              Meine Aufnahmen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollectionDashboard;