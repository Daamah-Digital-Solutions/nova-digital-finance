import api from './authService';

export interface PaymentMethod {
  id: string;
  payment_type: string;
  card_last_four: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaymentIntent {
  id: string;
  amount_usd: string;
  fee_amount: string;
  currency: string;
  purpose: string;
  status: string;
  client_secret: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_intent_id: string;
  amount_charged: string;
  amount_received: string;
  processing_fee: string;
  status: string;
  receipt_url: string;
  created_at: string;
}

export const paymentService = {
  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payments/methods/');
    return response.data;
  },

  async createPaymentMethod(data: {
    stripe_payment_method_id: string;
    is_default?: boolean;
  }): Promise<PaymentMethod> {
    const response = await api.post('/payments/methods/create/', data);
    return response.data;
  },

  async deletePaymentMethod(methodId: string): Promise<void> {
    await api.delete(`/payments/methods/${methodId}/delete/`);
  },

  // Payment Intents
  async getPaymentIntents(): Promise<PaymentIntent[]> {
    const response = await api.get('/payments/intents/');
    return response.data;
  },

  async createLoanFeePayment(applicationId: string) {
    const response = await api.post(`/payments/loan-fee/${applicationId}/`);
    return response.data;
  },

  async createInstallmentPayment(loanId: string) {
    const response = await api.post(`/payments/installment/${loanId}/`);
    return response.data;
  },

  async confirmPayment(data: {
    payment_intent_id: string;
    stripe_payment_method_id?: string;
  }) {
    const response = await api.post('/payments/confirm/', data);
    return response.data;
  },

  // Transactions
  async getTransactions(): Promise<PaymentTransaction[]> {
    const response = await api.get('/payments/transactions/');
    return response.data;
  },

  // Dashboard Stats
  async getPaymentStats() {
    const response = await api.get('/payments/dashboard/stats/');
    return response.data;
  },
};