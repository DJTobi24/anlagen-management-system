import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import {
  HomeIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  DocumentArrowUpIcon,
  DocumentChartBarIcon,
  CameraIcon,
  ClipboardDocumentCheckIcon,
  QrCodeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Avatar } from '../ui/avatar';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../ui/dropdown';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  role?: string;
  roles?: string[];
  children?: NavItem[];
}

function OpenMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-zinc-500">
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true" className="size-5 fill-zinc-500">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function MobileSidebar({
  open,
  close,
  children
}: {
  open: boolean;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-[closed]:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-white shadow-xl ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
          <div className="px-6 pb-4 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
                  <BuildingOfficeIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white">AMS</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Anlagen-Management</p>
                </div>
              </div>
              <Headless.CloseButton className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-800">
                <CloseMenuIcon />
              </Headless.CloseButton>
            </div>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  );
}

const ModernLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['AKS-Verwaltung']);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Anlagen', href: '/anlagen', icon: BuildingOfficeIcon },
    { name: 'Liegenschaften', href: '/liegenschaften', icon: BuildingOffice2Icon },
    { name: 'FM-Datenaufnahme', href: '/fm-data-collection', icon: ClipboardDocumentListIcon },
    { name: 'Datenaufnahme', href: '/datenaufnahme', icon: ClipboardDocumentCheckIcon },
    { name: 'Meine Aufnahmen', href: '/meine-datenaufnahmen', icon: CameraIcon, role: 'mitarbeiter' },
    { name: 'Import', href: '/import', icon: DocumentArrowUpIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  ];

  const adminNavigation: NavItem[] = [
    {
      name: 'AKS-Verwaltung',
      href: '/aks',
      icon: QrCodeIcon,
      children: [
        { name: 'AKS-Codes', href: '/aks', icon: QrCodeIcon },
        { name: 'AKS-Felder', href: '/aks-fields', icon: ClipboardDocumentListIcon },
      ]
    },
    { name: 'Benutzerverwaltung', href: '/users', icon: UsersIcon, roles: ['admin', 'system_admin'] },
    { name: 'Einstellungen', href: '/settings', icon: Cog6ToothIcon },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href ||
           (href !== '/' && location.pathname.startsWith(href));
  };

  const NavLink = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const active = isActive(item.href) ||
                  (hasChildren && item.children?.some(child => isActive(child.href)));

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={clsx(
              'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 dark:from-indigo-900/50 dark:to-indigo-800/30 dark:text-indigo-200'
                : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
            )}
          >
            <Icon className={clsx(
              'h-5 w-5 flex-shrink-0 transition-colors duration-200',
              active
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400'
            )} />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1 pl-4">
              {item.children?.map((child) => (
                <NavLink key={child.name} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.href}
        className={clsx(
          'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          depth > 0 && 'ml-6',
          active
            ? 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 dark:from-indigo-900/50 dark:to-indigo-800/30 dark:text-indigo-200'
            : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
        )}
      >
        <Icon className={clsx(
          'h-5 w-5 flex-shrink-0 transition-colors duration-200',
          active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400'
        )} />
        <span>{item.name}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation
          .filter(item => !item.role || item.role === user?.rolle || user?.rolle === 'admin')
          .map((item) => (
            <NavLink key={item.name} item={item} />
          ))}

        {(user?.rolle === 'admin' || user?.rolle === 'supervisor' || user?.rolle === 'system_admin') && (
          <>
            <div className="my-4">
              <div className="mx-3 h-px bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="px-3 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Administration
              </p>
            </div>
            {adminNavigation
              .filter(item => {
                if (user?.rolle === 'system_admin') return true;
                if (user?.rolle === 'admin') {
                  return !item.roles || item.roles.includes('admin');
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

      {/* User section */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center gap-x-3 mb-3">
          <Avatar
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=6366f1&color=fff`}
            className="h-10 w-10 ring-2 ring-white dark:ring-zinc-800"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
              {user?.name || 'Loading...'}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user?.mandant?.name}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-zinc-400" />
          <span>Abmelden</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="relative isolate flex min-h-screen w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl ring-1 ring-zinc-950/5 max-lg:hidden dark:bg-zinc-900 dark:ring-white/10">
        {/* Logo */}
        <div className="flex h-16 items-center gap-x-3 border-b border-zinc-200 px-6 dark:border-zinc-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
            <BuildingOfficeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">AMS</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Anlagen-Management</p>
          </div>
        </div>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
        <SidebarContent />
      </MobileSidebar>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center gap-x-3 border-b border-zinc-200 bg-white px-4 py-2.5 lg:hidden dark:border-zinc-700 dark:bg-zinc-900">
        <button
          onClick={() => setShowSidebar(true)}
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-800"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
            <BuildingOfficeIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">AMS</p>
        </div>
        <Dropdown>
          <DropdownButton className="inline-flex items-center">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=6366f1&color=fff`}
              className="h-8 w-8"
            />
          </DropdownButton>
          <DropdownMenu anchor="bottom end" className="min-w-56">
            <DropdownItem onClick={() => navigate('/settings')}>
              <Cog6ToothIcon className="h-4 w-4" />
              Einstellungen
            </DropdownItem>
            <DropdownItem onClick={logout}>
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Abmelden
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col lg:pl-64">
        <div className="flex-1 p-4 lg:p-6">
          <div className="mx-auto h-full max-w-screen-2xl">
            <div className="h-full rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 lg:p-8 dark:bg-zinc-900 dark:ring-white/10">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernLayout;