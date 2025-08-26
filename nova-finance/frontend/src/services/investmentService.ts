import api from './authService';

export interface InvestmentPlatform {
  id: string;
  name: string;
  slug: string;
  platform_type: string;
  platform_type_display: string;
  description: string;
  website_url: string;
  logo_url?: string;
  min_investment_usd: string;
  max_investment_usd?: string;
  commission_rate: string;
  status: string;
  status_display: string;
  is_verified: boolean;
  supports_certificates: boolean;
  created_at: string;
}

export interface UserInvestmentAccount {
  id: string;
  user: {
    id: string;
    username: string;
  };
  platform: InvestmentPlatform;
  platform_user_id: string;
  platform_username?: string;
  verification_status: string;
  verification_status_display: string;
  verified_at?: string;
  balance_usd: string;
  available_balance_usd: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPosition {
  id: string;
  account: UserInvestmentAccount;
  loan?: string;
  position_id: string;
  asset_symbol: string;
  asset_name: string;
  position_type: string;
  position_type_display: string;
  status: string;
  status_display: string;
  investment_amount_usd: string;
  current_value_usd: string;
  entry_price: string;
  current_price: string;
  quantity: string;
  unrealized_pnl_usd: string;
  realized_pnl_usd: string;
  profit_loss_percentage: string;
  opened_at: string;
  closed_at?: string;
  last_updated: string;
  created_at: string;
}

export interface InvestmentTransaction {
  id: string;
  account: UserInvestmentAccount;
  position?: InvestmentPosition;
  transaction_id: string;
  transaction_type: string;
  transaction_type_display: string;
  status: string;
  status_display: string;
  asset_symbol?: string;
  quantity?: string;
  price?: string;
  amount_usd: string;
  fee_usd: string;
  description?: string;
  executed_at: string;
  created_at: string;
}

export interface CapimaxIntegration {
  id: string;
  user: {
    id: string;
    username: string;
  };
  capimax_user_id: string;
  preferred_strategy: string;
  preferred_strategy_display: string;
  max_investment_percentage: string;
  stop_loss_percentage: string;
  take_profit_percentage: string;
  auto_invest_enabled: boolean;
  auto_invest_amount_usd: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentAlert {
  id: string;
  user: {
    id: string;
    username: string;
  };
  account?: UserInvestmentAccount;
  position?: InvestmentPosition;
  alert_type: string;
  alert_type_display: string;
  priority: string;
  priority_display: string;
  title: string;
  message: string;
  trigger_price?: string;
  trigger_percentage?: string;
  is_read: boolean;
  is_dismissed: boolean;
  email_sent: boolean;
  sms_sent: boolean;
  triggered_at: string;
  read_at?: string;
  created_at: string;
}

export interface PortfolioSummary {
  total_balance_usd: string;
  total_invested_usd: string;
  total_pnl_usd: string;
  total_pnl_percentage: string;
  active_positions_count: number;
  platforms: Array<{
    name: string;
    balance: string;
    invested: string;
    pnl: string;
    positions_count: number;
  }>;
  positions: Array<{
    id: string;
    asset_symbol: string;
    asset_name: string;
    investment_amount: string;
    current_value: string;
    pnl: string;
    pnl_percentage: string;
    platform: string;
  }>;
}

export interface MarketData {
  symbol: string;
  price: string;
  change_24h: string;
  change_24h_percent: string;
  volume_24h: string;
  market_cap?: string;
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

class InvestmentService {
  // Investment Platforms
  async getInvestmentPlatforms(type?: string): Promise<InvestmentPlatform[]> {
    const params = type ? { type } : {};
    const response = await api.get('/investments/platforms/', { params });
    return response.data.results || response.data;
  }

  // User Investment Accounts
  async getInvestmentAccounts(): Promise<UserInvestmentAccount[]> {
    const response = await api.get('/investments/accounts/');
    return response.data.results || response.data;
  }

  async syncAccount(accountId: string): Promise<{ message: string }> {
    const response = await api.post(`/investments/accounts/${accountId}/sync/`);
    return response.data;
  }

  // Investment Positions
  async getInvestmentPositions(): Promise<InvestmentPosition[]> {
    const response = await api.get('/investments/positions/');
    return response.data.results || response.data;
  }

  async createInvestmentPosition(data: {
    loan_id: string;
    asset_symbol: string;
    investment_amount_usd: string;
    strategy: string;
  }): Promise<InvestmentPosition> {
    const response = await api.post('/investments/positions/', data);
    return response.data;
  }

  async closePosition(positionId: string, reason: string = 'manual'): Promise<InvestmentPosition> {
    const response = await api.post(`/investments/positions/${positionId}/close/`, {
      position_id: positionId,
      close_reason: reason
    });
    return response.data;
  }

  async updatePositionPrice(positionId: string): Promise<InvestmentPosition> {
    const response = await api.post(`/investments/positions/${positionId}/update_price/`);
    return response.data;
  }

  // Investment Transactions
  async getInvestmentTransactions(): Promise<InvestmentTransaction[]> {
    const response = await api.get('/investments/transactions/');
    return response.data.results || response.data;
  }

  // Capimax Integration
  async getCapimaxIntegration(): Promise<CapimaxIntegration | null> {
    try {
      const response = await api.get('/investments/capimax/');
      const integrations = response.data.results || response.data;
      return integrations.length > 0 ? integrations[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createCapimaxIntegration(data: {
    preferred_strategy: string;
    max_investment_percentage: string;
    stop_loss_percentage: string;
    take_profit_percentage: string;
    auto_invest_enabled: boolean;
    auto_invest_amount_usd: string;
    email_notifications: boolean;
    sms_notifications: boolean;
  }): Promise<CapimaxIntegration> {
    const response = await api.post('/investments/capimax/', data);
    return response.data;
  }

  async updateCapimaxIntegration(id: string, data: Partial<CapimaxIntegration>): Promise<CapimaxIntegration> {
    const response = await api.patch(`/investments/capimax/${id}/`, data);
    return response.data;
  }

  // Investment Alerts
  async getInvestmentAlerts(): Promise<InvestmentAlert[]> {
    const response = await api.get('/investments/alerts/');
    return response.data.results || response.data;
  }

  async markAlertRead(alertId: string): Promise<InvestmentAlert> {
    const response = await api.post(`/investments/alerts/${alertId}/mark_read/`);
    return response.data;
  }

  async dismissAlert(alertId: string): Promise<{ message: string }> {
    const response = await api.post(`/investments/alerts/${alertId}/dismiss/`);
    return response.data;
  }

  async markAllAlertsRead(): Promise<{ message: string }> {
    const response = await api.post('/investments/alerts/mark_all_read/');
    return response.data;
  }

  // Portfolio and Market Data
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await api.get('/investments/portfolio/summary/');
    return response.data;
  }

  async getMarketData(symbols: string[] = ['BTC', 'ETH', 'BNB', 'ADA']): Promise<MarketData[]> {
    const response = await api.get('/investments/market/data/', {
      params: { symbols: symbols.join(',') }
    });
    return response.data;
  }

  async getInvestmentOpportunities(): Promise<InvestmentOpportunity[]> {
    const response = await api.get('/investments/opportunities/');
    return response.data;
  }

  // Helper functions
  getProfitLossColor(pnl: string): string {
    const value = parseFloat(pnl);
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  }

  formatCurrency(amount: string, currency: string = 'USD'): string {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatPercentage(percentage: string): string {
    const value = parseFloat(percentage);
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  getAssetIcon(symbol: string): string {
    const icons: Record<string, string> = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'BNB': 'BNB',
      'ADA': '₳',
      'DOT': '●',
      'LINK': '⬡',
      'XRP': 'XRP',
      'LTC': 'Ł'
    };
    return icons[symbol] || symbol;
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'conservative':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'aggressive':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'closed':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'medium':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}

export const investmentService = new InvestmentService();
export default investmentService;