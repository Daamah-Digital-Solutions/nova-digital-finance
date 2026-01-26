import React from 'react';
import investmentService, { PortfolioSummary } from '../../services/investmentService';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

interface PortfolioOverviewProps {
  portfolio: PortfolioSummary;
  onRefresh: () => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ portfolio, onRefresh }) => {
  const hasInvestments = portfolio.active_positions_count > 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Performance Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio Performance
          </h3>
          <button
            onClick={onRefresh}
            className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>

        {hasInvestments ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Portfolio performance chart will be displayed here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Integration with charting library coming soon
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No Active Investments
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start investing to see your portfolio performance here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Platform Breakdown */}
      {portfolio.platforms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platform Breakdown
          </h3>
          
          <div className="space-y-4">
            {portfolio.platforms.map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                    <BuildingLibraryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {platform.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {platform.positions_count} position{platform.positions_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {investmentService.formatCurrency(platform.balance)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Invested: {investmentService.formatCurrency(platform.invested)}
                  </p>
                  <p className={`text-sm font-medium ${investmentService.getProfitLossColor(platform.pnl)}`}>
                    {parseFloat(platform.pnl) >= 0 ? '+' : ''}{investmentService.formatCurrency(platform.pnl)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Allocation */}
      {portfolio.positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Asset Allocation
          </h3>
          
          {/* Simple asset breakdown */}
          <div className="space-y-3">
            {portfolio.positions.slice(0, 5).map((position, index) => {
              const investmentValue = parseFloat(position.investment_amount);
              const totalInvestment = parseFloat(portfolio.total_invested_usd);
              const percentage = totalInvestment > 0 ? (investmentValue / totalInvestment) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {investmentService.getAssetIcon(position.asset_symbol)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {position.asset_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {position.asset_symbol}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {percentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {investmentService.formatCurrency(position.investment_amount)}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {portfolio.positions.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  +{portfolio.positions.length - 5} more assets
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Return</span>
              <span className={`font-semibold ${investmentService.getProfitLossColor(portfolio.total_pnl_usd)}`}>
                {investmentService.formatPercentage(portfolio.total_pnl_percentage)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total P&L</span>
              <span className={`font-semibold ${investmentService.getProfitLossColor(portfolio.total_pnl_usd)}`}>
                {investmentService.formatCurrency(portfolio.total_pnl_usd)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Positions</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {portfolio.active_positions_count}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platforms</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {portfolio.platforms.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Investment Summary
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Balance</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {investmentService.formatCurrency(portfolio.total_balance_usd)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Invested</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {investmentService.formatCurrency(portfolio.total_invested_usd)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Available Cash</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {investmentService.formatCurrency(
                  (parseFloat(portfolio.total_balance_usd) - parseFloat(portfolio.total_invested_usd)).toString()
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Current Value</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {investmentService.formatCurrency(
                  (parseFloat(portfolio.total_invested_usd) + parseFloat(portfolio.total_pnl_usd)).toString()
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;