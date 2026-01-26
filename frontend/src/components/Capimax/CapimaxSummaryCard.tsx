import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import pronovaService, { CapimaxAccount, CapimaxInvestment } from '../../services/pronovaService';

interface CapimaxSummaryCardProps {
  className?: string;
}

const CapimaxSummaryCard: React.FC<CapimaxSummaryCardProps> = ({ className = '' }) => {
  const [account, setAccount] = useState<CapimaxAccount | null>(null);
  const [recentInvestments, setRecentInvestments] = useState<CapimaxInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadCapimaxData();
  }, []);

  const loadCapimaxData = async () => {
    try {
      setLoading(true);
      const [accountData, investmentsData] = await Promise.all([
        pronovaService.getCapimaxAccountStatus(),
        pronovaService.getUserInvestments(1).catch(() => ({ investments: [], total: 0, page: 1, pages: 0 }))
      ]);
      
      setAccount(accountData);
      setRecentInvestments(investmentsData.investments.slice(0, 3));
    } catch (err: any) {
      setError('Failed to load Capimax data');
      console.error('Capimax data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async () => {
    try {
      setActivating(true);
      const result = await pronovaService.activateCapimaxAccount();
      
      if (result.success) {
        await loadCapimaxData(); // Reload data after activation
      } else {
        setError('Failed to activate Capimax account');
      }
    } catch (err: any) {
      setError('Failed to activate Capimax account');
    } finally {
      setActivating(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      case 'very_high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const formatProfitLoss = (amount: number, percentage: number) => {
    const isProfit = amount >= 0;
    const color = isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const Icon = isProfit ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="font-medium">
          {isProfit ? '+' : ''}${Math.abs(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({isProfit ? '+' : ''}{percentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!account || !account.active) {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm border border-purple-200 dark:border-gray-600 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Capimax Investment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Not Activated
              </p>
            </div>
          </div>
        </div>

        {/* Activation Prompt */}
        <div className="text-center py-6">
          <ChartBarIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Activate Investment Platform
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Use your PRN certificates to invest on Capimax platform and earn profits while your tokens remain pledged
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleActivateAccount}
              disabled={activating}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {activating ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  Activating...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Activate Now
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Requires active PRN certificate
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Investment Benefits
          </h5>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
              All profits belong to you (0% commission to Nova)
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
              Invest while your PRN tokens remain pledged
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
              Multiple investment options and risk levels
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
              Real-time performance tracking
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Active account view
  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm border border-purple-200 dark:border-gray-600 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-purple-600 rounded-lg">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Capimax Investment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Account: {account.account_id || 'Active'}
            </p>
          </div>
        </div>
        <Link
          to="/invest"
          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
        >
          View Platform →
        </Link>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Capacity
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${account.total_capacity_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Available: ${account.available_capacity_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Net Profit
            </p>
            <p className={`text-2xl font-bold ${account.net_profit_usd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {account.net_profit_usd >= 0 ? '+' : ''}${account.net_profit_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Invested: ${account.invested_amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Investment Summary
          </h4>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Active: {account.active_investments}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Completed: {account.completed_investments}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Profits</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              +${account.total_profits_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Losses</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              -${account.total_losses_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">ROI</p>
            <p className={`text-lg font-semibold ${account.net_profit_usd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {account.invested_amount_usd > 0 
                ? ((account.net_profit_usd / account.invested_amount_usd) * 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                : '0.00'
              }%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Investments */}
      {recentInvestments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Investments
            </h4>
            <Link
              to="/invest"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-xs font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {recentInvestments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {investment.name}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(investment.risk_level)}`}>
                      {investment.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ${investment.invested_amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} invested
                    </p>
                    {formatProfitLoss(investment.profit_loss_usd, investment.profit_loss_percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Link
          to="/invest/create"
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Investment
        </Link>
        <Link
          to="/invest"
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          View Portfolio
        </Link>
      </div>

      {/* Zero Commission Badge */}
      <div className="mt-4 bg-purple-600 rounded-lg p-3 text-white text-center">
        <p className="text-xs font-semibold">
          🎉 0% Commission • All profits are yours!
        </p>
      </div>
    </div>
  );
};

export default CapimaxSummaryCard;