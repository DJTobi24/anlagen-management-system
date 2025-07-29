import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  DocumentChartBarIcon, 
  ArrowDownTrayIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const Reports: React.FC = () => {
  const location = useLocation();
  
  const reportTypes = [
    {
      id: 'imports',
      name: 'Import-Reports',
      description: 'Übersicht über alle Import-Vorgänge',
      icon: ArrowDownTrayIcon,
      path: '/reports/imports',
      stats: { label: 'Letzte Importe', value: '5' }
    },
    {
      id: 'anlagen',
      name: 'Anlagen-Reports',
      description: 'Berichte über Anlagenzustand und Wartungen',
      icon: DocumentChartBarIcon,
      path: '/reports/anlagen',
      stats: { label: 'Verfügbare Reports', value: '3' }
    },
    {
      id: 'statistics',
      name: 'Statistiken',
      description: 'Allgemeine Systemstatistiken',
      icon: ChartBarIcon,
      path: '/reports/statistics',
      stats: { label: 'Datenpunkte', value: '15' }
    }
  ];

  // Check if we're on the main reports page
  const isMainPage = location.pathname === '/reports';

  if (isMainPage) {
    return (
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Reports
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Übersicht über alle verfügbaren Berichte und Auswertungen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                to={report.path}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <dt>
                  <div className="absolute bg-indigo-500 rounded-md p-3">
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {report.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {report.stats.value}
                  </p>
                  <p className="ml-2 flex items-baseline text-sm text-gray-600">
                    {report.stats.label}
                  </p>
                </dd>
                <div className="ml-16">
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Sub-page layout
  return <Outlet />;
};

export default Reports;