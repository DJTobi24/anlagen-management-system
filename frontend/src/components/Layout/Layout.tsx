import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CogIcon,
  DocumentArrowUpIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  QrCodeIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { Avatar } from '../ui/avatar';
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '../ui/dropdown';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Anlagen', href: '/anlagen', icon: BuildingOfficeIcon },
    { name: 'Liegenschaften', href: '/liegenschaften', icon: BuildingOffice2Icon },
    { name: 'FM-Datenaufnahme', href: '/fm-data-collection', icon: ClipboardDocumentListIcon },
    { name: 'Import', href: '/import', icon: DocumentArrowUpIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  ];

  const adminNavigation = [
    { name: 'AKS-Verwaltung', href: '/aks', icon: QrCodeIcon },
    { name: 'Benutzer', href: '/users', icon: UsersIcon },
    { name: 'Einstellungen', href: '/settings', icon: CogIcon },
  ];

  const NavLink = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
    const Icon = item.icon;
    
    return (
      <a
        href={item.href}
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
          ${isActive 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
          }
        `}
      >
        <Icon className={`
          mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
          ${isActive 
            ? 'text-indigo-600 dark:text-indigo-400' 
            : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
          }
        `} />
        {item.name}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-gray-800 transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <p className="text-base font-semibold text-gray-900 dark:text-white">AMS</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Anlagen-Management</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}

          {user?.rolle === 'admin' && (
            <>
              <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
              <div className="px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Administration
                </p>
              </div>
              {adminNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* Logout button */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
            Abmelden
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            
            {/* User dropdown */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Dropdown>
                <DropdownButton plain className="flex items-center gap-x-2 rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Avatar 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=6366f1&color=fff`} 
                    className="h-8 w-8"
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.mandant?.name}</p>
                  </div>
                </DropdownButton>
                <DropdownMenu anchor="bottom end" className="min-w-56">
                  <DropdownItem href="/settings">
                    <CogIcon className="h-4 w-4" data-slot="icon" />
                    <DropdownLabel>Einstellungen</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem onClick={logout}>
                    <ArrowRightOnRectangleIcon className="h-4 w-4" data-slot="icon" />
                    <DropdownLabel>Abmelden</DropdownLabel>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;