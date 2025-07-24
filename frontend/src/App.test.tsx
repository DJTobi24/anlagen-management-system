import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
  Routes: ({ children }: any) => <div>{children}</div>,
  Route: () => <div>Route</div>,
  Navigate: () => <div>Navigate</div>,
  useAuth: () => ({ user: null, loading: false }),
}));

// Mock react-query
jest.mock('react-query', () => ({
  QueryClient: class MockQueryClient {
    // Empty class for testing
  },
  QueryClientProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div>Toaster</div>,
}));

// Mock AuthContext
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({ user: null, loading: false }),
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    // When no user is authenticated, the app should show the login form
    expect(screen.getByText('Anlagen-Management-System')).toBeInTheDocument();
  });
  
  test('renders login form when user is not authenticated', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });
});