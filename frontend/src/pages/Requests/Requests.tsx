import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface Request {
  id: string;
  type: 'loan' | 'investment' | 'account' | 'support';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdDate: string;
  updatedDate: string;
  assignee?: string;
}

const Requests: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Simulate loading requests
      setTimeout(() => {
        setRequests([
          {
            id: '1',
            type: 'loan',
            title: 'Personal Loan Application Review',
            description: 'Requesting review of my personal loan application submitted on January 15th.',
            status: 'in_progress',
            priority: 'high',
            createdDate: '2024-01-16',
            updatedDate: '2024-01-17',
            assignee: 'John Smith'
          },
          {
            id: '2',
            type: 'account',
            title: 'Update Account Information',
            description: 'Need to update my address and phone number in the system.',
            status: 'completed',
            priority: 'medium',
            createdDate: '2024-01-10',
            updatedDate: '2024-01-11'
          },
          {
            id: '3',
            type: 'investment',
            title: 'Portfolio Rebalancing Request',
            description: 'Request to rebalance my investment portfolio based on updated risk assessment.',
            status: 'pending',
            priority: 'medium',
            createdDate: '2024-01-20',
            updatedDate: '2024-01-20'
          },
          {
            id: '4',
            type: 'support',
            title: 'Technical Issue with Mobile App',
            description: 'Experiencing login issues with the mobile application.',
            status: 'pending',
            priority: 'high',
            createdDate: '2024-01-22',
            updatedDate: '2024-01-22'
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your requests
          </h2>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'investment':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'account':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'support':
        return (
          <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.944l5.652 5.653m0 5.653L12 21.056m-5.652-5.653L12 2.944m0 18.112L6.348 15.403" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(req => req.status === filter);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Support Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and manage your support requests and inquiries
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              New Request
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {requests.filter(r => r.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                {status === 'all' && ` (${requests.length})`}
                {status !== 'all' && ` (${requests.filter(req => req.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(request.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {request.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {request.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <span>Created: {new Date(request.createdDate).toLocaleDateString()}</span>
                          <span>Updated: {new Date(request.updatedDate).toLocaleDateString()}</span>
                          {request.assignee && (
                            <span>Assigned to: {request.assignee}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200">
                        View Details
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No requests found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'You don\'t have any requests yet.' : `No requests with status "${filter.replace('_', ' ')}".`}
              </p>
            </div>
          )}
        </div>

        {/* New Request Modal Placeholder */}
        {showNewRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Create New Request
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This would open a form to create a new support request.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;