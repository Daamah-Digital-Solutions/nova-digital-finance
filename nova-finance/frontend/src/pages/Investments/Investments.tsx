import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { investmentService, PortfolioSummary, InvestmentPosition } from '../../services/investmentService';
import PortfolioOverview from '../../components/Investments/PortfolioOverview';
import PositionsList from '../../components/Investments/PositionsList';
import MarketOverview from '../../components/Investments/MarketOverview';
import InvestmentOpportunities from '../../components/Investments/InvestmentOpportunities';
import { 
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const Investments: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<InvestmentPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'opportunities' | 'market'>('overview');

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load portfolio summary and positions in parallel
      const [summary, positionsData] = await Promise.all([
        investmentService.getPortfolioSummary(),
        investmentService.getInvestmentPositions()
      ]);

      setPortfolioSummary(summary);
      setPositions(positionsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadInvestmentData();
  };

  const handlePositionAction = async (action: string, positionId: string) => {
    try {
      switch (action) {
        case 'close':
          await investmentService.closePosition(positionId);
          break;
        case 'update':
          await investmentService.updatePositionPrice(positionId);
          break;
        default:
          break;
      }
      
      // Reload data after action
      await loadInvestmentData();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} position`);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: ChartBarIcon },
    { key: 'positions', label: 'Positions', icon: ArrowTrendingUpIcon },
    { key: 'opportunities', label: 'Opportunities', icon: PlusIcon },
    { key: 'market', label: 'Market', icon: CurrencyDollarIcon }
  ];

  if (loading && !portfolioSummary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading investment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !portfolioSummary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Investment Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Investment Portfolio
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your cryptocurrency investments powered by loan certificates
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => navigate('/investments/opportunities')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Investment
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {portfolioSummary && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {investmentService.formatCurrency(portfolioSummary.total_balance_usd)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {investmentService.formatCurrency(portfolioSummary.total_invested_usd)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  parseFloat(portfolioSummary.total_pnl_usd) >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <ChartBarIcon className={`w-6 h-6 ${
                    parseFloat(portfolioSummary.total_pnl_usd) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold ${investmentService.getProfitLossColor(portfolioSummary.total_pnl_usd)}`}>
                    {investmentService.formatCurrency(portfolioSummary.total_pnl_usd)}
                  </p>
                  <p className={`text-sm ${investmentService.getProfitLossColor(portfolioSummary.total_pnl_percentage)}`}>
                    {investmentService.formatPercentage(portfolioSummary.total_pnl_percentage)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Positions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {portfolioSummary.active_positions_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && portfolioSummary && (
            <PortfolioOverview 
              portfolio={portfolioSummary}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'positions' && (
            <PositionsList
              positions={positions}
              onAction={handlePositionAction}
              loading={loading}
            />
          )}

          {activeTab === 'opportunities' && (
            <InvestmentOpportunities />
          )}

          {activeTab === 'market' && (
            <MarketOverview />
          )}
        </div>
      </div>
    </div>
  );
};

export default Investments;