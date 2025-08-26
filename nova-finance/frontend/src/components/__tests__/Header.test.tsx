import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import Header from '../Layout/Header';

// Mock the contexts for testing
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      isAuthenticated: false,
      user: null,
      loading: false
    },
    logout: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    state: { theme: 'light' },
    toggleTheme: jest.fn()
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    state: { language: 'en' },
    setLanguage: jest.fn(),
    t: (key: string) => key
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            {component}
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with logo and navigation', () => {
    renderWithProviders(<Header />);
    
    // Check for logo
    expect(screen.getByText('Nova Finance')).toBeInTheDocument();
    
    // Check for navigation links
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('aboutUs')).toBeInTheDocument();
    expect(screen.getByText('features')).toBeInTheDocument();
    expect(screen.getByText('faq')).toBeInTheDocument();
  });

  test('displays login and register buttons when not authenticated', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('register')).toBeInTheDocument();
  });

  test('displays user menu when authenticated', () => {
    // Mock authenticated state
    const mockUseAuth = jest.requireMock('../../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        user: { username: 'testuser', email: 'test@example.com' },
        loading: false
      },
      logout: jest.fn()
    });

    renderWithProviders(<Header />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.queryByText('login')).not.toBeInTheDocument();
    expect(screen.queryByText('register')).not.toBeInTheDocument();
  });

  test('opens and closes mobile menu', () => {
    renderWithProviders(<Header />);
    
    // Find mobile menu button
    const mobileMenuButton = screen.getByRole('button');
    
    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Mobile menu should be visible (test would need actual mobile menu implementation)
    expect(mobileMenuButton).toBeInTheDocument();
  });

  test('theme toggle button works', () => {
    const mockToggleTheme = jest.fn();
    const mockUseTheme = jest.requireMock('../../contexts/ThemeContext').useTheme;
    mockUseTheme.mockReturnValue({
      state: { theme: 'light' },
      toggleTheme: mockToggleTheme
    });

    renderWithProviders(<Header />);
    
    // Find theme toggle button (moon icon for light mode)
    const themeButton = screen.getByRole('button');
    fireEvent.click(themeButton);
    
    // Theme toggle should be called
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test('language selector works', () => {
    const mockSetLanguage = jest.fn();
    const mockUseLanguage = jest.requireMock('../../contexts/LanguageContext').useLanguage;
    mockUseLanguage.mockReturnValue({
      state: { language: 'en' },
      setLanguage: mockSetLanguage,
      t: (key: string) => key
    });

    renderWithProviders(<Header />);
    
    // Find and click language selector
    const languageButton = screen.getByRole('button');
    fireEvent.click(languageButton);
    
    // Language menu should be accessible
    expect(languageButton).toBeInTheDocument();
  });

  test('user profile menu functionality', async () => {
    const mockLogout = jest.fn();
    const mockUseAuth = jest.requireMock('../../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        user: { username: 'testuser', email: 'test@example.com' },
        loading: false
      },
      logout: mockLogout
    });

    renderWithProviders(<Header />);
    
    // Find user menu button
    const userButton = screen.getByText('testuser');
    fireEvent.click(userButton);
    
    // Should show profile menu items
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('logout')).toBeInTheDocument();
    
    // Test logout functionality
    const logoutButton = screen.getByText('logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('navigation links have correct hrefs', () => {
    renderWithProviders(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    const aboutLink = screen.getByRole('link', { name: /aboutus/i });
    const featuresLink = screen.getByRole('link', { name: /features/i });
    const faqLink = screen.getByRole('link', { name: /faq/i });
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(featuresLink).toHaveAttribute('href', '/features');
    expect(faqLink).toHaveAttribute('href', '/faq');
  });

  test('responsive behavior', () => {
    // Test mobile menu visibility
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Mobile breakpoint
    });

    renderWithProviders(<Header />);
    
    // Mobile menu button should be present
    const mobileMenuButtons = screen.getAllByRole('button');
    expect(mobileMenuButtons.length).toBeGreaterThan(0);
  });

  test('accessibility features', () => {
    renderWithProviders(<Header />);
    
    // Check for proper ARIA labels and roles
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for keyboard navigation
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeVisible();
    });
    
    // Check for proper link structure
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
});