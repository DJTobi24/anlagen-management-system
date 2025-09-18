import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Key, Users, Building } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  mandant_id: string;
  mandant_name?: string;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at: string;
}

interface Mandant {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  user_count: number;
  admin_count: number;
  created_at: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  techniker_count: number;
  aufnehmer_count: number;
  mfa_enabled_count: number;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'mandanten'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMandant, setSelectedMandant] = useState<Mandant | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSystemAdmin = currentUser?.rolle === 'system_admin';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const [usersRes, statsRes] = await Promise.all([
          api.get('/management/users'),
          api.get('/management/statistics')
        ]);
        setUsers(usersRes.data.data);
        setStats(statsRes.data.data);
      } else {
        const mandantenRes = await api.get('/management/mandanten');
        setMandanten(mandantenRes.data.data);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Laden der Daten';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (formData: any) => {
    try {
      await api.post('/management/users', formData);
      setSuccess('Benutzer erfolgreich erstellt');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Erstellen des Benutzers';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Erstellen des Benutzers');
    }
  };

  const handleUpdateUser = async (userId: string, formData: any) => {
    try {
      await api.put(`/management/users/${userId}`, formData);
      setSuccess('Benutzer erfolgreich aktualisiert');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Aktualisieren des Benutzers';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Aktualisieren des Benutzers');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) return;
    
    try {
      await api.delete(`/management/users/${userId}`);
      setSuccess('Benutzer erfolgreich gelöscht');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Löschen des Benutzers';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Löschen des Benutzers');
    }
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    try {
      await api.post(`/management/users/${userId}/change-password`, { newPassword });
      setSuccess('Passwort erfolgreich geändert');
      setShowPasswordModal(false);
    } catch (err: any) {
      console.error('Error changing password:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Ändern des Passworts';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Ändern des Passworts');
    }
  };

  const handleCreateMandant = async (formData: any) => {
    try {
      await api.post('/management/mandanten', formData);
      setSuccess('Mandant erfolgreich erstellt');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error creating mandant:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Erstellen des Mandanten';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Erstellen des Mandanten');
    }
  };

  const handleUpdateMandant = async (mandantId: string, formData: any) => {
    try {
      await api.put(`/management/mandanten/${mandantId}`, formData);
      setSuccess('Mandant erfolgreich aktualisiert');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error updating mandant:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Aktualisieren des Mandanten';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Aktualisieren des Mandanten');
    }
  };

  const handleDeleteMandant = async (mandantId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Mandanten löschen möchten? Dies ist nur möglich, wenn keine Benutzer zugeordnet sind.')) return;
    
    try {
      await api.delete(`/management/mandanten/${mandantId}`);
      setSuccess('Mandant erfolgreich gelöscht');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting mandant:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Fehler beim Löschen des Mandanten';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Fehler beim Löschen des Mandanten');
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Benutzerverwaltung</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <div className="text-gray-600">Gesamt Benutzer</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.active_users}</div>
            <div className="text-gray-600">Aktive Benutzer</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.admin_count}</div>
            <div className="text-gray-600">Administratoren</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{stats.mfa_enabled_count}</div>
            <div className="text-gray-600">Mit 2FA</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Benutzer
            </button>
            {isSystemAdmin && (
              <button
                onClick={() => setActiveTab('mandanten')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'mandanten'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building className="inline-block w-4 h-4 mr-2" />
                Mandanten
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {activeTab === 'users' ? 'Benutzer' : 'Mandanten'}
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'users' ? 'Neuer Benutzer' : 'Neuer Mandant'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Lade...</div>
          ) : activeTab === 'users' ? (
            <UserTable 
              users={users}
              isSystemAdmin={isSystemAdmin}
              onEdit={(user) => {
                setSelectedUser(user);
                setShowEditModal(true);
              }}
              onDelete={handleDeleteUser}
              onChangePassword={(user) => {
                setSelectedUser(user);
                setShowPasswordModal(true);
              }}
            />
          ) : (
            <MandantTable
              mandanten={mandanten}
              onEdit={(mandant) => {
                setSelectedMandant(mandant);
                setShowEditModal(true);
              }}
              onDelete={handleDeleteMandant}
            />
          )}
        </div>
      </div>

      {showCreateModal && activeTab === 'users' && (
        <CreateUserModal
          mandanten={mandanten}
          isSystemAdmin={isSystemAdmin}
          currentMandantId={currentUser?.mandant_id}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {showCreateModal && activeTab === 'mandanten' && (
        <CreateMandantModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateMandant}
        />
      )}

      {showEditModal && selectedUser && activeTab === 'users' && (
        <EditUserModal
          user={selectedUser}
          mandanten={mandanten}
          isSystemAdmin={isSystemAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(formData) => handleUpdateUser(selectedUser.id, formData)}
        />
      )}

      {showEditModal && selectedMandant && activeTab === 'mandanten' && (
        <EditMandantModal
          mandant={selectedMandant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMandant(null);
          }}
          onSubmit={(formData) => handleUpdateMandant(selectedMandant.id, formData)}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(password) => handleChangePassword(selectedUser.id, password)}
        />
      )}
    </div>
  );
};

// Table Components
const UserTable: React.FC<{
  users: User[];
  isSystemAdmin: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onChangePassword: (user: User) => void;
}> = ({ users, isSystemAdmin, onEdit, onDelete, onChangePassword }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            E-Mail
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Rolle
          </th>
          {isSystemAdmin && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mandant
            </th>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            2FA
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Aktionen
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <tr key={user.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              {user.first_name} {user.last_name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'techniker' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user.role}
              </span>
            </td>
            {isSystemAdmin && (
              <td className="px-6 py-4 whitespace-nowrap">{user.mandant_name}</td>
            )}
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {user.mfa_enabled ? '✓' : '✗'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                onClick={() => onEdit(user)}
                className="text-indigo-600 hover:text-indigo-900 mr-2"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangePassword(user)}
                className="text-yellow-600 hover:text-yellow-900 mr-2"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MandantTable: React.FC<{
  mandanten: Mandant[];
  onEdit: (mandant: Mandant) => void;
  onDelete: (mandantId: string) => void;
}> = ({ mandanten, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Beschreibung
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Benutzer
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Admins
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Aktionen
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {mandanten.map((mandant) => (
          <tr key={mandant.id}>
            <td className="px-6 py-4 whitespace-nowrap font-medium">{mandant.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{mandant.description || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{mandant.user_count}</td>
            <td className="px-6 py-4 whitespace-nowrap">{mandant.admin_count}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                mandant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {mandant.is_active ? 'Aktiv' : 'Inaktiv'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                onClick={() => onEdit(mandant)}
                className="text-indigo-600 hover:text-indigo-900 mr-2"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(mandant.id)}
                className="text-red-600 hover:text-red-900"
                disabled={mandant.user_count > 0}
                title={mandant.user_count > 0 ? 'Mandant hat noch Benutzer' : ''}
              >
                <Trash2 className={`w-4 h-4 ${mandant.user_count > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Modal Components
const CreateUserModal: React.FC<{
  mandanten: Mandant[];
  isSystemAdmin: boolean;
  currentMandantId?: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}> = ({ mandanten, isSystemAdmin, currentMandantId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'aufnehmer',
    mandantId: currentMandantId || '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Neuer Benutzer</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vorname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nachname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rolle</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="techniker">Techniker</option>
                <option value="aufnehmer">Aufnehmer</option>
              </select>
            </div>
            {isSystemAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mandant</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.mandantId}
                  onChange={(e) => setFormData({ ...formData, mandantId: e.target.value })}
                  required
                >
                  <option value="">Wählen Sie einen Mandanten</option>
                  {mandanten.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal: React.FC<{
  user: User;
  mandanten: Mandant[];
  isSystemAdmin: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}> = ({ user, mandanten, isSystemAdmin, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isActive: user.is_active,
    mandantId: user.mandant_id
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Benutzer bearbeiten</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vorname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nachname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rolle</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="techniker">Techniker</option>
                <option value="aufnehmer">Aufnehmer</option>
              </select>
            </div>
            {isSystemAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mandant</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={formData.mandantId}
                  onChange={(e) => setFormData({ ...formData, mandantId: e.target.value })}
                >
                  {mandanten.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Aktiv
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateMandantModal: React.FC<{
  onClose: () => void;
  onSubmit: (formData: any) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Neuer Mandant</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Mandant Informationen</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <h4 className="font-medium text-gray-900 mt-6">Administrator Account</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin E-Mail</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Passwort</label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Vorname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Nachname</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditMandantModal: React.FC<{
  mandant: Mandant;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}> = ({ mandant, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: mandant.name,
    description: mandant.description || '',
    isActive: mandant.is_active
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Mandant bearbeiten</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Aktiv
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{
  user: User;
  onClose: () => void;
  onSubmit: (password: string) => void;
}> = ({ user, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Passwort ändern für {user.first_name} {user.last_name}</h3>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Neues Passwort</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Ändern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;