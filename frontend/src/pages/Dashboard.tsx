import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardStats {
  totalBalance: number;
  activeLoans: number;
  totalInvested: number;
  pendingRequests: number;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    activeLoans: 0,
    totalInvested: 0,
    pendingRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalBalance: 15750.00,
        activeLoans: 2,
        totalInvested: 8500.00,
        pendingRequests: 1,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'loan_payment',
          description: 'Personal Loan Payment',
          amount: 450.00,
          date: '2024-01-15',
          status: 'completed',
        },
        {
          id: '2',
          type: 'investment',
          description: 'Tech Stock Investment',
          amount: 1200.00,
          date: '2024-01-14',
          status: 'completed',
        },
        {
          id: '3',
          type: 'document_signed',
          description: 'Loan Agreement Signed',
          date: '2024-01-13',
          status: 'completed',
        },
        {
          id: '4',
          type: 'loan_approved',
          description: 'Business Loan Approved',
          amount: 5000.00,
          date: '2024-01-12',
          status: 'completed',
        },
      ]);
      
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { name: user?.firstName })}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;