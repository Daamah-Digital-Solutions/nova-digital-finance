import api, { handleApiError } from './api';

// Types
export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaymentIntent {
  id: string;
  stripe_payment_intent_id: string;
  amount_usd: string;
  fee_amount: string;
  purpose: 'loan_fee' | 'installment' | 'other';
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  client_secret: string;
  loan_application?: string;
  loan?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_intent: string;
  stripe_charge_id: string;
  amount_charged: string;
  amount_received: string;
  processing_fee: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  failure_reason: string;
  created_at: string;
}

export interface CreatePaymentIntentResponse {
  payment_intent: PaymentIntent;
  client_secret: string;
  publishable_key: string;
  test_mode?: boolean;
}

export interface PaymentDashboardStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_paid: number;
  total_fees_paid: number;
  payment_methods_count: number;
  recent_payments: PaymentTransaction[];
}

export interface UpcomingPayment {
  loan_id: string;
  loan_number: string;
  amount_due: string;
  due_date: string;
  days_until_due: number;
  is_overdue: boolean;
}

// Payment Service
const paymentService = {
  // Get user's payment methods
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const response = await api.get<PaymentMethod[]>('/payments/methods/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Add payment method
  addPaymentMethod: async (stripePaymentMethodId: string): Promise<PaymentMethod> => {
    try {
      const response = await api.post<PaymentMethod>('/payments/methods/', {
        stripe_payment_method_id: stripePaymentMethodId,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete payment method
  deletePaymentMethod: async (id: string): Promise<void> => {
    try {
      await api.delete(`/payments/methods/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (id: string): Promise<PaymentMethod> => {
    try {
      const response = await api.post<PaymentMethod>(`/payments/methods/${id}/set-default/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create loan fee payment intent
  createLoanFeePayment: async (applicationId: string): Promise<CreatePaymentIntentResponse> => {
    try {
      const response = await api.post<CreatePaymentIntentResponse>(
        `/payments/loan-fee/${applicationId}/`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create installment payment intent
  createInstallmentPayment: async (loanId: string): Promise<CreatePaymentIntentResponse> => {
    try {
      const response = await api.post<CreatePaymentIntentResponse>(
        `/payments/installment/${loanId}/`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Confirm payment
  confirmPayment: async (data: {
    payment_intent_id: string;
    stripe_payment_method_id: string;
  }): Promise<{
    status: string;
    requires_action: boolean;
    client_secret?: string;
    message: string;
  }> => {
    try {
      const response = await api.post('/payments/confirm/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get payment intents
  getPaymentIntents: async (): Promise<PaymentIntent[]> => {
    try {
      const response = await api.get<PaymentIntent[]>('/payments/intents/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get payment transactions
  getTransactions: async (): Promise<PaymentTransaction[]> => {
    try {
      const response = await api.get<PaymentTransaction[]>('/payments/transactions/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get payment dashboard stats
  getDashboardStats: async (): Promise<PaymentDashboardStats> => {
    try {
      const response = await api.get<PaymentDashboardStats>('/payments/dashboard/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get upcoming payments
  getUpcomingPayments: async (daysAhead: number = 30): Promise<{ upcoming_payments: UpcomingPayment[]; total_count: number }> => {
    try {
      const response = await api.get(`/payments/upcoming/?days_ahead=${daysAhead}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get Stripe publishable key
  getStripeConfig: async (): Promise<{ publishable_key: string; test_mode: boolean }> => {
    try {
      const response = await api.get('/payments/config/');
      return response.data;
    } catch (error) {
      // Return default for development
      return {
        publishable_key: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
        test_mode: true,
      };
    }
  },
};

export default paymentService;
