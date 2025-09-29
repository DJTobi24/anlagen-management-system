import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '../ui/sidebar';
import { SidebarLayout } from '../ui/sidebar-layout';
import { Avatar } from '../ui/avatar';
import {
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  CameraIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  FolderIcon,
  HomeIcon,
  PlusIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  CubeIcon,
  UsersIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../ui/dropdown';

const PerfectLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    return location.pathname === href ||
           (href !== '/' && location.pathname.startsWith(href));
  };

  return (
    <SidebarLayout
      navbar={
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
            <BuildingOfficeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">AMS</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Anlagen-Management</p>
          </div>
        </div>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
                <BuildingOfficeIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">AMS</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Anlagen-Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={isActive('/')}>
                <HomeIcon data-slot="icon" />
                <SidebarLabel>Dashboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/anlagen" current={isActive('/anlagen')}>
                <BuildingOfficeIcon data-slot="icon" />
                <SidebarLabel>Anlagen</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/liegenschaften" current={isActive('/liegenschaften')}>
                <BuildingOffice2Icon data-slot="icon" />
                <SidebarLabel>Liegenschaften</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/objekte" current={isActive('/objekte')}>
                <CubeIcon data-slot="icon" />
                <SidebarLabel>Objekte</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSection>
              <SidebarHeading>Datenerfassung</SidebarHeading>
              <SidebarItem href="/fm-data-collection" current={isActive('/fm-data-collection')}>
                <FolderIcon data-slot="icon" />
                <SidebarLabel>FM-Datenaufnahme</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/datenaufnahme" current={isActive('/datenaufnahme')}>
                <SparklesIcon data-slot="icon" />
                <SidebarLabel>Datenaufnahme</SidebarLabel>
              </SidebarItem>
              {user?.rolle === 'mitarbeiter' && (
                <SidebarItem href="/meine-datenaufnahmen" current={isActive('/meine-datenaufnahmen')}>
                  <CameraIcon data-slot="icon" />
                  <SidebarLabel>Meine Aufnahmen</SidebarLabel>
                </SidebarItem>
              )}
            </SidebarSection>

            <SidebarSection>
              <SidebarHeading>Import & Export</SidebarHeading>
              <SidebarItem href="/import" current={isActive('/import')}>
                <DocumentArrowUpIcon data-slot="icon" />
                <SidebarLabel>Import</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/reports" current={isActive('/reports')}>
                <ChartBarIcon data-slot="icon" />
                <SidebarLabel>Reports</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            {(user?.rolle === 'admin' || user?.rolle === 'supervisor' || user?.rolle === 'system_admin') && (
              <>
                <SidebarSpacer />
                <SidebarSection>
                  <SidebarHeading>Administration</SidebarHeading>

                  {(user?.rolle === 'admin' || user?.rolle === 'supervisor') && (
                    <Dropdown>
                      <DropdownButton as={SidebarItem} current={isActive('/aks') || isActive('/aks-fields')}>
                        <QrCodeIcon data-slot="icon" />
                        <SidebarLabel>AKS-Verwaltung</SidebarLabel>
                        <ChevronDownIcon data-slot="icon" />
                      </DropdownButton>
                      <DropdownMenu anchor="top start" className="min-w-48">
                        <DropdownItem onClick={() => navigate('/aks')}>
                          <QrCodeIcon data-slot="icon" className="h-4 w-4" />
                          AKS-Codes
                        </DropdownItem>
                        <DropdownItem onClick={() => navigate('/aks-fields')}>
                          <FolderIcon data-slot="icon" className="h-4 w-4" />
                          AKS-Felder
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}

                  {(user?.rolle === 'admin' || user?.rolle === 'system_admin') && (
                    <SidebarItem href="/users" current={isActive('/users')}>
                      <UsersIcon data-slot="icon" />
                      <SidebarLabel>Benutzerverwaltung</SidebarLabel>
                    </SidebarItem>
                  )}

                  <SidebarItem href="/settings" current={isActive('/settings')}>
                    <Cog6ToothIcon data-slot="icon" />
                    <SidebarLabel>Einstellungen</SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
              </>
            )}
          </SidebarBody>

          <SidebarFooter>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=6366f1&color=fff`}
                  className="size-6"
                  data-slot="avatar"
                />
                <SidebarLabel>{user?.name || 'Loading...'}</SidebarLabel>
                <ChevronDownIcon data-slot="icon" />
              </DropdownButton>
              <DropdownMenu anchor="top start" className="min-w-56">
                <DropdownItem onClick={() => navigate('/settings')}>
                  <Cog6ToothIcon data-slot="icon" className="h-4 w-4" />
                  Einstellungen
                </DropdownItem>
                <DropdownItem onClick={() => window.open('https://github.com/anthropics/claude-code/issues', '_blank')}>
                  <QuestionMarkCircleIcon data-slot="icon" className="h-4 w-4" />
                  Support
                </DropdownItem>
                <DropdownItem onClick={logout}>
                  <ArrowRightOnRectangleIcon data-slot="icon" className="h-4 w-4" />
                  Abmelden
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
};

export default PerfectLayout;