import React from 'react';
import { useQuery } from 'react-query';
import { anlageService } from '../services/anlageService';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Dashboard: React.FC = () => {
  const { data: statistics, isLoading } = useQuery(
    'statistics',
    anlageService.getStatistics
  );

  const { data: wartungFaellig } = useQuery(
    'wartung-faellig',
    anlageService.getWartungFaellig
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Gesamt Anlagen',
      value: statistics?.total_anlagen || 0,
      icon: BuildingOfficeIcon,
      change: '+4.75%',
      changeType: 'positive',
      color: 'bg-blue-500',
    },
    {
      name: 'Aktive Anlagen',
      value: statistics?.anlagen_by_status?.aktiv || 0,
      icon: CheckCircleIcon,
      change: '+2.02%',
      changeType: 'positive',
      color: 'bg-green-500',
    },
    {
      name: 'Wartung fällig',
      value: statistics?.wartung_faellig || 0,
      icon: ClockIcon,
      change: '-1.39%',
      changeType: 'negative',
      color: 'bg-yellow-500',
    },
    {
      name: 'Überfällig',
      value: statistics?.wartung_ueberfaellig || 0,
      icon: ExclamationTriangleIcon,
      change: '+3.14%',
      changeType: 'negative',
      color: 'bg-red-500',
    },
  ];

  const statusColors = {
    aktiv: '#10B981',
    wartung: '#F59E0B',
    defekt: '#EF4444',
    inaktiv: '#6B7280',
  };

  const kategorieData = statistics?.anlagen_by_kategorie ? 
    Object.entries(statistics.anlagen_by_kategorie).map(([key, value]) => ({
      name: key,
      value: value,
    })) : [];

  const statusData = statistics?.anlagen_by_status ? 
    Object.entries(statistics.anlagen_by_status).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      color: statusColors[key as keyof typeof statusColors],
    })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Überblick über Ihre Anlagen und aktuelle Wartungsaufgaben
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
            >
              <dt>
                <div className={`absolute rounded-md p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.changeType === 'positive' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                  )}
                  <span className="ml-1">{stat.change}</span>
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Anlagen nach Status
          </h3>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Anlagen nach Kategorie
          </h3>
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kategorieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Maintenance */}
      {wartungFaellig && wartungFaellig.length > 0 && (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Wartung fällig
              </h3>
              <Link
                to="/anlagen?filter=wartung_faellig"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Alle anzeigen →
              </Link>
            </div>
            <div className="mt-6 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                          Anlage
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Standort
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Status
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Details</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {wartungFaellig.slice(0, 5).map((anlage) => (
                        <tr key={anlage.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {anlage.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {anlage.t_nummer || 'Keine T-Nummer'}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>
                              <div>{anlage.liegenschaft_name}</div>
                              <div className="text-gray-400">{anlage.objekt_name}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              anlage.status === 'aktiv' 
                                ? 'bg-green-100 text-green-800' 
                                : anlage.status === 'wartung'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {anlage.status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <Link
                              to={`/anlagen/${anlage.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;