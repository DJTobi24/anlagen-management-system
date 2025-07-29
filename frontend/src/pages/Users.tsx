import React from 'react';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Benutzerverwaltung
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Verwalten Sie Benutzer und deren Berechtigungen
          </p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500">
            Benutzerverwaltung wird in einer zukünftigen Version implementiert.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users;