import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Investments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 25750.00,
    totalReturn: 2750.00,
    returnPercentage: 12.5,
    dayChange: 325.50,
    dayChangePercentage: 1.28
  });
  const [investments, setInvestments] = useState([
    { id: '1', name: 'Tech Growth Fund', value: 8500, shares: 150, price: 56.67, change: 2.34, changePercent: 4.3 },
    { id: '2', name: 'S&P 500 Index', value: 12000, shares: 25, price: 480.00, change: -5.20, changePercent: -1.1 },
    { id: '3', name: 'Green Energy ETF', value: 3500, shares: 70, price: 50.00, change: 1.25, changePercent: 2.6 },
    { id: '4', name: 'Bitcoin Fund', value: 1750, shares: 5, price: 350.00, change: 15.75, changePercent: 4.7 }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your investments
          </h2>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.investments')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your investment portfolio
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(portfolioData.totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Return</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(portfolioData.totalReturn)}
                </p>
                <p className="text-sm text-green-600">
                  {formatPercentage(portfolioData.returnPercentage)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Day Change</p>
                <p className={`text-2xl font-bold ${portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(portfolioData.dayChange)}
                </p>
                <p className={`text-sm ${portfolioData.dayChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioData.dayChangePercentage)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                portfolioData.dayChange >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}>
                <svg className={`w-6 h-6 ${portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={portfolioData.dayChange >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Holdings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {investments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Holdings</h2>
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200">
                  Add Investment
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Investment</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Value</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Change</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {investments.map((investment) => (
                      <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {investment.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {investment.shares} shares
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(investment.value)}
                        </td>
                        <td className="py-4 text-right text-gray-600 dark:text-gray-300">
                          {formatCurrency(investment.price)}
                        </td>
                        <td className="py-4 text-right">
                          <div className={`${investment.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="font-medium">
                              {investment.change >= 0 ? '+' : ''}{formatCurrency(investment.change)}
                            </div>
                            <div className="text-sm">
                              {formatPercentage(investment.changePercent)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-left">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Buy Investments
                  </div>
                </button>
                <button className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-left">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                    </svg>
                    Sell Holdings
                  </div>
                </button>
                <button className="w-full py-3 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Analytics
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market News</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Tech Stocks Rally on AI News
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Fed Maintains Interest Rates
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    Green Energy ETFs Surge
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Investments;