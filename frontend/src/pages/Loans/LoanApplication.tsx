import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LoanApplication: React.FC = () => {
  const [formData, setFormData] = useState({
    loanType: '',
    amount: '',
    purpose: '',
    term: '',
    collateral: '',
    additionalInfo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Loan application submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loans.application.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Apply for a loan that meets your financial needs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Type *
                </label>
                <select
                  name="loanType"
                  value={formData.loanType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Loan Type</option>
                  <option value="personal">Personal Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="auto">Auto Loan</option>
                  <option value="home">Home Loan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('loans.amount')} *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter loan amount"
                  min="1000"
                  max="1000000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('loans.purpose')} *
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Purpose</option>
                <option value="home-improvement">Home Improvement</option>
                <option value="debt-consolidation">Debt Consolidation</option>
                <option value="education">Education</option>
                <option value="business-expansion">Business Expansion</option>
                <option value="vehicle-purchase">Vehicle Purchase</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('loans.term')} *
              </label>
              <select
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Term</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collateral (if applicable)
              </label>
              <input
                type="text"
                name="collateral"
                value={formData.collateral}
                onChange={handleInputChange}
                placeholder="Describe any collateral"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Information
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any additional information that might help with your application"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Application Process:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Initial review within 24 hours</li>
                <li>• Document verification (1-2 business days)</li>
                <li>• Final approval and funding (2-5 business days)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
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
    </div>
  );
};

export default LoanApplication;