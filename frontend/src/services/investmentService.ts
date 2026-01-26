import api, { handleApiError } from './api';

// Types
export interface InvestmentPlatform {
  id: string;
  name: string;
  slug: string;
  platform_type: 'cryptocurrency' | 'forex' | 'stocks' | 'commodities' | 'mixed';
  description: string;
  website_url: string;
  api_endpoint: string;
  logo_url: string;
  min_investment_usd: string;
  max_investment_usd: string | null;
  commission_rate: string;
  status: 'active' | 'maintenance' | 'suspended' | 'beta';
  is_verified: boolean;
  supports_certificates: boolean;
}

export interface InvestmentAccount {
  id: string;
  platform: string;
  platform_name: string;
  platform_user_id: string;
  platform_username: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified_at: string | null;
  balance_usd: string;
  available_balance_usd: string;
  is_active: boolean;
  created_at: string;
}

export interface InvestmentPosition {
  id: string;
  account: string;
  loan: string | null;
  position_id: string;
  asset_symbol: string;
  asset_name: string;
  position_type: 'long' | 'short' | 'neutral';
  status: 'active' | 'closed' | 'pending' | 'cancelled';
  investment_amount_usd: string;
  current_value_usd: string;
  entry_price: string;
  current_price: string;
  quantity: string;
  unrealized_pnl_usd: string;
  realized_pnl_usd: string;
  profit_loss_percentage: number;
  opened_at: string;
  closed_at: string | null;
  last_updated: string;
}

export interface InvestmentTransaction {
  id: string;
  account: string;
  position: string | null;
  transaction_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'fee' | 'commission';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  asset_symbol: string;
  quantity: string | null;
  price: string | null;
  amount_usd: string;
  fee_usd: string;
  description: string;
  executed_at: string;
}

export interface PortfolioSummary {
  total_invested_usd: string;
  total_current_value_usd: string;
  total_unrealized_pnl_usd: string;
  total_realized_pnl_usd: string;
  total_pnl_percentage: number;
  positions_count: number;
  active_positions_count: number;
  platforms: Array<{
    platform_name: string;
    invested_usd: string;
    current_value_usd: string;
    pnl_usd: string;
  }>;
  asset_allocation: Array<{
    asset_symbol: string;
    asset_name: string;
    allocation_percentage: number;
    value_usd: string;
  }>;
}

export interface MarketData {
  symbol: string;
  price: string;
  change_24h: string;
  change_24h_percent: string;
  volume_24h: string;
  market_cap: string | null;
  last_updated: string;
}

export interface InvestmentOpportunity {
  loan_id: string;
  loan_number: string;
  currency_symbol: string;
  loan_amount_usd: string;
  available_for_investment_usd: string;
  max_investment_percentage: string;
  recommended_assets: Array<{
    symbol: string;
    name: string;
    allocation: string;
    risk: string;
  }>;
  risk_level: string;
  expected_return_range: {
    min_annual: string;
    max_annual: string;
  };
}

export interface InvestmentAlert {
  id: string;
  account: string | null;
  position: string | null;
  alert_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  trigger_price: string | null;
  trigger_percentage: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_at: string;
  read_at: string | null;
}

export interface CreatePositionRequest {
  loan_id: string;
  investment_amount_usd: number;
  asset_symbol: string;
  strategy: 'conservative' | 'moderate' | 'aggressive';
}

// Investment Service
const investmentService = {
  // Utility functions
  formatCurrency: (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  },

  formatPercentage: (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  },

  // Get investment platforms
  getPlatforms: async (type?: string): Promise<InvestmentPlatform[]> => {
    try {
      const url = type ? `/investments/platforms/?type=${type}` : '/investments/platforms/';
      const response = await api.get<InvestmentPlatform[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get user's investment accounts
  getAccounts: async (): Promise<InvestmentAccount[]> => {
    try {
      const response = await api.get<InvestmentAccount[]>('/investments/accounts/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Sync account data
  syncAccount: async (accountId: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/investments/accounts/${accountId}/sync/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get investment positions
  getPositions: async (): Promise<InvestmentPosition[]> => {
    try {
      const response = await api.get<InvestmentPosition[]>('/investments/positions/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single position
  getPosition: async (id: string): Promise<InvestmentPosition> => {
    try {
      const response = await api.get<InvestmentPosition>(`/investments/positions/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Create new position
  createPosition: async (data: CreatePositionRequest): Promise<InvestmentPosition> => {
    try {
      const response = await api.post<InvestmentPosition>('/investments/positions/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Close position
  closePosition: async (id: string): Promise<InvestmentPosition> => {
    try {
      const response = await api.post<InvestmentPosition>(`/investments/positions/${id}/close/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update position price
  updatePositionPrice: async (id: string): Promise<InvestmentPosition> => {
    try {
      const response = await api.post<InvestmentPosition>(`/investments/positions/${id}/update_price/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get transactions
  getTransactions: async (): Promise<InvestmentTransaction[]> => {
    try {
      const response = await api.get<InvestmentTransaction[]>('/investments/transactions/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get portfolio summary
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    try {
      const response = await api.get<PortfolioSummary>('/investments/portfolio/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get market data
  getMarketData: async (symbols?: string[]): Promise<MarketData[]> => {
    try {
      const symbolsParam = symbols ? symbols.join(',') : 'BTC,ETH,BNB,ADA';
      const response = await api.get<MarketData[]>(`/investments/market/?symbols=${symbolsParam}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get investment opportunities
  getOpportunities: async (): Promise<InvestmentOpportunity[]> => {
    try {
      const response = await api.get<InvestmentOpportunity[]>('/investments/opportunities/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get alerts
  getAlerts: async (): Promise<InvestmentAlert[]> => {
    try {
      const response = await api.get<InvestmentAlert[]>('/investments/alerts/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Mark alert as read
  markAlertRead: async (id: string): Promise<InvestmentAlert> => {
    try {
      const response = await api.post<InvestmentAlert>(`/investments/alerts/${id}/mark_read/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Dismiss alert
  dismissAlert: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/investments/alerts/${id}/dismiss/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Mark all alerts as read
  markAllAlertsRead: async (): Promise<{ message: string }> => {
    try {
      const response = await api.post('/investments/alerts/mark_all_read/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default investmentService;
