import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { requestService, LoanRequest, RequestStatistics } from '../../services/requestService';
import RequestCard from '../../components/Requests/RequestCard';
import RequestFilters from '../../components/Requests/RequestFilters';
import CreateRequestModal from '../../components/Requests/CreateRequestModal';
import { 
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [statistics, setStatistics] = useState<RequestStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadRequestsData();
  }, []);

  const loadRequestsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load requests and statistics in parallel
      const [requestsData, statsData] = await Promise.all([
        requestService.getLoanRequests(),
        requestService.getStatistics()
      ]);
      
      setRequests(requestsData);
      setStatistics(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRequestsData();
  };

  const handleRequestAction = async (action: string, requestId: string) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/requests/${requestId}`);
          break;
        case 'cancel':
          await requestService.cancelRequest(requestId);
          await loadRequestsData(); // Reload data
          break;
        default:
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} request`);
    }
  };

  const handleRequestCreated = () => {
    setShowCreateModal(false);
    loadRequestsData(); // Reload data to show new request
  };

  // Filter requests based on current filters
  const filteredRequests = requests.filter(request => {
    if (filters.type && request.request_type !== filters.type) return false;
    if (filters.status && request.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.request_number.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Requests
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Loan Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your loan modifications, settlements, and deferrals
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Request
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics.total_requests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-500 rounded-full mr-2"></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics.pending_requests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-2"></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics.approved_requests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full mr-2"></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics.rejected_requests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-purple-500 rounded-full mr-2"></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics.completed_requests}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <RequestFilters
            filters={filters}
            onFilterChange={setFilters}
            requestCount={filteredRequests.length}
            totalCount={requests.length}
          />
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <InboxIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {requests.length === 0 ? 'No Requests Yet' : 'No Matching Requests'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {requests.length === 0 
                  ? 'Create your first loan modification request'
                  : 'Try adjusting your filters to find what you\'re looking for'
                }
              </p>
              
              {requests.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Request
                </button>
              )}
              
              {requests.length > 0 && (
                <button
                  onClick={() => setFilters({ type: '', status: '', search: '' })}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAction={handleRequestAction}
              />
            ))}
          </div>
        )}

        {/* Create Request Modal */}
        {showCreateModal && (
          <CreateRequestModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleRequestCreated}
          />
        )}
      </div>
    </div>
  );
};

export default Requests;