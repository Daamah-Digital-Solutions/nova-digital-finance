import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface DocumentFiltersProps {
  filters: {
    type: string;
    status: string;
    search: string;
  };
  onFilterChange: (filters: { type: string; status: string; search: string }) => void;
  documentCount: number;
  totalCount: number;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onFilterChange,
  documentCount,
  totalCount
}) => {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ type: '', status: '', search: '' });
  };

  const hasActiveFilters = filters.type || filters.status || filters.search;

  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'loan_certificate', label: 'Loan Certificates' },
    { value: 'financing_contract', label: 'Financing Contracts' },
    { value: 'kyc_report', label: 'KYC Reports' },
    { value: 'payment_receipt', label: 'Payment Receipts' },
    { value: 'investment_certificate', label: 'Investment Certificates' }
  ];

  const documentStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'generated', label: 'Generated' },
    { value: 'signed', label: 'Signed' },
    { value: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filter Documents
          </h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {documentCount} of {totalCount} documents
          </span>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Document Type Filter */}
        <div>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {documentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
              Active Filters:
            </span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50"
                >
                  <XCircleIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Type: {documentTypes.find(t => t.value === filters.type)?.label}
                <button
                  onClick={() => handleFilterChange('type', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50"
                >
                  <XCircleIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Status: {documentStatuses.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/50"
                >
                  <XCircleIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFilters;