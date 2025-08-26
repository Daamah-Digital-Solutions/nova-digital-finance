import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { loanService } from '../../services/loanService';
import { 
  CurrencyDollarIcon,
  CalendarIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface Currency {
  id: string;
  symbol: string;
  name: string;
  full_name: string;
  description: string;
  is_featured: boolean;
}

interface LoanCalculation {
  currency: {
    id: string;
    name: string;
    symbol: string;
  };
  loan_amount_currency: string;
  loan_amount_usd: string;
  exchange_rate: string;
  duration_months: number;
  fee_percentage: string;
  fee_amount_usd: string;
  total_amount_usd: string;
  monthly_payment_usd: string;
  interest_rate: string;
}

const LoanApplication: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    currency_id: '',
    loan_amount: '',
    duration_months: 12,
    fee_percentage: 2.5,
  });

  useEffect(() => {
    // Allow access if KYC is approved OR under review
    if (authState.user?.kyc_status === 'pending' || authState.user?.kyc_status === 'rejected') {
      navigate('/kyc');
      return;
    }
    loadCurrencies();
  }, [authState.user, navigate]);

  const loadCurrencies = async () => {
    try {
      const response = await loanService.getAvailableCurrencies();
      setCurrencies(response);
      
      // Auto-select USD if available
      const usd = response.find((c: any) => c.symbol === 'USD');
      if (usd) {
        setFormData(prev => ({ ...prev, currency_id: usd.id }));
      }
    } catch (err) {
      setError('Failed to load currencies');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Prevent changing fee percentage - it's fixed at 2.5%
    if (name === 'fee_percentage') {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_months' ? parseInt(value) : value,
    }));
    
    // Clear calculation when inputs change
    if (calculation) {
      setCalculation(null);
    }
    if (error) setError('');
  };

  const calculateLoan = async () => {
    if (!formData.currency_id || !formData.loan_amount) {
      setError('Please select currency and enter loan amount');
      return;
    }

    setCalculating(true);
    setError('');

    try {
      const response = await loanService.calculateLoan({
        currency_id: formData.currency_id,
        loan_amount: formData.loan_amount,
        duration_months: formData.duration_months,
        fee_percentage: formData.fee_percentage,
      });
      setCalculation(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const submitApplication = async () => {
    if (!calculation) {
      setError('Please calculate loan terms first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await loanService.createApplication({
        currency: formData.currency_id,
        loan_amount_currency: formData.loan_amount,
        duration_months: formData.duration_months,
        fee_percentage: formData.fee_percentage,
      });

      if (response.approved) {
        navigate('/loans/payment', { 
          state: { 
            application: response.application,
            message: response.message 
          }
        });
      } else {
        setError(response.message || 'Application was not approved');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCurrency = currencies.find(c => c.id === formData.currency_id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Apply for PRN Token Loan
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Receive PRN tokens (1:1 USD peg) with electronic certificates for Capimax investment
          </p>
        </div>

        {/* KYC Status Info */}
        {authState.user?.kyc_status === 'under_review' && (
          <div className="mb-8 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex">
              <ClockIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  KYC Under Review
                </h3>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  Your KYC is being reviewed. You can apply for loans during this process.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  PRN Token Request
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Specify your PRN token requirements
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
              </div>
            )}

            <div className="space-y-6">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency *
                </label>
                <select
                  name="currency_id"
                  value={formData.currency_id}
                  onChange={handleInputChange}
                  disabled
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                >
                  <option value="">Loading currencies...</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.symbol} - {currency.name}
                      {currency.is_featured && ' ⭐'}
                    </option>
                  ))}
                </select>
                {selectedCurrency && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          PRN Token Issuance (1 PRN = $1.00 USD)
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          You'll receive PRN tokens equivalent to your loan amount in USD value
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PRN Token Amount (USD Equivalent) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="loan_amount"
                    value={formData.loan_amount}
                    onChange={handleInputChange}
                    step="0.00000001"
                    min="0"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter USD amount for PRN tokens"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repayment Period *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={18}>18 months</option>
                    <option value={24}>24 months</option>
                    <option value={36}>36 months</option>
                    <option value={48}>48 months</option>
                    <option value={60}>60 months</option>
                  </select>
                </div>
              </div>

              {/* PRN Benefits */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                  PRN Loan Benefits
                </h4>
                <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Receive PRN tokens with 1:1 USD peg stability
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Get electronic certificate for ownership proof
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Invest on Capimax platform while tokens remain pledged
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    All investment profits belong entirely to you (0% commission)
                  </li>
                </ul>
              </div>

              {/* Fee Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Processing Fee (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="fee_percentage"
                    value={formData.fee_percentage}
                    readOnly
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Fixed processing fee: 2.5%
                </p>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={calculateLoan}
                disabled={calculating || !formData.currency_id || !formData.loan_amount}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {calculating ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                )}
Calculate PRN Terms
              </button>
            </div>
          </div>

          {/* Calculation Results */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  PRN Token Summary
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review your PRN issuance details
                </p>
              </div>
            </div>

            {calculation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      PRN Tokens to Receive
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {parseFloat(calculation.loan_amount_usd).toLocaleString()} PRN
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      = ${parseFloat(calculation.loan_amount_usd).toLocaleString()} USD (1:1 peg)
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Monthly Repayment
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(calculation.monthly_payment_usd).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      0% Interest • Fixed installments
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Processing Fee</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(calculation.fee_amount_usd).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {calculation.fee_percentage}% one-time
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-purple-600 dark:text-purple-400 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Certificate Value
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {parseFloat(calculation.loan_amount_usd).toLocaleString()} PRN
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Capimax investment capacity
                    </div>
                  </div>
                </div>

                {/* Investment Potential Info */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Capimax Investment Ready</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Use your PRN certificate to invest while tokens remain pledged</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      0% Commission
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={submitApplication}
                  disabled={submitting}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {submitting ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  Issue PRN Tokens
                </button>

                {/* PRN Issuance Notice */}
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  By submitting, you agree to receive PRN tokens and electronic certificates.
                  Your tokens will be pledged as loan collateral until repayment completion.
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Calculate PRN Issuance
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter your requirements to see PRN token allocation and certificate details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nova Finance PRN Model */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center mb-4">
            <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              How Nova Finance PRN System Works
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                PRN Token Issuance
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Receive PRN tokens with guaranteed 1:1 USD peg</li>
                <li>• Tokens are pledged as collateral until loan repayment</li>
                <li>• 0% interest loans with only one-time processing fee</li>
                <li>• Flexible repayment terms from 6 to 60 months</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                Investment Opportunities
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Electronic certificates enable Capimax platform access</li>
                <li>• Invest while your PRN tokens remain pledged to Nova</li>
                <li>• All investment profits belong entirely to you (0% commission)</li>
                <li>• Diversified investment options with risk management</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-600 rounded-lg text-white">
            <p className="text-sm font-medium flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Unique Advantage: Earn investment returns while your loan collateral remains secure with Nova Finance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;