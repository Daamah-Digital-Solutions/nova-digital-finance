import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useLanguage } from '../../contexts/LanguageContext';
import { paymentService } from '../../services/paymentService';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Load Stripe (in production, use your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key');

interface PaymentFormProps {
  paymentIntent: {
    id: string;
    amount_usd: string;
    fee_amount: string;
    purpose: string;
    client_secret: string;
    test_mode?: boolean;
  };
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

// Test mode payment component (no Stripe hooks)
const TestModePaymentContent: React.FC<PaymentFormProps> = ({
  paymentIntent,
  onSuccess,
  onError
}) => {
  const { t } = useLanguage();
  
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setError('');

    try {
      // Handle test mode payment - bypass Stripe entirely
      setTimeout(() => {
        setSucceeded(true);
        onSuccess({
          status: 'succeeded',
          test_mode: true,
          message: 'Test payment completed successfully'
        });
        setProcessing(false);
      }, 2000); // Simulate processing time
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment processing failed');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <CreditCardIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Complete Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {paymentIntent.purpose === 'loan_fee' ? 'Loan Processing Fee' : 'Installment Payment'}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${parseFloat(paymentIntent.amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${parseFloat(paymentIntent.fee_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              ${(parseFloat(paymentIntent.amount_usd) + parseFloat(paymentIntent.fee_amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      {succeeded ? (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment has been processed successfully.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Test Mode: Click "Pay" to simulate a successful payment (no real money will be charged)
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing || succeeded}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Simulating Payment...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Test Payment ${(parseFloat(paymentIntent.amount_usd) + parseFloat(paymentIntent.fee_amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Test mode: No real payment will be processed
            </p>
          </div>
        </form>
      )}

      {/* Security Badges */}
      <div className="mt-6 flex justify-center items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          SSL Encrypted
        </span>
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Stripe Verified
        </span>
      </div>
    </div>
  );
};

// Real Stripe payment component (with Stripe hooks)
const StripePaymentContent: React.FC<PaymentFormProps> = ({
  paymentIntent,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (methodError) {
        setError(methodError.message || 'Payment method creation failed');
        setProcessing(false);
        return;
      }

      // Confirm payment with our backend
      const result = await paymentService.confirmPayment({
        payment_intent_id: paymentIntent.id,
        stripe_payment_method_id: paymentMethod.id
      });

      if (result.status === 'succeeded') {
        setSucceeded(true);
        onSuccess(result);
      } else if (result.requires_action && result.client_secret) {
        // Handle 3D Secure or other authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed');
        } else {
          setSucceeded(true);
          onSuccess(result);
        }
      } else {
        setError(result.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment processing failed');
    }

    setProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <CreditCardIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Complete Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {paymentIntent.purpose === 'loan_fee' ? 'Loan Processing Fee' : 'Installment Payment'}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${parseFloat(paymentIntent.amount_usd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${parseFloat(paymentIntent.fee_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              ${(parseFloat(paymentIntent.amount_usd) + parseFloat(paymentIntent.fee_amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      {succeeded ? (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment has been processed successfully.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <button
            type="submit"
            disabled={!stripe || processing || succeeded}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Pay ${(parseFloat(paymentIntent.amount_usd) + parseFloat(paymentIntent.fee_amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your payment is secured by Stripe. We never store your card details.
            </p>
          </div>
        </form>
      )}

      {/* Security Badges */}
      <div className="mt-6 flex justify-center items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          SSL Encrypted
        </span>
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Stripe Verified
        </span>
      </div>
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  // If in test mode, use test component without Stripe hooks
  if (props.paymentIntent.test_mode) {
    return <TestModePaymentContent {...props} />;
  }
  
  // For real payments, wrap with Stripe Elements
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentContent {...props} />
    </Elements>
  );
};

export default PaymentForm;