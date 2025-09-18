import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  UserIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mandantId: string;
  mfaEnabled: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'de' | 'en';
  highContrast: boolean;
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  tableRowsPerPage: number;
}

interface MandantSettings {
  mandantId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  customSettings: Record<string, any>;
  isActive?: boolean;
  userCount?: number;
}

const Settings: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'mandant' | 'all-mandanten'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpCode, setTotpCode] = useState('');

  // User Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // User Preferences State
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Mandant Settings State
  const [mandantSettings, setMandantSettings] = useState<MandantSettings | null>(null);
  const [allMandantenSettings, setAllMandantenSettings] = useState<MandantSettings[]>([]);
  const [selectedMandantId, setSelectedMandantId] = useState<string>('');

  const isSystemAdmin = currentUser?.rolle === 'system_admin';
  const isAdmin = currentUser?.rolle === 'admin';

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMandantId, currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'profile') {
        const profileRes = await api.get('/settings/profile');
        if (profileRes.data && profileRes.data.data) {
          setProfile(profileRes.data.data);
          setProfileForm({
            firstName: profileRes.data.data.firstName || '',
            lastName: profileRes.data.data.lastName || '',
            email: profileRes.data.data.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } else if (activeTab === 'preferences') {
        const prefsRes = await api.get('/settings/preferences');
        if (prefsRes.data && prefsRes.data.data) {
          setPreferences(prefsRes.data.data);
          // Apply theme immediately when preferences are loaded
          applyTheme(prefsRes.data.data.theme);
        }
      } else if (activeTab === 'mandant') {
        // Debug logging
        console.log('Loading mandant settings...');
        console.log('currentUser:', currentUser);
        console.log('selectedMandantId:', selectedMandantId);
        console.log('currentUser?.mandant_id:', currentUser?.mandant_id);
        
        const mandantId = selectedMandantId || currentUser?.mandant_id;
        
        // Ensure we have a valid mandantId
        if (!mandantId || mandantId === 'undefined' || mandantId === '') {
          console.log('No valid mandantId found, using default endpoint');
          const settingsRes = await api.get('/settings/mandant');
          if (settingsRes.data && settingsRes.data.data) {
            setMandantSettings(settingsRes.data.data);
          }
        } else {
          console.log('Using mandantId:', mandantId);
          const settingsRes = await api.get(`/settings/mandant/${mandantId}`);
          if (settingsRes.data && settingsRes.data.data) {
            setMandantSettings(settingsRes.data.data);
          }
        }
      } else if (activeTab === 'all-mandanten' && isSystemAdmin) {
        const allSettingsRes = await api.get('/settings/mandanten');
        if (allSettingsRes.data && allSettingsRes.data.data) {
          setAllMandantenSettings(allSettingsRes.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error loading settings data:', error);
      if (error.response?.status === 404) {
        toast.error('Settings-Endpunkt nicht gefunden. Bitte Backend prüfen.');
      } else if (error.response?.status === 400) {
        toast.error('Ungültige Anfrage. Bitte Seite neu laden.');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Fehler beim Laden der Daten');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email
      };

      if (profileForm.newPassword) {
        updates.currentPassword = profileForm.currentPassword;
        updates.newPassword = profileForm.newPassword;
      }

      await api.put('/settings/profile', updates);
      toast.success('Profil erfolgreich aktualisiert');
      
      // Refresh user data if email changed
      if (profileForm.email !== profile?.email) {
        await refreshUser();
      }

      // Clear password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await api.put('/settings/preferences', preferences);
      toast.success('Einstellungen erfolgreich gespeichert');
      
      // Apply theme immediately
      applyTheme(preferences.theme);
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMandantSettings = async () => {
    if (!mandantSettings) return;

    setSaving(true);
    try {
      const mandantId = selectedMandantId || currentUser?.mandant_id;
      const url = mandantId ? `/settings/mandant/${mandantId}` : '/settings/mandant';
      await api.put(url, {
        name: mandantSettings.name,
        primaryColor: mandantSettings.primaryColor,
        secondaryColor: mandantSettings.secondaryColor,
        customSettings: mandantSettings.customSettings
      });
      toast.success('Mandanten-Einstellungen erfolgreich gespeichert');
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const mandantId = selectedMandantId || currentUser?.mandant_id;
      const url = mandantId ? `/settings/mandant/${mandantId}/logo` : '/settings/mandant/logo';
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMandantSettings(response.data.data);
      toast.success('Logo erfolgreich hochgeladen');
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Fehler beim Hochladen');
      }
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.post('/mfa/enable');
      setQrCode(response.data.data.qrCode);
      setTotpSecret(response.data.data.secret);
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Fehler beim Aktivieren von 2FA');
      }
    }
  };

  const handleConfirm2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Bitte geben Sie einen 6-stelligen Code ein');
      return;
    }

    try {
      await api.post('/mfa/confirm', { code: totpCode });
      toast.success('2FA erfolgreich aktiviert');
      setShow2FAModal(false);
      setQrCode('');
      setTotpSecret('');
      setTotpCode('');
      // Reload profile to update mfaEnabled status
      await loadData();
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Ungültiger Code');
      }
    }
  };

  const handleDisable2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      toast.error('Bitte geben Sie einen 6-stelligen Code ein');
      return;
    }

    try {
      await api.post('/mfa/disable', { code: totpCode });
      toast.success('2FA erfolgreich deaktiviert');
      setShow2FAModal(false);
      setTotpCode('');
      // Reload profile to update mfaEnabled status
      await loadData();
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Ungültiger Code');
      }
    }
  };

  const tabs = [
    { id: 'profile', name: 'Mein Profil', icon: UserIcon },
    { id: 'preferences', name: 'Einstellungen', icon: PaintBrushIcon },
    ...(isAdmin || isSystemAdmin ? [{ id: 'mandant', name: 'Mandant', icon: BuildingOfficeIcon }] : []),
    ...(isSystemAdmin ? [{ id: 'all-mandanten', name: 'Alle Mandanten', icon: ShieldCheckIcon }] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {!currentUser ? (
            <div className="text-center py-8">Lade Benutzerdaten...</div>
          ) : loading ? (
            <div className="text-center py-8">Lade...</div>
          ) : (
            <>
              {activeTab === 'profile' && profile ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Persönliche Informationen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vorname</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nachname</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                        <input
                          type="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Passwort ändern</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Aktuelles Passwort</label>
                        <input
                          type="password"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                        <input
                          type="password"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
                        <input
                          type="password"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Zwei-Faktor-Authentifizierung</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <KeyIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium">2FA Status</p>
                          <p className="text-sm text-gray-500">
                            {profile.mfaEnabled ? 'Aktiviert' : 'Deaktiviert'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShow2FAModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Verwalten
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === 'preferences' && preferences ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Erscheinungsbild</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'light', label: 'Hell', icon: SunIcon },
                            { value: 'dark', label: 'Dunkel', icon: MoonIcon },
                            { value: 'auto', label: 'System', icon: ComputerDesktopIcon }
                          ].map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.value}
                                onClick={() => setPreferences({ ...preferences, theme: option.value as any })}
                                className={`p-4 rounded-lg border-2 transition-colors ${
                                  preferences.theme === option.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <Icon className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">{option.label}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Hoher Kontrast</p>
                          <p className="text-sm text-gray-500">Verbessert die Lesbarkeit</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.highContrast}
                            onChange={(e) => setPreferences({ ...preferences, highContrast: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Benachrichtigungen</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">E-Mail-Benachrichtigungen</p>
                          <p className="text-sm text-gray-500">Wichtige Updates per E-Mail erhalten</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notifications.email}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notifications: { ...preferences.notifications, email: e.target.checked }
                            })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">In-App-Benachrichtigungen</p>
                          <p className="text-sm text-gray-500">Benachrichtigungen im System anzeigen</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={preferences.notifications.inApp}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notifications: { ...preferences.notifications, inApp: e.target.checked }
                            })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Tabellen-Einstellungen</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zeilen pro Seite</label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={preferences.tableRowsPerPage}
                        onChange={(e) => setPreferences({ ...preferences, tableRowsPerPage: parseInt(e.target.value) })}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === 'mandant' && mandantSettings && (isAdmin || isSystemAdmin) ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Mandanten-Informationen</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          value={mandantSettings.name}
                          onChange={(e) => setMandantSettings({ ...mandantSettings, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                        <div className="flex items-center space-x-4">
                          {mandantSettings.logo ? (
                            <img
                              src={mandantSettings.logo}
                              alt="Mandanten Logo"
                              className="h-16 w-16 object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-lg">
                              <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 inline-block">
                              Logo hochladen
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Farben</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Primärfarbe</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                className="h-10 w-20"
                                value={mandantSettings.primaryColor}
                                onChange={(e) => setMandantSettings({ ...mandantSettings, primaryColor: e.target.value })}
                              />
                              <input
                                type="text"
                                className="flex-1 rounded-md border-gray-300 shadow-sm text-sm"
                                value={mandantSettings.primaryColor}
                                onChange={(e) => setMandantSettings({ ...mandantSettings, primaryColor: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Sekundärfarbe</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                className="h-10 w-20"
                                value={mandantSettings.secondaryColor}
                                onChange={(e) => setMandantSettings({ ...mandantSettings, secondaryColor: e.target.value })}
                              />
                              <input
                                type="text"
                                className="flex-1 rounded-md border-gray-300 shadow-sm text-sm"
                                value={mandantSettings.secondaryColor}
                                onChange={(e) => setMandantSettings({ ...mandantSettings, secondaryColor: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveMandantSettings}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === 'all-mandanten' && isSystemAdmin ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Alle Mandanten verwalten</h3>
                  <div className="space-y-4">
                    {allMandantenSettings.map((mandant) => (
                      <div
                        key={mandant.mandantId}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {mandant.logo ? (
                              <img
                                src={mandant.logo}
                                alt={mandant.name}
                                className="h-12 w-12 object-contain rounded"
                              />
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded">
                                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium">{mandant.name}</h4>
                              <p className="text-sm text-gray-500">
                                {mandant.userCount} Benutzer • {mandant.isActive ? 'Aktiv' : 'Inaktiv'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMandantId(mandant.mandantId);
                              setActiveTab('mandant');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Bearbeiten
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Zwei-Faktor-Authentifizierung {profile?.mfaEnabled ? 'deaktivieren' : 'aktivieren'}
            </h2>
            
            {!profile?.mfaEnabled ? (
              // Enable 2FA flow
              <>
                {!qrCode ? (
                  <div>
                    <p className="mb-4">
                      Die Zwei-Faktor-Authentifizierung erhöht die Sicherheit Ihres Kontos erheblich.
                    </p>
                    <button
                      onClick={handleEnable2FA}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                      2FA aktivieren
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">
                      Scannen Sie diesen QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator):
                    </p>
                    <div className="flex justify-center mb-4">
                      <img src={qrCode} alt="2FA QR Code" className="border p-2" />
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Oder geben Sie diesen Code manuell ein:
                      </p>
                      <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                        {totpSecret}
                      </code>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Bestätigungscode eingeben:
                      </label>
                      <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                    <button
                      onClick={handleConfirm2FA}
                      disabled={totpCode.length !== 6}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      2FA bestätigen
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Disable 2FA flow
              <div>
                <p className="mb-4">
                  Geben Sie Ihren aktuellen 2FA-Code ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren:
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleDisable2FA}
                  disabled={totpCode.length !== 6}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  2FA deaktivieren
                </button>
              </div>
            )}
            
            <button
              onClick={() => {
                setShow2FAModal(false);
                setQrCode('');
                setTotpSecret('');
                setTotpCode('');
              }}
              className="w-full mt-4 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;