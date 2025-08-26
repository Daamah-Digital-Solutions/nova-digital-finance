import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { paymentService } from '../../services/paymentService';
import PaymentForm from '../../components/Payment/PaymentForm';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface LoanApplication {
  id: string;
  currency_name: string;
  currency_symbol: string;
  loan_amount_currency: string;
  loan_amount_usd: string;
  fee_amount_usd: string;
  monthly_payment_usd: string;
  total_payment_usd: string;
  duration_months: number;
  status: string;
}

const LoanPayment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();
  
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  useEffect(() => {
    // Get application data from navigation state
    const locationState = location.state as any;
    if (locationState?.application) {
      setApplication(locationState.application);
      setLoading(false);
    } else {
      setError('Application data not found');
      setLoading(false);
    }
  }, [location]);

  const proceedToPayment = async () => {
    if (!application) return;

    setLoading(true);
    setError('');

    try {
      const response = await paymentService.createLoanFeePayment(application.id);
      setPaymentIntent(response.payment_intent);
      setStep('payment');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: any) => {
    setStep('success');
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Loan Payment
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete your payment to activate your loan and receive your PRN tokens
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'review' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                {step === 'review' ? '1' : <CheckCircleIcon className="w-5 h-5" />}
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
            
            <div className={`w-12 h-0.5 ${step !== 'review' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${
              step === 'payment' ? 'text-blue-600' : 
              step === 'success' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                step === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {step === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            
            <div className={`w-12 h-0.5 ${step === 'success' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {step === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : '3'}
              </div>
              <span className="ml-2 font-medium">Complete</span>
            </div>
          </div>
        </div>

        {step === 'review' && application && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Loan Application Approved!
                </h2>
                <p className="text-green-600 dark:text-green-400 mt-2 font-medium">
                  Congratulations! Your loan has been approved.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Loan Details */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Loan Amount</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {parseFloat(application.loan_amount_currency).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} PRN
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${parseFloat(application.loan_amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Monthly Payment</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      ${parseFloat(application.monthly_payment_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Over {application.duration_months} months
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Processing Fee</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      ${parseFloat(application.fee_amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">One-time fee</div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Loan Cost</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      ${parseFloat(application.total_payment_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Including fee</div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Payment Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-700 dark:text-gray-300">Loan Amount (PRN)</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${parseFloat(application.loan_amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-700 dark:text-gray-300">Processing Fee</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${parseFloat(application.fee_amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <hr className="border-gray-300 dark:border-gray-600" />
                    <div className="flex items-center justify-between py-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total Payment</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">${parseFloat(application.total_payment_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>

                {/* Terms Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Loan Terms</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Interest Rate: 0% (Interest-free financing)</li>
                    <li>• Loan Duration: {application.duration_months} months</li>
                    <li>• Currency: Pronova (PRN) 1:1 USD</li>
                    <li>• Monthly Payment: ${parseFloat(application.monthly_payment_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</li>
                    <li>• One-time upfront payment for full loan + processing fee</li>
                  </ul>
                </div>

                <div className="text-center">
                  <button
                    onClick={proceedToPayment}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <CreditCardIcon className="w-5 h-5 mr-2" />
                    )}
                    Proceed to Payment
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Secure payment processing powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && paymentIntent && (
          <PaymentForm
            paymentIntent={paymentIntent}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}

        {step === 'success' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                Payment Successful!
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Your loan has been activated. You can now use your cryptocurrency certificate for investments.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={() => navigate('/investments')}
                  className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Investing on Capimax
                </button>
                
                <button
                  onClick={() => navigate('/documents')}
                  className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View Documents & Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPayment;