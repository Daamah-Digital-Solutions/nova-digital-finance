import api from './api';

export interface PRNCertificate {
  id: string;
  certificate_number: string;
  prn_amount: number;
  usd_value: number;
  status: string;
  issued_date: string;
  expiry_date: string;
  pledge_release_date?: string;
  capimax_certificate_id?: string;
  capimax_investment_active: boolean;
  loan_application: {
    id: string;
    loan_amount_usd: number;
    duration_months: number;
    monthly_payment_usd: number;
  };
}

export interface PRNWallet {
  balance: number;
  pledged_balance: number;
  available_balance: number;
  total_earned_usd: number;
  total_transactions: number;
}

export interface CapimaxAccount {
  active: boolean;
  account_id?: string;
  status?: string;
  total_capacity_usd: number;
  available_capacity_usd: number;
  invested_amount_usd: number;
  total_profits_usd: number;
  total_losses_usd: number;
  net_profit_usd: number;
  active_investments: number;
  completed_investments: number;
  last_activity?: string;
}

export interface CapimaxInvestmentOpportunity {
  id: string;
  name: string;
  type: string;
  min_investment: number;
  max_investment: number;
  expected_return: string;
  risk_level: string;
  duration_days: number;
  description: string;
}

export interface CapimaxInvestment {
  id: string;
  investment_id: string;
  name: string;
  type: string;
  invested_amount_usd: number;
  current_value_usd: number;
  profit_loss_usd: number;
  profit_loss_percentage: number;
  status: string;
  risk_level: string;
  started_at: string;
  expected_completion_at?: string;
  completed_at?: string;
}

class PRNovaService {
  // Certificate Management
  async getUserCertificates(): Promise<PRNCertificate[]> {
    const response = await api.get('/pronova/certificates/');
    return response.data.certificates || [];
  }

  async getCertificateDetail(certificateId: string): Promise<PRNCertificate> {
    const response = await api.get(`/pronova/certificates/${certificateId}/`);
    return response.data;
  }

  async downloadCertificate(certificateId: string): Promise<Blob> {
    const response = await api.get(`/pronova/certificates/${certificateId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // PRN Wallet
  async getWalletBalance(): Promise<PRNWallet> {
    const response = await api.get('/pronova/wallet/balance/');
    return response.data;
  }

  async getWalletTransactions(page: number = 1): Promise<any> {
    const response = await api.get(`/pronova/wallet/transactions/?page=${page}`);
    return response.data;
  }

  // Capimax Integration
  async getCapimaxAccountStatus(): Promise<CapimaxAccount> {
    const response = await api.get('/capimax/account/status/');
    return response.data;
  }

  async activateCapimaxAccount(): Promise<{ success: boolean; message: string; account_id?: string }> {
    const response = await api.post('/capimax/activate/');
    return response.data;
  }

  async getInvestmentOpportunities(): Promise<CapimaxInvestmentOpportunity[]> {
    const response = await api.get('/capimax/opportunities/');
    return response.data.opportunities || [];
  }

  async createInvestment(investmentData: {
    investment_type: string;
    amount_usd: number;
    risk_level?: string;
    duration_days?: number;
    investment_name?: string;
    expected_return?: number;
    description?: string;
    terms?: any;
  }): Promise<{ success: boolean; investment_id?: string; error?: string }> {
    const response = await api.post('/capimax/investments/create/', investmentData);
    return response.data;
  }

  async getUserInvestments(page: number = 1): Promise<{
    investments: CapimaxInvestment[];
    total: number;
    page: number;
    pages: number;
  }> {
    const response = await api.get(`/capimax/investments/?page=${page}`);
    return response.data;
  }

  async getInvestmentDetail(investmentId: string): Promise<CapimaxInvestment & {
    recent_transactions: any[];
    investment_terms: any;
  }> {
    const response = await api.get(`/capimax/investments/${investmentId}/`);
    return response.data;
  }

  async withdrawInvestment(investmentId: string, amountUsd?: number): Promise<{
    success: boolean;
    message: string;
    withdrawal_amount?: number;
    processing?: boolean;
  }> {
    const response = await api.post(`/capimax/investments/${investmentId}/withdraw/`, {
      amount_usd: amountUsd
    });
    return response.data;
  }

  async getPerformanceSummary(): Promise<CapimaxAccount> {
    const response = await api.get('/capimax/performance/');
    return response.data;
  }

  async getTransactionHistory(page: number = 1): Promise<{
    transactions: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const response = await api.get(`/capimax/transactions/?page=${page}`);
    return response.data;
  }

  async syncCapimaxAccount(): Promise<{ success: boolean; message: string; sync_data?: any }> {
    const response = await api.post('/capimax/account/sync/');
    return response.data;
  }

  // Dashboard Summary
  async getDashboardSummary(): Promise<{
    prn_wallet: PRNWallet;
    active_certificates: PRNCertificate[];
    capimax_performance: CapimaxAccount;
    recent_investments: CapimaxInvestment[];
  }> {
    const [wallet, certificates, performance, investments] = await Promise.all([
      this.getWalletBalance(),
      this.getUserCertificates(),
      this.getPerformanceSummary(),
      this.getUserInvestments(1)
    ]);

    return {
      prn_wallet: wallet,
      active_certificates: certificates.filter(cert => cert.status === 'pledged'),
      capimax_performance: performance,
      recent_investments: investments.investments.slice(0, 3)
    };
  }
}

export const prnovaService = new PRNovaService();