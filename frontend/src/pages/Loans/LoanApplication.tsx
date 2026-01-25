import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import loanService, { Currency, LoanCalculation } from '../../services/loanService';

const LoanApplication: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [formData, setFormData] = useState({
    currency: '',
    loanAmount: '',
    durationMonths: '12',
    feePercentage: '2.5',
  });
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFetchingCurrencies, setIsFetchingCurrencies] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Fetch available currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await loanService.getCurrencies();
        setCurrencies(data.filter(c => c.is_active));
      } catch (err) {
        setError('Failed to load currencies. Please refresh the page.');
      } finally {
        setIsFetchingCurrencies(false);
      }
    };

    if (isAuthenticated) {
      fetchCurrencies();
    }
  }, [isAuthenticated]);

  // Calculate loan when parameters change
  useEffect(() => {
    const calculateLoan = async () => {
      if (!formData.currency || !formData.loanAmount || !formData.durationMonths) {
        setCalculation(null);
        return;
      }

      const amount = parseFloat(formData.loanAmount);
      if (isNaN(amount) || amount <= 0) {
        setCalculation(null);
        return;
      }

      setIsCalculating(true);
      try {
        const result = await loanService.calculateLoan({
          currency_id: formData.currency,
          loan_amount: amount,
          duration_months: parseInt(formData.durationMonths),
          fee_percentage: parseFloat(formData.feePercentage),
        });
        setCalculation(result);
      } catch (err) {
        console.error('Calculation error:', err);
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateLoan, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.currency, formData.loanAmount, formData.durationMonths, formData.feePercentage]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to apply for a loan
          </h2>
        </div>
      </div>
    );
  }

  // Check KYC status
  if (user && !user.isKycVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            KYC Verification Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must complete KYC verification before applying for a loan.
          </p>
          <button
            onClick={() => navigate('/kyc')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            Complete KYC
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await loanService.submitApplication({
        currency: formData.currency,
        loan_amount_currency: parseFloat(formData.loanAmount),
        duration_months: parseInt(formData.durationMonths),
        fee_percentage: parseFloat(formData.feePercentage),
      });
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit loan application. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string | number, symbol: string = '$') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your loan application has been submitted successfully. We will review it and notify you within 24-48 hours.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedCurrency = currencies.find(c => c.id === formData.currency);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loans.application.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Apply for a PRN-backed loan with competitive rates
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    required
                    disabled={isFetchingCurrencies}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select Currency</option>
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.id}>
                        {currency.name} ({currency.symbol}) - Rate: {currency.usd_rate} USD
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Amount ({selectedCurrency?.symbol || 'Select currency'}) *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    placeholder="Enter loan amount"
                    min="100"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Duration *
                  </label>
                  <select
                    name="durationMonths"
                    value={formData.durationMonths}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                </div>

                {/* Fee Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Processing Fee (%)
                  </label>
                  <select
                    name="feePercentage"
                    value={formData.feePercentage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="2.5">2.5%</option>
                    <option value="3">3%</option>
                    <option value="3.5">3.5%</option>
                    <option value="4">4%</option>
                    <option value="5">5%</option>
                  </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How PRN Loans Work:</h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>1. Your loan is disbursed in PRN tokens (1 PRN = 1 USD)</li>
                    <li>2. PRN is automatically pledged as collateral</li>
                    <li>3. Make monthly payments to release your PRN</li>
                    <li>4. Loan certificate is generated upon approval</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !calculation}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Loan Calculator Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Loan Summary
              </h3>

              {isCalculating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : calculation ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Loan Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(calculation.loan_amount_currency, calculation.currency.symbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">USD Equivalent</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(calculation.loan_amount_usd)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">PRN to Receive</span>
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {calculation.prn_display}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Processing Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(calculation.fee_amount_usd)} ({calculation.fee_percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {calculation.duration_months} months
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Interest Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {calculation.interest_rate}%
                    </span>
                  </div>

                  <hr className="border-gray-200 dark:border-gray-700" />

                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Monthly Payment</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(calculation.monthly_payment_usd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total Repayment</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(calculation.total_amount_usd)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Enter loan details to see calculation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;
