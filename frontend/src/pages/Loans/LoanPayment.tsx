import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LoanPayment: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedLoan, setSelectedLoan] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loans, setLoans] = useState([
    { id: '1', type: 'Personal Loan', balance: 5000, nextPayment: 250, dueDate: '2024-02-15' },
    { id: '2', type: 'Business Loan', balance: 15000, nextPayment: 750, dueDate: '2024-02-20' }
  ]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to make a payment
          </h2>
        </div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Payment submitted successfully!');
      setPaymentAmount('');
    } catch (err) {
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loans.payment.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Make payments on your active loans
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Loans */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Active Loans</h2>
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{loan.type}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Due: {loan.dueDate}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Balance:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${loan.balance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Next Payment:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${loan.nextPayment.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLoan(loan.id);
                      setPaymentAmount(loan.nextPayment.toString());
                    }}
                    className="mt-3 w-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                  >
                    Make Payment
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Make a Payment</h2>
            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Loan
                </label>
                <select
                  value={selectedLoan}
                  onChange={(e) => setSelectedLoan(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a loan</option>
                  {loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.type} - ${loan.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  min="10"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="debit-card">Debit Card</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedLoan || !paymentAmount}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </div>
                ) : (
                  'Submit Payment'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanPayment;