import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  CameraIcon,
  ClipboardDocumentCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Avatar } from '../ui/avatar';
import { Dropdown, DropdownButton, DropdownItem, DropdownLabel, DropdownMenu } from '../ui/dropdown';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['AKS-Verwaltung']); // AKS expanded by default
  
  console.log('User in Layout:', user); // Debug log

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Anlagen', href: '/anlagen', icon: BuildingOfficeIcon },
    { name: 'Liegenschaften', href: '/liegenschaften', icon: BuildingOffice2Icon },
    { name: 'FM-Datenaufnahme', href: '/fm-data-collection', icon: ClipboardDocumentListIcon },
    { name: 'Datenaufnahme-Verwaltung', href: '/datenaufnahme', icon: ClipboardDocumentCheckIcon },
    { name: 'Meine Aufnahmen', href: '/meine-datenaufnahmen', icon: CameraIcon, role: 'mitarbeiter' },
    { name: 'Import', href: '/import', icon: DocumentArrowUpIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  ];

  const adminNavigation = [
    { 
      name: 'AKS-Verwaltung', 
      href: '/aks', 
      icon: QrCodeIcon,
      children: [
        { name: 'AKS-Codes', href: '/aks', icon: QrCodeIcon },
        { name: 'AKS-Felder', href: '/aks-fields', icon: ClipboardDocumentListIcon },
      ]
    },
    { name: 'Benutzer', href: '/users', icon: UsersIcon },
    { name: 'Benutzerverwaltung', href: '/user-management', icon: UsersIcon, roles: ['admin', 'system_admin'] },
    { name: 'Einstellungen', href: '/settings', icon: CogIcon },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      if (prev.includes(itemName)) {
        return prev.filter(name => name !== itemName);
      } else {
        return [...prev, itemName];
      }
    });
  };

  const NavLink = ({ item, isChild = false }: { item: any, isChild?: boolean }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isParentActive = hasChildren && item.children.some((child: any) => 
      location.pathname === child.href || location.pathname.startsWith(child.href)
    );
    
    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`
              w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${isParentActive 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              }
            `}
          >
            <div className="flex items-center">
              <Icon className={`
                mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                ${isParentActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                }
              `} />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child: any) => (
                <NavLink key={child.name} item={child} isChild={true} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Link
        to={item.href}
        className={`
          group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
          ${isChild ? 'ml-8' : ''}
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
      </Link>
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
          {navigation
            .filter(item => !item.role || item.role === user?.rolle || user?.rolle === 'admin')
            .map((item) => (
              <NavLink key={item.name} item={item} />
            ))}

          {(user?.rolle === 'admin' || user?.rolle === 'supervisor' || user?.rolle === 'system_admin') && (
            <>
              <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
              <div className="px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Administration
                </p>
              </div>
              {adminNavigation
                .filter(item => {
                  if (user?.rolle === 'system_admin') return true;
                  if (user?.rolle === 'admin') {
                    if (item.roles) {
                      return item.roles.includes('admin');
                    }
                    return true;
                  }
                  if (user?.rolle === 'supervisor' && item.href === '/aks') return true;
                  return false;
                })
                .map((item) => (
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.mandant?.name}</p>
                  </div>
                </DropdownButton>
                <DropdownMenu anchor="bottom end" className="min-w-56">
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