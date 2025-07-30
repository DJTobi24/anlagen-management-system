import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Camera, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { pendingSyncCount } = useSync();

  const navigation = [
    { name: 'Aufnahmen', href: '/aufnahmen', icon: Home },
    { name: 'Sync', href: '/sync', icon: RefreshCw, badge: pendingSyncCount },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-top">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AMS Datenaufnahme</h1>
              {user && (
                <p className="text-xs text-gray-500">{user.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700 touch-active"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 safe-bottom">
        <div className="grid grid-cols-2 h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  relative flex flex-col items-center justify-center
                  touch-active transition-colors duration-200
                  ${active
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}