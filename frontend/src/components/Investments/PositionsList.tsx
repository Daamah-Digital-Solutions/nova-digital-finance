import React from 'react';
import investmentService, { InvestmentPosition } from '../../services/investmentService';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

interface PositionsListProps {
  positions: InvestmentPosition[];
  onPositionClick?: (position: InvestmentPosition) => void;
  onAction?: (action: string, positionId: string) => Promise<void>;
  loading?: boolean;
}

const PositionsList: React.FC<PositionsListProps> = ({ positions, onPositionClick, onAction, loading }) => {
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No Active Positions
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start investing to see your positions here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Investment Positions
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {positions.map((position) => {
          const currentValue = parseFloat(position.current_value_usd);
          const investedAmount = parseFloat(position.investment_amount_usd);
          const profitLoss = currentValue - investedAmount;
          const profitLossPercentage = (profitLoss / investedAmount) * 100;
          const isProfit = profitLoss >= 0;

          return (
            <div
              key={position.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              onClick={() => onPositionClick?.(position)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {position.asset_symbol.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {position.asset_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {position.quantity} units
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {investmentService.formatCurrency(position.current_value_usd)}
                  </p>
                  <div className={`flex items-center text-sm ${
                    isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isProfit ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                    )}
                    {isProfit ? '+' : ''}
                    {investmentService.formatCurrency(profitLoss.toString())} ({profitLossPercentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
                  </div>
                </div>

                <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Invested: {investmentService.formatCurrency(position.investment_amount_usd)}
                </span>
                <span>
                  Date: {new Date(position.opened_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionsList;