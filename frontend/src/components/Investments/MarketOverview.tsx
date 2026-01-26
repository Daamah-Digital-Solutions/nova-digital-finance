import React, { useState, useEffect } from 'react';
import investmentService from '../../services/investmentService';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock market data for demonstration
      const mockData: MarketData[] = [
        {
          symbol: 'PRN',
          name: 'Pronova',
          price: 1.25,
          change: 0.05,
          changePercent: 4.17,
          volume: 2500000
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 43250.50,
          change: -1250.30,
          changePercent: -2.81,
          volume: 18500000000
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 2650.75,
          change: 125.25,
          changePercent: 4.96,
          volume: 8750000000
        },
        {
          symbol: 'ADA',
          name: 'Cardano',
          price: 0.58,
          change: -0.02,
          changePercent: -3.33,
          volume: 450000000
        }
      ];
      
      setMarketData(mockData);
    } catch (err) {
      setError('Failed to load market data');
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Market Data Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadMarketData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Market Overview
          </h3>
          <button
            onClick={loadMarketData}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {marketData.map((asset) => {
          const isPositive = asset.change >= 0;
          
          return (
            <div
              key={asset.symbol}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {asset.symbol}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {asset.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vol: {investmentService.formatCurrency(asset.volume.toString())}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${asset.price.toLocaleString()}
                </p>
                <div className={`flex items-center text-sm ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {isPositive ? '+' : ''}${asset.change.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({asset.changePercent.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketOverview;