import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentService, InvestmentOpportunity } from '../../services/investmentService';
import CreateInvestmentModal from './CreateInvestmentModal';
import { 
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const InvestmentOpportunities: React.FC = () => {
  const navigate = useNavigate();
  
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await investmentService.getInvestmentOpportunities();
      setOpportunities(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load investment opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestClick = (opportunity: InvestmentOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowCreateModal(true);
  };

  const handleInvestmentCreated = () => {
    setShowCreateModal(false);
    setSelectedOpportunity(null);
    // Navigate to investments overview
    navigate('/investments');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading investment opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Opportunities
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadOpportunities}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Investment Opportunities Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need active loans with signed certificates to create investments.
        </p>
        <button
          onClick={() => navigate('/apply-loan')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply for a Loan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Investment Opportunities
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Use your loan certificates as collateral for cryptocurrency investments
          </p>
        </div>
        
        <button
          onClick={loadOpportunities}
          disabled={loading}
          className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {opportunities.map((opportunity) => (
          <div key={opportunity.loan_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Loan #{opportunity.loan_number}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {opportunity.currency_symbol} Certificate
                  </p>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${investmentService.getRiskLevelColor(opportunity.risk_level)}`}>
                  {opportunity.risk_level} Risk
                </div>
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loan Amount</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {investmentService.formatCurrency(opportunity.loan_amount_usd)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available to Invest</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {investmentService.formatCurrency(opportunity.available_for_investment_usd)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Returns */}
            <div className="px-6 pb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Expected Annual Returns
                  </h4>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">
                    {opportunity.expected_return_range.min_annual}% - {opportunity.expected_return_range.max_annual}%
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Annual
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended Assets */}
            <div className="px-6 pb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Recommended Asset Allocation
              </h4>
              
              <div className="space-y-2">
                {opportunity.recommended_assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        {investmentService.getAssetIcon(asset.symbol)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${investmentService.getRiskLevelColor(asset.risk)}`}>
                        {asset.risk}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {asset.allocation}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Information */}
            <div className="px-6 pb-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <div className="flex items-start">
                  <ShieldCheckIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Investment Protection
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Maximum {opportunity.max_investment_percentage}% of loan value can be invested. 
                      Your loan certificate serves as collateral protection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-6 pt-0">
              <button
                onClick={() => handleInvestClick(opportunity)}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Start Investment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Investment Modal */}
      {showCreateModal && selectedOpportunity && (
        <CreateInvestmentModal
          opportunity={selectedOpportunity}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedOpportunity(null);
          }}
          onSuccess={handleInvestmentCreated}
        />
      )}
    </div>
  );
};

export default InvestmentOpportunities;