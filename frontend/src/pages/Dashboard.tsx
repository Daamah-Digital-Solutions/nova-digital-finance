import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import loanService, { DashboardStats as LoanDashboardStats, Payment } from '../services/loanService';
import pronovaService, { PRNWalletBalance } from '../services/pronovaService';
import investmentService, { PortfolioSummary } from '../services/investmentService';

interface DashboardData {
  totalBalance: number;
  activeLoans: number;
  totalInvested: number;
  pendingRequests: number;
  totalBorrowed: number;
  totalPaid: number;
  totalRemaining: number;
  nextPayment: {
    loanNumber: string;
    amount: number;
    dueDate: string;
  } | null;
}

interface RecentActivity {
  id: string;
  type: 'loan_payment' | 'investment' | 'document_signed' | 'loan_approved';
  description: string;
  amount?: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardData>({
    totalBalance: 0,
    activeLoans: 0,
    totalInvested: 0,
    pendingRequests: 0,
    totalBorrowed: 0,
    totalPaid: 0,
    totalRemaining: 0,
    nextPayment: null,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch data from multiple services in parallel
        const [loanStats, walletBalance, portfolioSummary, recentPayments] = await Promise.allSettled([
          loanService.getDashboardStats(),
          pronovaService.getWalletBalance(),
          investmentService.getPortfolioSummary(),
          loanService.getPayments(),
        ]);

        // Process loan stats
        let dashboardData: DashboardData = {
          totalBalance: 0,
          activeLoans: 0,
          totalInvested: 0,
          pendingRequests: 0,
          totalBorrowed: 0,
          totalPaid: 0,
          totalRemaining: 0,
          nextPayment: null,
        };

        if (loanStats.status === 'fulfilled') {
          const data = loanStats.value;
          dashboardData.activeLoans = data.active_loans;
          dashboardData.pendingRequests = data.pending_applications;
          dashboardData.totalBorrowed = parseFloat(data.total_borrowed) || 0;
          dashboardData.totalPaid = parseFloat(data.total_paid) || 0;
          dashboardData.totalRemaining = parseFloat(data.total_remaining) || 0;

          if (data.next_payment) {
            dashboardData.nextPayment = {
              loanNumber: data.next_payment.loan_number,
              amount: parseFloat(data.next_payment.amount) || 0,
              dueDate: data.next_payment.due_date,
            };
          }
        }

        // Process wallet balance (PRN balance = total balance in USD since 1:1)
        if (walletBalance.status === 'fulfilled') {
          dashboardData.totalBalance = parseFloat(walletBalance.value.available_balance) || 0;
        }

        // Process portfolio summary
        if (portfolioSummary.status === 'fulfilled') {
          dashboardData.totalInvested = parseFloat(portfolioSummary.value.total_current_value_usd) || 0;
        }

        setStats(dashboardData);

        // Process recent payments into activity
        const activities: RecentActivity[] = [];

        if (recentPayments.status === 'fulfilled') {
          const payments = recentPayments.value.slice(0, 5); // Get last 5 payments
          payments.forEach((payment: Payment) => {
            activities.push({
              id: payment.id,
              type: 'loan_payment',
              description: `${payment.payment_type === 'fee' ? 'Loan Fee' : 'Installment'} - ${payment.loan_number}`,
              amount: parseFloat(payment.amount_usd),
              date: payment.paid_date || payment.due_date,
              status: payment.status as 'completed' | 'pending' | 'failed',
            });
          });
        }

        // If no activity found, show empty state
        setRecentActivity(activities);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to access your dashboard
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'loan_payment':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'investment':
        return (
          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'document_signed':
        return (
          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'loan_approved':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { name: user?.first_name })}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your finances today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Balance */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {t('dashboard.totalBalance')}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalBalance)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Loans */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {t('dashboard.activeLoans')}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.activeLoans}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Invested */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {t('dashboard.investments')}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalInvested)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Pending Requests
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.pendingRequests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Payment Alert */}
        {stats.nextPayment && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Upcoming Payment Due
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Loan {stats.nextPayment.loanNumber}: {formatCurrency(stats.nextPayment.amount)} due on{' '}
                  {new Date(stats.nextPayment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4">
                <Link
                  to="/loans/payment"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-200 hover:bg-yellow-300 dark:text-yellow-900 dark:bg-yellow-400 dark:hover:bg-yellow-300"
                >
                  Pay Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/apply-loan"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Apply for Loan</h3>
            </Link>

            <Link
              to="/investments"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">View Investments</h3>
            </Link>

            <Link
              to="/documents"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Manage Documents</h3>
            </Link>

            <Link
              to="/loans/payment"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center"
            >
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Make Payment</h3>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('dashboard.recentActivity')}
          </h2>
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  No recent activity yet
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  Your recent transactions and activities will appear here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {activity.amount && (
                          <span className="text-sm font-medium text-gray-900 dark:text-white mr-4">
                            {formatCurrency(activity.amount)}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : activity.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;