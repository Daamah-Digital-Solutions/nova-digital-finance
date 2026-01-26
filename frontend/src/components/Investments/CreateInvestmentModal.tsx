import React, { useState } from 'react';
import investmentService, { InvestmentOpportunity } from '../../services/investmentService';
import { 
  XMarkIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface CreateInvestmentModalProps {
  opportunity: InvestmentOpportunity;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvestmentModal: React.FC<CreateInvestmentModalProps> = ({
  opportunity,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    asset_symbol: opportunity.recommended_assets[0]?.symbol || 'BTC',
    investment_amount_usd: '',
    strategy: 'balanced'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const strategies = [
    { value: 'conservative', label: 'Conservative Growth', description: 'Lower risk, steady returns' },
    { value: 'moderate', label: 'Moderate Growth', description: 'Balanced risk and return' },
    { value: 'balanced', label: 'Balanced Portfolio', description: 'Diversified approach' },
    { value: 'aggressive', label: 'Aggressive Growth', description: 'Higher risk, higher potential returns' },
    { value: 'income', label: 'Income Focused', description: 'Focus on regular income generation' }
  ];

  const maxAmount = parseFloat(opportunity.available_for_investment_usd);
  const minAmount = 10; // Minimum $10 investment

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    const amount = parseFloat(formData.investment_amount_usd);
    
    if (!formData.investment_amount_usd) {
      setError('Investment amount is required');
      return false;
    }
    
    if (isNaN(amount) || amount <= 0) {
      setError('Investment amount must be a positive number');
      return false;
    }
    
    if (amount < minAmount) {
      setError(`Minimum investment amount is $${minAmount}`);
      return false;
    }
    
    if (amount > maxAmount) {
      setError(`Maximum investment amount is $${maxAmount.toLocaleString()}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError('');
      
      await investmentService.createInvestmentPosition({
        loan_id: opportunity.loan_id,
        asset_symbol: formData.asset_symbol,
        investment_amount_usd: formData.investment_amount_usd,
        strategy: formData.strategy
      });
      
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create investment position');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = opportunity.recommended_assets.find(
    asset => asset.symbol === formData.asset_symbol
  );

  const selectedStrategy = strategies.find(s => s.value === formData.strategy);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {step === 'form' ? 'Create Investment' : 
             step === 'confirm' ? 'Confirm Investment' : 
             'Investment Created'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Loan Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Using Loan Certificate
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p>Loan #{opportunity.loan_number}</p>
                  <p>Available: {investmentService.formatCurrency(opportunity.available_for_investment_usd)}</p>
                </div>
              </div>

              {/* Asset Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Asset
                </label>
                <select
                  name="asset_symbol"
                  value={formData.asset_symbol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {opportunity.recommended_assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol}) - {asset.allocation}% allocation
                    </option>
                  ))}
                </select>
                
                {selectedAsset && (
                  <div className="mt-2 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${investmentService.getRiskLevelColor(selectedAsset.risk)}`}>
                      {selectedAsset.risk} Risk
                    </span>
                  </div>
                )}
              </div>

              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investment Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="investment_amount_usd"
                    value={formData.investment_amount_usd}
                    onChange={handleInputChange}
                    min={minAmount}
                    max={maxAmount}
                    step="0.01"
                    placeholder={`${minAmount} - ${maxAmount.toLocaleString()}`}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Min: ${minAmount}</span>
                  <span>Max: ${maxAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investment Strategy
                </label>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {strategies.map((strategy) => (
                    <option key={strategy.value} value={strategy.value}>
                      {strategy.label}
                    </option>
                  ))}
                </select>
                
                {selectedStrategy && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {selectedStrategy.description}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Review Investment
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Investment Summary
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Asset:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedAsset?.name} ({formData.asset_symbol})
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {investmentService.formatCurrency(formData.investment_amount_usd)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Strategy:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedStrategy?.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Collateral:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Loan #{opportunity.loan_number}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Important Notice
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Cryptocurrency investments are subject to market volatility. Your loan certificate 
                      serves as collateral for this investment. You may lose some or all of your investment.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Confirm Investment'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Investment Created Successfully!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Your investment position has been created and is now active. 
                  You can monitor its performance in your portfolio.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-medium mb-1">Investment Details:</p>
                  <p>{investmentService.formatCurrency(formData.investment_amount_usd)} invested in {selectedAsset?.name}</p>
                  <p>Using {selectedStrategy?.label} strategy</p>
                </div>
              </div>

              <button
                onClick={onSuccess}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Portfolio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvestmentModal;