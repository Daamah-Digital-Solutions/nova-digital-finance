import api from './authService';

export const loanService = {
  async getAvailableCurrencies() {
    const response = await api.get('/loans/currencies/');
    return response.data;
  },

  async calculateLoan(data: {
    currency_id: string;
    loan_amount: string;
    duration_months: number;
    fee_percentage: number;
  }) {
    const response = await api.post('/loans/calculate/', data);
    return response.data;
  },

  async createApplication(data: {
    currency: string;
    loan_amount_currency: string;
    duration_months: number;
    fee_percentage: number;
  }) {
    const response = await api.post('/loans/applications/create/', data);
    return response.data;
  },

  async getApplications() {
    const response = await api.get('/loans/applications/');
    return response.data;
  },

  async getLoans() {
    const response = await api.get('/loans/');
    return response.data;
  },

  async getLoan(loanId: string) {
    const response = await api.get(`/loans/${loanId}/`);
    return response.data;
  },

  async getPayments() {
    const response = await api.get('/loans/payments/');
    return response.data;
  },

  async getLoanRequests() {
    const response = await api.get('/loans/requests/');
    return response.data;
  },

  async createLoanRequest(data: {
    loan: string;
    request_type: 'increase' | 'settlement' | 'deferral' | 'transfer' | 'waiver' | 'extension';
    description: string;
    request_data?: any;
  }) {
    const response = await api.post('/loans/requests/create/', data);
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/loans/dashboard/stats/');
    return response.data;
  },

  async processApplicationPayment(applicationId: string) {
    const response = await api.post(`/loans/applications/${applicationId}/pay/`);
    return response.data;
  },

  async getUpcomingPayments(daysAhead: number = 30) {
    const response = await api.get(`/payments/upcoming/?days_ahead=${daysAhead}`);
    return response.data;
  },

  async createInstallmentPayment(loanId: string) {
    const response = await api.post(`/payments/installment/${loanId}/`);
    return response.data;
  },

  async getRecentActivity() {
    const response = await api.get('/loans/payments/');
    return response.data;
  },
};