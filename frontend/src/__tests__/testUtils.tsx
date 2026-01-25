/**
 * Test utilities and helpers for React component testing
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * All providers wrapper for full app context
 */
interface AllProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

const AllProviders: React.FC<AllProvidersProps> = ({ children, initialEntries = ['/'] }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

/**
 * Custom render function that wraps component in all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Simple render with just Router (for components that don't need auth)
 */
const renderWithRouter = (
  ui: ReactElement,
  { route = '/' } = {}
): RenderResult => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper });
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  kyc_status: 'approved' as const,
  is_admin: false,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockAdminUser = {
  ...mockUser,
  id: 'admin-user-123',
  email: 'admin@example.com',
  username: 'adminuser',
  is_admin: true,
};

/**
 * Mock API responses
 */
export const mockAuthResponse = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
  user: mockUser,
};

export const mockLoanApplication = {
  id: 'loan-app-123',
  amount_requested: '5000.00',
  duration_months: 12,
  currency: 'USD',
  purpose: 'business_expansion',
  status: 'submitted',
  created_at: '2025-01-15T10:00:00Z',
};

export const mockWalletBalance = {
  balance: '10000.00',
  pledged_balance: '2000.00',
  available_balance: '8000.00',
};

export const mockDocument = {
  id: 'doc-123',
  document_type: 'loan_certificate',
  title: 'Loan Certificate',
  created_at: '2025-01-15T10:00:00Z',
  signed: false,
};

/**
 * Helper to wait for loading states to resolve
 */
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create mock axios instance for testing
 */
export const createMockAxios = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render, renderWithRouter };
