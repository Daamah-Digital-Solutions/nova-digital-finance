import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import LoanApplication from '../Loans/LoanApplication';
import { AuthProvider } from '../../contexts/AuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import * as loanService from '../../services/loanService';

// Mock the loan service
jest.mock('../../services/loanService', () => ({
  applyForLoan: jest.fn(),
  getCurrencies: jest.fn(),
  calculateLoanEstimate: jest.fn()
}));

// Mock the contexts
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      isAuthenticated: true,
      user: { 
        id: '1', 
        username: 'testuser', 
        kyc_status: 'approved',
        email: 'test@example.com'
      },
      loading: false
    }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    state: { language: 'en' },
    t: (key: string) => key
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            {component}
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoanApplication Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock default service responses
    (loanService.getCurrencies as jest.Mock).mockResolvedValue([
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'PRN', name: 'Pronova', symbol: 'PRN' }
    ]);
    
    (loanService.calculateLoanEstimate as jest.Mock).mockResolvedValue({
      fee_amount: 150.00,
      fee_percentage: 3.0,
      total_amount: 5150.00,
      monthly_payment: 429.17
    });
  });

  test('renders loan application form', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Check for form fields
    expect(screen.getByLabelText(/loan amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  test('displays KYC requirement for unverified users', () => {
    // Mock unverified user
    const mockUseAuth = jest.requireMock('../../contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        user: { 
          id: '1', 
          username: 'testuser', 
          kyc_status: 'pending',
          email: 'test@example.com'
        },
        loading: false
      }
    });

    renderWithProviders(<LoanApplication />);
    
    expect(screen.getByText(/complete your KYC verification/i)).toBeInTheDocument();
  });

  test('form validation works correctly', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Try to submit form without required fields
    const submitButton = screen.getByRole('button', { name: /apply for loan/i });
    fireEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/loan amount is required/i)).toBeInTheDocument();
    });
  });

  test('loan amount calculation updates correctly', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/loan amount/i)).toBeInTheDocument();
    });
    
    // Fill in loan amount
    const amountInput = screen.getByLabelText(/loan amount/i);
    fireEvent.change(amountInput, { target: { value: '5000' } });
    
    // Select currency
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });
    
    // Should trigger calculation
    await waitFor(() => {
      expect(loanService.calculateLoanEstimate).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'USD'
      });
    });
    
    // Should display calculated values
    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // Fee amount
    });
  });

  test('currency selection works correctly', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });
    
    const currencySelect = screen.getByLabelText(/currency/i);
    
    // Should have USD and PRN options
    expect(screen.getByText('US Dollar (USD)')).toBeInTheDocument();
    expect(screen.getByText('Pronova (PRN)')).toBeInTheDocument();
    
    // Change currency
    fireEvent.change(currencySelect, { target: { value: 'PRN' } });
    
    expect(currencySelect).toHaveValue('PRN');
  });

  test('purpose selection includes all options', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
    });
    
    const purposeSelect = screen.getByLabelText(/purpose/i);
    
    // Check for common purposes
    expect(screen.getByText('Business Expansion')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
  });

  test('successful form submission', async () => {
    (loanService.applyForLoan as jest.Mock).mockResolvedValue({
      id: '1',
      application_number: 'APP123456',
      status: 'approved',
      amount_requested: 5000.00
    });

    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/purpose/i), { target: { value: 'business_expansion' } });
    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: '12' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /apply for loan/i });
    fireEvent.click(submitButton);
    
    // Should call the loan service
    await waitFor(() => {
      expect(loanService.applyForLoan).toHaveBeenCalledWith({
        amount_requested: 5000,
        currency: 'USD',
        purpose: 'business_expansion',
        duration_months: 12
      });
    });
    
    // Should navigate to success page or dashboard
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('handles form submission errors', async () => {
    (loanService.applyForLoan as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: 'Insufficient income for requested amount'
        }
      }
    });

    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/purpose/i), { target: { value: 'personal' } });
    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: '60' } });
    
    const submitButton = screen.getByRole('button', { name: /apply for loan/i });
    fireEvent.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/insufficient income/i)).toBeInTheDocument();
    });
  });

  test('loading states work correctly', async () => {
    // Mock slow API response
    (loanService.applyForLoan as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    
    const submitButton = screen.getByRole('button', { name: /apply for loan/i });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('form fields have proper validation', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/loan amount/i)).toBeInTheDocument();
    });
    
    const amountInput = screen.getByLabelText(/loan amount/i);
    
    // Test invalid amount (negative)
    fireEvent.change(amountInput, { target: { value: '-1000' } });
    fireEvent.blur(amountInput);
    
    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
    
    // Test amount too high
    fireEvent.change(amountInput, { target: { value: '1000000' } });
    fireEvent.blur(amountInput);
    
    await waitFor(() => {
      expect(screen.getByText(/maximum loan amount/i)).toBeInTheDocument();
    });
  });

  test('accessibility features', async () => {
    renderWithProviders(<LoanApplication />);
    
    await waitFor(() => {
      expect(screen.getByText('Apply for Financing')).toBeInTheDocument();
    });
    
    // Check for proper labels
    const amountInput = screen.getByLabelText(/loan amount/i);
    expect(amountInput).toHaveAttribute('id');
    expect(amountInput).toHaveAttribute('aria-describedby');
    
    // Check for form structure
    const form = screen.getByRole('form') || screen.getByTestId('loan-application-form');
    expect(form).toBeInTheDocument();
    
    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
  });

  test('responsive design elements', () => {
    // Test different screen sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    renderWithProviders(<LoanApplication />);
    
    // Form should be responsive
    const form = document.querySelector('form');
    expect(form).toHaveClass(/responsive|mobile|grid/);
  });
});