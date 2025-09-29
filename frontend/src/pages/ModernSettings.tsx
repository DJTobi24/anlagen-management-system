import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { Heading, Subheading } from '../components/ui/heading';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Field, Label, Description, Fieldset, Legend } from '../components/ui/fieldset';
import { Switch } from '../components/ui/switch';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import {
  UserIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  KeyIcon,
  BellIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '../components/ui/dialog';
import { Text } from '../components/ui/text';
import clsx from 'clsx';

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

const ModernSettings: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
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

  const tabs = [
    { id: 'profile', name: 'Profil', icon: UserIcon },
    { id: 'preferences', name: 'Präferenzen', icon: PaintBrushIcon },
    { id: 'mandant', name: 'Mandant', icon: BuildingOfficeIcon },
    ...(isSystemAdmin ? [{ id: 'all-mandanten', name: 'Alle Mandanten', icon: ShieldCheckIcon }] : [])
  ];

  useEffect(() => {
    if (currentUser) {
      loadData(0);
    }
  }, [currentUser]);

  const loadData = async (selectedIndex: number) => {
    setLoading(true);
    const activeTab = tabs[selectedIndex].id;

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
          // Use ThemeContext instead of local applyTheme
          setTheme(prefsRes.data.data.theme);
        }
      } else if (activeTab === 'mandant') {
        const mandantId = selectedMandantId || currentUser?.mandant_id;

        if (!mandantId || mandantId === 'undefined' || mandantId === '') {
          const settingsRes = await api.get('/settings/mandant');
          if (settingsRes.data && settingsRes.data.data) {
            setMandantSettings(settingsRes.data.data);
          }
        } else {
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
      toast.error(error.response?.data?.error || 'Fehler beim Laden der Daten');
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

      if (profileForm.email !== profile?.email) {
        await refreshUser();
      }

      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/settings/preferences', preferences);
      toast.success('Präferenzen erfolgreich gespeichert');
      if (preferences) {
        // Use ThemeContext instead of local applyTheme
        setTheme(preferences.theme);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMandantSettings = async () => {
    setSaving(true);
    try {
      const mandantId = selectedMandantId || currentUser?.mandant_id;
      await api.put(`/settings/mandant/${mandantId}`, mandantSettings);
      toast.success('Mandanten-Einstellungen erfolgreich gespeichert');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };


  const handle2FAEnable = async () => {
    try {
      const response = await api.post('/mfa/setup');
      setQrCode(response.data.data.qrCode);
      setTotpSecret(response.data.data.secret);
      setShow2FAModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Aktivieren von 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await api.post('/mfa/verify', { code: totpCode, secret: totpSecret });
      toast.success('2FA erfolgreich aktiviert');
      setShow2FAModal(false);
      if (profile) {
        setProfile({ ...profile, mfaEnabled: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ungültiger Code');
    }
  };

  const handle2FADisable = async () => {
    try {
      await api.post('/mfa/disable');
      toast.success('2FA erfolgreich deaktiviert');
      if (profile) {
        setProfile({ ...profile, mfaEnabled: false });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fehler beim Deaktivieren von 2FA');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Hell', icon: SunIcon },
    { value: 'dark', label: 'Dunkel', icon: MoonIcon },
    { value: 'auto', label: 'Automatisch', icon: ComputerDesktopIcon }
  ];

  return (
    <div className="max-w-4xl">
      <Heading>Einstellungen</Heading>
      <Text className="mt-2 text-zinc-600 dark:text-zinc-400">
        Verwalten Sie Ihre persönlichen Einstellungen und Präferenzen
      </Text>

      <TabGroup onChange={loadData} className="mt-8">
        <TabList className="flex gap-x-1 border-b border-zinc-200 dark:border-zinc-700">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                clsx(
                  'flex items-center gap-x-2 px-4 py-2 text-sm font-medium outline-none',
                  'border-b-2 -mb-px transition-colors',
                  selected
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </Tab>
          ))}
        </TabList>

        <TabPanels className="mt-6">
          {/* Profile Tab */}
          <TabPanel>
            {loading ? (
              <div className="text-center py-8">Lade...</div>
            ) : profile ? (
              <div className="space-y-8">
                <Fieldset>
                  <Legend>Persönliche Informationen</Legend>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field>
                      <Label>Vorname</Label>
                      <Input
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Nachname</Label>
                      <Input
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </Field>
                    <Field className="sm:col-span-2">
                      <Label>E-Mail</Label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </Field>
                  </div>
                </Fieldset>

                <Fieldset>
                  <Legend>Passwort ändern</Legend>
                  <Description>Lassen Sie die Felder leer, wenn Sie Ihr Passwort nicht ändern möchten</Description>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                    <Field className="sm:col-span-2">
                      <Label>Aktuelles Passwort</Label>
                      <Input
                        type="password"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Neues Passwort</Label>
                      <Input
                        type="password"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </Field>
                    <Field>
                      <Label>Passwort bestätigen</Label>
                      <Input
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      />
                    </Field>
                  </div>
                </Fieldset>

                <Fieldset>
                  <Legend>Zwei-Faktor-Authentifizierung</Legend>
                  <div className="mt-6 flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-x-3">
                      <KeyIcon className="h-8 w-8 text-zinc-400" />
                      <div>
                        <Text className="font-medium">2FA Status</Text>
                        <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                          {profile.mfaEnabled ? 'Aktiviert' : 'Deaktiviert'}
                        </Text>
                      </div>
                    </div>
                    <Badge color={profile.mfaEnabled ? 'green' : 'zinc'}>
                      {profile.mfaEnabled ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    {profile.mfaEnabled ? (
                      <Button color="red" onClick={handle2FADisable}>
                        2FA deaktivieren
                      </Button>
                    ) : (
                      <Button color="indigo" onClick={handle2FAEnable}>
                        2FA aktivieren
                      </Button>
                    )}
                  </div>
                </Fieldset>

                <div className="flex justify-end">
                  <Button color="indigo" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Speichert...' : 'Profil speichern'}
                  </Button>
                </div>
              </div>
            ) : null}
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel>
            {loading ? (
              <div className="text-center py-8">Lade...</div>
            ) : preferences ? (
              <div className="space-y-8">
                <Fieldset>
                  <Legend>Erscheinungsbild</Legend>
                  <div className="mt-6">
                    <Label>Theme</Label>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setPreferences({ ...preferences, theme: option.value as any });
                              setTheme(option.value as any);
                            }}
                            className={clsx(
                              'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                              theme === option.value
                                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950'
                                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                            )}
                          >
                            <Icon className="h-8 w-8 mb-2" />
                            <Text className="text-sm font-medium">{option.label}</Text>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Field className="mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Hoher Kontrast</Label>
                        <Description>Verbessert die Lesbarkeit</Description>
                      </div>
                      <Switch
                        checked={preferences.highContrast}
                        onChange={(checked) => setPreferences({ ...preferences, highContrast: checked })}
                      />
                    </div>
                  </Field>
                </Fieldset>

                <Fieldset>
                  <Legend>Benachrichtigungen</Legend>
                  <div className="space-y-6 mt-6">
                    <Field>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                          <BellIcon className="h-5 w-5 text-zinc-400" />
                          <div>
                            <Label>E-Mail-Benachrichtigungen</Label>
                            <Description>Wichtige Updates per E-Mail erhalten</Description>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifications.email}
                          onChange={(checked) => setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, email: checked }
                          })}
                        />
                      </div>
                    </Field>
                    <Field>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                          <BellIcon className="h-5 w-5 text-zinc-400" />
                          <div>
                            <Label>In-App-Benachrichtigungen</Label>
                            <Description>Benachrichtigungen im System anzeigen</Description>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.notifications.inApp}
                          onChange={(checked) => setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, inApp: checked }
                          })}
                        />
                      </div>
                    </Field>
                  </div>
                </Fieldset>

                <Fieldset>
                  <Legend>Tabellen-Einstellungen</Legend>
                  <Field className="mt-6">
                    <div className="flex items-center gap-x-3">
                      <TableCellsIcon className="h-5 w-5 text-zinc-400" />
                      <Label>Zeilen pro Seite</Label>
                    </div>
                    <Select
                      value={preferences.tableRowsPerPage.toString()}
                      onChange={(e) => setPreferences({ ...preferences, tableRowsPerPage: parseInt(e.target.value) })}
                      className="mt-2"
                    >
                      <option value="10">10 Zeilen</option>
                      <option value="25">25 Zeilen</option>
                      <option value="50">50 Zeilen</option>
                      <option value="100">100 Zeilen</option>
                    </Select>
                  </Field>
                </Fieldset>

                <div className="flex justify-end">
                  <Button color="indigo" onClick={handleSavePreferences} disabled={saving}>
                    {saving ? 'Speichert...' : 'Präferenzen speichern'}
                  </Button>
                </div>
              </div>
            ) : null}
          </TabPanel>

          {/* Mandant Tab */}
          <TabPanel>
            {loading ? (
              <div className="text-center py-8">Lade...</div>
            ) : mandantSettings ? (
              <div className="space-y-8">
                <Fieldset>
                  <Legend>Mandanten-Informationen</Legend>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                    <Field className="sm:col-span-2">
                      <Label>Mandanten-Name</Label>
                      <Input
                        value={mandantSettings.name}
                        onChange={(e) => setMandantSettings({ ...mandantSettings, name: e.target.value })}
                        disabled={!isAdmin && !isSystemAdmin}
                      />
                    </Field>
                    <Field>
                      <Label>Primärfarbe</Label>
                      <div className="flex items-center gap-x-3">
                        <Input
                          type="color"
                          value={mandantSettings.primaryColor}
                          onChange={(e) => setMandantSettings({ ...mandantSettings, primaryColor: e.target.value })}
                          disabled={!isAdmin && !isSystemAdmin}
                          className="h-10 w-20"
                        />
                        <Input
                          value={mandantSettings.primaryColor}
                          onChange={(e) => setMandantSettings({ ...mandantSettings, primaryColor: e.target.value })}
                          disabled={!isAdmin && !isSystemAdmin}
                          className="flex-1"
                        />
                      </div>
                    </Field>
                    <Field>
                      <Label>Sekundärfarbe</Label>
                      <div className="flex items-center gap-x-3">
                        <Input
                          type="color"
                          value={mandantSettings.secondaryColor}
                          onChange={(e) => setMandantSettings({ ...mandantSettings, secondaryColor: e.target.value })}
                          disabled={!isAdmin && !isSystemAdmin}
                          className="h-10 w-20"
                        />
                        <Input
                          value={mandantSettings.secondaryColor}
                          onChange={(e) => setMandantSettings({ ...mandantSettings, secondaryColor: e.target.value })}
                          disabled={!isAdmin && !isSystemAdmin}
                          className="flex-1"
                        />
                      </div>
                    </Field>
                  </div>
                </Fieldset>

                {(isAdmin || isSystemAdmin) && (
                  <div className="flex justify-end">
                    <Button color="indigo" onClick={handleSaveMandantSettings} disabled={saving}>
                      {saving ? 'Speichert...' : 'Mandanten-Einstellungen speichern'}
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </TabPanel>

          {/* All Mandanten Tab (System Admin only) */}
          {isSystemAdmin && (
            <TabPanel>
              {loading ? (
                <div className="text-center py-8">Lade...</div>
              ) : (
                <div className="space-y-6">
                  <Subheading>Alle Mandanten</Subheading>
                  <div className="grid gap-4">
                    {allMandantenSettings.map((mandant) => (
                      <div
                        key={mandant.mandantId}
                        className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      >
                        <div>
                          <Text className="font-medium">{mandant.name}</Text>
                          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                            ID: {mandant.mandantId} • {mandant.userCount || 0} Benutzer
                          </Text>
                        </div>
                        <div className="flex items-center gap-x-3">
                          <Badge color={mandant.isActive ? 'green' : 'zinc'}>
                            {mandant.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          <Button
                            plain
                            onClick={() => {
                              setSelectedMandantId(mandant.mandantId);
                              loadData(2); // Switch to mandant tab
                            }}
                          >
                            Bearbeiten
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabPanel>
          )}
        </TabPanels>
      </TabGroup>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FAModal} onClose={() => setShow2FAModal(false)}>
        <DialogTitle>Zwei-Faktor-Authentifizierung einrichten</DialogTitle>
        <DialogDescription>
          Scannen Sie den QR-Code mit Ihrer Authenticator-App
        </DialogDescription>
        <DialogBody>
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                Secret: {totpSecret}
              </Text>
              <Field className="w-full">
                <Label>Verifizierungscode</Label>
                <Input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </Field>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setShow2FAModal(false)}>
            Abbrechen
          </Button>
          <Button color="indigo" onClick={handleVerify2FA}>
            Verifizieren
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ModernSettings;