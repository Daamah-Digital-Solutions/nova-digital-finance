import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { loanService } from '../services/loanService';
import PRNWalletCard from '../components/PRN/PRNWalletCard';
import CapimaxSummaryCard from '../components/Capimax/CapimaxSummaryCard';
import { 
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  total_applications: number;
  approved_applications: number;
  pending_applications: number;
  rejected_applications: number;
  total_loans: number;
  active_loans: number;
  completed_loans: number;
  total_borrowed_usd: number;
  total_paid_usd: number;
  total_remaining_usd: number;
  next_payment_due: string | null;
  next_payment_amount: number | null;
}

interface UpcomingPayment {
  loan_id: string;
  loan_number: string;
  amount_usd: number;
  due_date: string;
  days_until_due: number;
  is_overdue: boolean;
  remaining_balance: number;
  payments_remaining: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  amount_usd: number;
  created_at: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Try to load data in parallel, but handle failures independently
      const promises = await Promise.allSettled([
        authService.getDashboardData(),
        loanService.getDashboardStats(),
        loanService.getUpcomingPayments(30),
        loanService.getRecentActivity()
      ]);
      
      // Check if loan stats loaded successfully
      if (promises[1].status === 'fulfilled') {
        setStats(promises[1].value);
      } else {
        console.warn('Failed to load loan stats:', promises[1].reason);
        // Set default stats if API fails
        setStats({
          total_applications: 0,
          approved_applications: 0,
          pending_applications: 0,
          rejected_applications: 0,
          total_loans: 0,
          active_loans: 0,
          completed_loans: 0,
          total_borrowed_usd: 0,
          total_paid_usd: 0,
          total_remaining_usd: 0,
          next_payment_due: null,
          next_payment_amount: null
        });
      }
      
      // Load upcoming payments
      if (promises[2].status === 'fulfilled') {
        setUpcomingPayments(promises[2].value.upcoming_payments || []);
      } else {
        console.warn('Failed to load upcoming payments:', promises[2].reason);
        setUpcomingPayments([]);
      }
      
      // Load recent activity
      if (promises[3].status === 'fulfilled') {
        try {
          const recentData = promises[3].value;
          // Handle both array and object responses
          let paymentsArray = [];
          
          if (Array.isArray(recentData)) {
            paymentsArray = recentData;
          } else if (recentData && typeof recentData === 'object') {
            paymentsArray = recentData.results || recentData.payments || recentData.data || [];
          }
          
          // Ensure paymentsArray is actually an array
          if (!Array.isArray(paymentsArray)) {
            console.warn('Recent activity data is not an array:', paymentsArray);
            paymentsArray = [];
          }
          
          const activities = paymentsArray.slice(0, 5).map((payment: any) => ({
            id: payment.id || `activity-${Date.now()}-${Math.random()}`,
            type: payment.payment_type || 'payment',
            description: `Payment for ${payment.loan?.loan_number || payment.loan_number || 'loan'}`,
            amount_usd: parseFloat(payment.amount_usd) || 0,
            created_at: payment.created_at || payment.paid_date || new Date().toISOString(),
            status: payment.status || 'unknown'
          }));
          setRecentActivity(activities);
        } catch (error) {
          console.error('Error processing recent activity:', error);
          setRecentActivity([]);
        }
      } else {
        console.warn('Failed to load recent activity:', promises[3].reason);
        setRecentActivity([]);
      }
      
      // If critical data failed, show error
      if (promises[0].status === 'rejected' && promises[1].status === 'rejected') {
        setError('Unable to load dashboard data. Please try refreshing the page.');
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('An unexpected error occurred. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallmentPayment = async (loanId: string) => {
    try {
      setPaymentLoading(loanId);
      const result = await loanService.createInstallmentPayment(loanId);
      
      if (result.payment_intent) {
        // For now, navigate to a payment page or show success
        // In a real implementation, you'd integrate with Stripe
        alert('Payment initiated successfully!');
        await loadDashboardData(); // Refresh data
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(null);
    }
  };

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Verified
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ClockIcon className="w-4 h-4 mr-1" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {authState.user?.username}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's an overview of your Nova Finance account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* KYC Status Card */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Account Verification Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Client ID: {authState.user?.client_number}
              </p>
            </div>
            <div>
              {getKYCStatusBadge(authState.user?.kyc_status || 'pending')}
            </div>
          </div>
          
          {!authState.user?.is_kyc_verified && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {authState.user?.kyc_status === 'pending' 
                    ? 'Complete your KYC verification to access all platform features'
                    : authState.user?.kyc_status === 'under_review'
                    ? 'Your KYC is under review. You will be notified once approved.'
                    : 'Complete your KYC verification to access all platform features'
                  }
                </p>
              </div>
              {authState.user?.kyc_status === 'pending' && (
                <Link
                  to="/kyc"
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-yellow-800 bg-yellow-200 hover:bg-yellow-300 dark:text-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60"
                >
                  Complete Verification
                </Link>
              )}
              {authState.user?.kyc_status === 'under_review' && (
                <div className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-800 bg-blue-200 dark:text-blue-200 dark:bg-blue-900/40">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Under Review
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRN & Capimax Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PRNWalletCard />
          <CapimaxSummaryCard />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/apply-loan"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Apply for PRN Loan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get PRN tokens (1:1 USD peg)
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/invest"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Capimax Investment
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Invest with PRN certificates
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/payments"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Pay Installment
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Make loan payments
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/documents"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <DocumentTextIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  PRN Documents
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Certificates & contracts
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Borrowed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PRN Issued (USD)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.total_borrowed_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ~{stats.total_borrowed_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} PRN
                  </p>
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.active_loans}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.total_paid_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.total_remaining_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay Installments Section */}
        {upcomingPayments.length > 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Pay Installments
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {upcomingPayments.length} payment{upcomingPayments.length !== 1 ? 's' : ''} due
              </span>
            </div>
            
            <div className="space-y-4">
              {upcomingPayments.slice(0, 3).map((payment) => {
                const daysUntil = payment.days_until_due;
                const isOverdue = payment.is_overdue;
                const isDueSoon = daysUntil <= 7 && daysUntil >= 0;
                
                return (
                  <div key={payment.loan_id} className={`p-4 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                      : isDueSoon 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CreditCardIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {payment.loan_number}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {isOverdue 
                                ? `Overdue by ${Math.abs(daysUntil)} days` 
                                : daysUntil === 0 
                                  ? 'Due today'
                                  : `Due in ${daysUntil} days`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${payment.amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {payment.payments_remaining} payments remaining
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInstallmentPayment(payment.loan_id)}
                        disabled={paymentLoading === payment.loan_id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isOverdue 
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : isDueSoon 
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {paymentLoading === payment.loan_id ? 'Processing...' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {upcomingPayments.length > 3 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  +{upcomingPayments.length - 3} more payments
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'fee':
                      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
                    case 'installment':
                      return <CreditCardIcon className="h-5 w-5 text-green-500" />;
                    default:
                      return <BanknotesIcon className="h-5 w-5 text-gray-500" />;
                  }
                };
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'completed':
                      return 'text-green-600 dark:text-green-400';
                    case 'pending':
                      return 'text-yellow-600 dark:text-yellow-400';
                    case 'failed':
                      return 'text-red-600 dark:text-red-400';
                    default:
                      return 'text-gray-600 dark:text-gray-400';
                  }
                };
                
                return (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${activity.amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : stats && stats.total_applications > 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No recent activity
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Your payment and loan activity will appear here
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Welcome to Nova Finance!
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Start by applying for your first PRN loan and get digital certificates to invest on Capimax
                </p>
                <Link
                  to="/apply-loan"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  Apply Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;