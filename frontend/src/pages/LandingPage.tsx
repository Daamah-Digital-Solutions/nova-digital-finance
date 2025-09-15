import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-24 lg:pb-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Your Financial Future Starts with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Nova Finance
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Experience the future of digital banking with secure loans, smart investments, 
              and seamless financial management - all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Get Started
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-700 dark:text-primary-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Go to Dashboard
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Financial Success
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Our comprehensive financial platform provides all the tools you need to manage, grow, and protect your wealth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Loans */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Smart Loans</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant loan approvals with competitive rates and flexible terms tailored to your financial needs.
              </p>
            </div>

            {/* Feature 2 - Investments */}
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Investment Opportunities</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover curated investment opportunities with real-time market insights and portfolio management tools.
              </p>
            </div>

            {/* Feature 3 - Security */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Bank-Grade Security</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your financial data is protected with advanced encryption and multi-factor authentication systems.
              </p>
            </div>

            {/* Feature 4 - Digital Documents */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Digital Documents</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign, store, and manage all your financial documents digitally with legally binding e-signatures.
              </p>
            </div>

            {/* Feature 5 - 24/7 Support */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.944l5.652 5.653m0 5.653L12 21.056m-5.652-5.653L12 2.944m0 18.112L6.348 15.403" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get help whenever you need it with our round-the-clock customer support team and AI-powered assistance.
              </p>
            </div>

            {/* Feature 6 - Mobile First */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Mobile First</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access your finances anywhere, anytime with our responsive design and Progressive Web App technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Financial Future?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Join thousands of satisfied customers who have already started their journey with Nova Finance.
            </p>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-white hover:bg-gray-50 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Start Your Journey Today
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;