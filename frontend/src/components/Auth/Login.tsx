import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BuildingOfficeIcon, ShieldCheckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorMethods, setTwoFactorMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'webauthn'>('totp');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password, showTwoFactor ? totpCode : undefined);
      
      // Check if 2FA is required
      if (result?.requiresMfa || result?.requiresTwoFactor) {
        setShowTwoFactor(true);
        setTwoFactorMethods(result.mfaMethods || result.methods || ['totp']);
        setLoading(false);
        return;
      }
      
      // Login successful
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.code === 'MFA_REQUIRED') {
        setShowTwoFactor(true);
        setTwoFactorMethods(err.response.data.methods || ['totp']);
      } else {
        setError(err.response?.data?.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWebAuthn = async () => {
    setError('');
    setLoading(true);
    
    try {
      // TODO: Implement WebAuthn authentication
      console.log('WebAuthn authentication not yet implemented');
      setError('WebAuthn wird in Kürze verfügbar sein');
    } catch (err: any) {
      setError('WebAuthn-Authentifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    {
      name: 'Stadtwerke München',
      email: 'admin@swm.de',
      password: 'Admin123!',
      color: 'bg-blue-600',
    },
    {
      name: 'Immobilien Berlin',
      email: 'admin@ibg.de',
      password: 'Admin123!',
      color: 'bg-green-600',
    },
    {
      name: 'Klinikum Frankfurt',
      email: 'admin@klf.de',
      password: 'Admin123!',
      color: 'bg-purple-600',
    },
  ];

  const handleDemoLogin = (user: typeof demoUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Login form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <BuildingOfficeIcon className="h-8 w-8" />
              </div>
              <h2 className="ml-3 text-3xl font-bold tracking-tight text-gray-900">
                AMS Login
              </h2>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Anlagen-Management-System
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {!showTwoFactor ? (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        E-Mail-Adresse
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Passwort
                      </label>
                      <div className="mt-1">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <ShieldCheckIcon className="mx-auto h-12 w-12 text-indigo-600" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Zwei-Faktor-Authentifizierung</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Bitte geben Sie Ihren Authentifizierungscode ein
                      </p>
                    </div>

                    {twoFactorMethods.length > 1 && (
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('totp')}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            selectedMethod === 'totp'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <DevicePhoneMobileIcon className="h-5 w-5 mr-1" />
                          Authenticator App
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('webauthn')}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            selectedMethod === 'webauthn'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <ShieldCheckIcon className="h-5 w-5 mr-1" />
                          Security Key
                        </button>
                      </div>
                    )}

                    {selectedMethod === 'totp' ? (
                      <div>
                        <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700">
                          6-stelliger Code aus Ihrer Authenticator App
                        </label>
                        <div className="mt-1">
                          <input
                            id="totpCode"
                            name="totpCode"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            autoComplete="one-time-code"
                            required
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                            placeholder="000000"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleWebAuthn}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <ShieldCheckIcon className="h-5 w-5 mr-2" />
                          Mit Security Key authentifizieren
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTwoFactor(false);
                          setTotpCode('');
                          setError('');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Zurück zur Anmeldung
                      </button>
                      <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                        Code verloren?
                      </a>
                    </div>
                  </>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading || (showTwoFactor && selectedMethod === 'totp' && totpCode.length !== 6)}
                    className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {showTwoFactor ? 'Verifiziere...' : 'Anmeldung läuft...'}
                      </>
                    ) : (
                      showTwoFactor ? 'Verifizieren' : 'Anmelden'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-50 px-2 text-gray-500">Demo-Benutzer</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  {demoUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => handleDemoLogin(user)}
                      className="group relative flex items-center rounded-lg border border-gray-300 bg-white px-4 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${user.color} text-white`}>
                        <BuildingOfficeIcon className="h-6 w-6" />
                      </div>
                      <div className="ml-3 text-left">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image/Pattern */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BuildingOfficeIcon className="mx-auto h-24 w-24 text-white opacity-50" />
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
                Anlagen-Management-System
              </h1>
              <p className="mt-3 text-lg text-white opacity-80">
                Verwalten Sie Ihre Anlagen effizient und übersichtlich
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;