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
  QueryClient: class {
    constructor() {}
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
    expect(screen.getByText('Route')).toBeInTheDocument();
  });
});