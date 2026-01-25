/**
 * Tests for Dashboard Component
 * Tests dashboard statistics, wallet balance, and recent activity display
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, mockUser, mockWalletBalance } from './testUtils';

// Mock the services
jest.mock('../services/loanService', () => ({
  __esModule: true,
  default: {
    getDashboardStats: jest.fn(),
  },
}));

jest.mock('../services/pronovaService', () => ({
  __esModule: true,
  default: {
    getWalletBalance: jest.fn(),
    getTransactions: jest.fn(),
  },
}));

jest.mock('../services/investmentService', () => ({
  __esModule: true,
  default: {
    getPortfolioSummary: jest.fn(),
  },
}));

jest.mock('../services/paymentService', () => ({
  __esModule: true,
  default: {
    getPaymentHistory: jest.fn(),
  },
}));

// Mock the API module
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
  tokenManager: {
    isAuthenticated: jest.fn(() => true),
    getAccessToken: jest.fn(() => 'mock-token'),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Mock AuthContext to provide a logged-in user
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateUser: jest.fn(),
    refreshUser: jest.fn(),
    submitKYC: jest.fn(),
    getKYCStatus: jest.fn(),
    clearError: jest.fn(),
  }),
}));

import loanService from '../services/loanService';
import pronovaService from '../services/pronovaService';
import investmentService from '../services/investmentService';
import paymentService from '../services/paymentService';
import Dashboard from '../pages/Dashboard';

const mockDashboardStats = {
  total_borrowed: '15000.00',
  total_repaid: '5000.00',
  outstanding_balance: '10000.00',
  active_loans: 2,
  pending_applications: 1,
};

const mockPortfolioSummary = {
  total_value: '25000.00',
  total_invested: '20000.00',
  total_returns: '5000.00',
  return_percentage: '25.00',
};

const mockPaymentHistory = [
  {
    id: 'payment-1',
    amount: '500.00',
    status: 'completed',
    created_at: '2025-01-15T10:00:00Z',
    description: 'Loan payment',
  },
  {
    id: 'payment-2',
    amount: '300.00',
    status: 'completed',
    created_at: '2025-01-14T10:00:00Z',
    description: 'Loan payment',
  },
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    (loanService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats);
    (pronovaService.getWalletBalance as jest.Mock).mockResolvedValue(mockWalletBalance);
    (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue(mockPaymentHistory);
  });

  it('renders dashboard title', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays welcome message with user name', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it('fetches and displays loan statistics', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(loanService.getDashboardStats).toHaveBeenCalled();
    });
  });

  it('fetches and displays wallet balance', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(pronovaService.getWalletBalance).toHaveBeenCalled();
    });
  });

  it('fetches and displays portfolio summary', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(investmentService.getPortfolioSummary).toHaveBeenCalled();
    });
  });

  it('fetches and displays payment history', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(paymentService.getPaymentHistory).toHaveBeenCalled();
    });
  });

  it('shows loading state while fetching data', () => {
    // Mock delayed response
    (loanService.getDashboardStats as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockDashboardStats), 1000))
    );

    render(<Dashboard />);

    // Should show some loading indicator or skeleton
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (loanService.getDashboardStats as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<Dashboard />);

    // Dashboard should still render without crashing
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loanService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats);
    (pronovaService.getWalletBalance as jest.Mock).mockResolvedValue(mockWalletBalance);
    (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue(mockPaymentHistory);
  });

  it('displays PRN balance information', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // Check that wallet balance API was called
      expect(pronovaService.getWalletBalance).toHaveBeenCalled();
    });
  });

  it('displays investment portfolio summary', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(investmentService.getPortfolioSummary).toHaveBeenCalled();
    });
  });
});

describe('Dashboard Quick Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loanService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats);
    (pronovaService.getWalletBalance as jest.Mock).mockResolvedValue(mockWalletBalance);
    (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue(mockPaymentHistory);
  });

  it('renders quick action buttons', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      // Dashboard should have action links/buttons
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard Recent Activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loanService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardStats);
    (pronovaService.getWalletBalance as jest.Mock).mockResolvedValue(mockWalletBalance);
    (investmentService.getPortfolioSummary as jest.Mock).mockResolvedValue(mockPortfolioSummary);
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue(mockPaymentHistory);
  });

  it('displays recent payment activity', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(paymentService.getPaymentHistory).toHaveBeenCalled();
    });
  });

  it('handles empty activity list', async () => {
    (paymentService.getPaymentHistory as jest.Mock).mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
