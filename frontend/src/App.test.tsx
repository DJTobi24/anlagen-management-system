import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';

// Mock AuthContext to avoid real authentication logic and network calls
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({ user: null, loading: false }),
}));

const renderApp = () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderApp();
    // When no user is authenticated, the app should show the login heading
    expect(
      screen.getByRole('heading', { name: 'Anlagen-Management-System' })
    ).toBeInTheDocument();
  });

  test('renders login form when user is not authenticated', () => {
    renderApp();
    expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });
});
