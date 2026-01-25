import api, { handleApiError, PaginatedResponse } from './api';

// Types
export interface Currency {
  id: string;
  name: string;
  symbol: string;
  usd_rate: number;
  is_active: boolean;
}

export interface LoanApplication {
  id: string;
  prn_amount: string;
  loan_amount_usd: string;
  prn_display_name: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  loan_amount_currency: string;
  exchange_rate_at_application: string;
  duration_months: number;
  interest_rate: string;
  fee_percentage: string;
  fee_amount_usd: string;
  monthly_payment_usd: string;
  total_payment_usd: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  application_data: Record<string, unknown>;
  approval_notes: string;
  rejection_reason: string;
  prn_issued: boolean;
  prn_pledged: boolean;
  certificate_generated: boolean;
  certificate_available: boolean;
  submitted_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  loan_number: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  principal_amount_currency: string;
  principal_amount_usd: string;
  fee_amount_usd: string;
  monthly_payment_usd: string;
  total_amount_usd: string;
  paid_amount_usd: string;
  remaining_amount_usd: string;
  duration_months: number;
  payments_made: number;
  next_payment_date: string | null;
  final_payment_date: string;
  status: 'pending' | 'active' | 'completed' | 'defaulted';
  is_invested_capimax: boolean;
  capimax_investment_id: string | null;
  days_until_next_payment: number | null;
  payment_progress: number;
  created_at: string;
}

export interface Payment {
  id: string;
  loan: string;
  loan_number: string;
  payment_type: 'fee' | 'installment' | 'early_payment';
  amount_usd: string;
  payment_method: string;
  transaction_id: string;
  installment_number: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'completed' | 'failed';
  notes: string;
  created_at: string;
}

export interface LoanCalculation {
  currency: {
    id: string;
    name: string;
    symbol: string;
  };
  prn_amount: string;
  loan_amount_currency: string;
  loan_amount_usd: string;
  exchange_rate: string;
  duration_months: number;
  fee_percentage: string;
  fee_amount_usd: string;
  total_amount_usd: string;
  monthly_payment_usd: string;
  interest_rate: string;
  prn_display: string;
}

export interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  active_loans: number;
  total_borrowed: string;
  total_paid: string;
  total_remaining: string;
  next_payment: {
    loan_number: string;
    amount: string;
    due_date: string;
  } | null;
}

export interface LoanApplicationRequest {
  prn_amount?: number;
  currency?: string;
  loan_amount_currency?: number;
  duration_months: number;
  fee_percentage?: number;
  application_data?: Record<string, unknown>;
}

// Loan Service
const loanService = {
  // Get available currencies
  getCurrencies: async (): Promise<Currency[]> => {
    try {
      const response = await api.get<Currency[]>('/currencies/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Calculate loan
  calculateLoan: async (params: {
    prn_amount?: number;
    amount_usd?: number;
    currency_id?: string;
    loan_amount?: number;
    duration_months: number;
    fee_percentage?: number;
  }): Promise<LoanCalculation> => {
    try {
      const response = await api.post<LoanCalculation>('/loans/calculate/', params);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Submit loan application
  submitApplication: async (data: LoanApplicationRequest): Promise<LoanApplication> => {
    try {
      const response = await api.post<LoanApplication>('/loans/applications/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get user's loan applications
  getApplications: async (): Promise<LoanApplication[]> => {
    try {
      const response = await api.get<LoanApplication[]>('/loans/applications/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single loan application
  getApplication: async (id: string): Promise<LoanApplication> => {
    try {
      const response = await api.get<LoanApplication>(`/loans/applications/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Cancel loan application
  cancelApplication: async (id: string): Promise<void> => {
    try {
      await api.post(`/loans/applications/${id}/cancel/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get user's loans
  getLoans: async (): Promise<Loan[]> => {
    try {
      const response = await api.get<Loan[]>('/loans/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single loan
  getLoan: async (id: string): Promise<Loan> => {
    try {
      const response = await api.get<Loan>(`/loans/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get loan payments
  getLoanPayments: async (loanId: string): Promise<Payment[]> => {
    try {
      const response = await api.get<Payment[]>(`/loans/${loanId}/payments/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all payments
  getPayments: async (): Promise<Payment[]> => {
    try {
      const response = await api.get<Payment[]>('/loans/payments/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get<DashboardStats>('/loans/dashboard/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get loan certificate
  getLoanCertificate: async (applicationId: string): Promise<unknown> => {
    try {
      const response = await api.get(`/loans/applications/${applicationId}/certificate/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default loanService;
