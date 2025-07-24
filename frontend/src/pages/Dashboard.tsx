import React from 'react';
import { useQuery } from 'react-query';
import { anlageService } from '../services/anlageService';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusColors = {
    aktiv: '#10B981',
    wartung: '#F59E0B',
    störung: '#EF4444',
    'außer Betrieb': '#6B7280',
  };

  const kategorieData = statistics?.anlagen_by_kategorie ? 
    Object.entries(statistics.anlagen_by_kategorie).map(([key, value]) => ({
      name: key,
      value: value,
    })) : [];

  const statusData = statistics?.anlagen_by_status ? 
    Object.entries(statistics.anlagen_by_status).map(([key, value]) => ({
      name: key,
      value: value,
      color: statusColors[key as keyof typeof statusColors],
    })) : [];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Gesamt Anlagen
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statistics?.total_anlagen || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Aktive Anlagen
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statistics?.anlagen_by_status?.aktiv || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Wartung fällig
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statistics?.wartung_faellig || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Überfällig
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {statistics?.wartung_ueberfaellig || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Anlagen nach Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Anlagen nach Kategorie
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kategorieData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wartung fällig */}
      {wartungFaellig && wartungFaellig.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Wartung fällig ({wartungFaellig.length})
            </h3>
            <Link
              to="/anlagen?filter=wartung_faellig"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Anlage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Standort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Nächste Wartung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wartungFaellig.slice(0, 5).map((anlage) => (
                  <tr key={anlage.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {anlage.bezeichnung}
                        </div>
                        <div className="text-sm text-gray-500">
                          {anlage.anlagen_nummer}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {anlage.liegenschaft} - {anlage.objekt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {anlage.naechste_wartung ? new Date(anlage.naechste_wartung).toLocaleDateString('de-DE') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        anlage.status === 'aktiv' ? 'bg-green-100 text-green-800' :
                        anlage.status === 'wartung' ? 'bg-yellow-100 text-yellow-800' :
                        anlage.status === 'störung' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {anlage.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;