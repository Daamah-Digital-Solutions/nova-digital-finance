import React from 'react';
import { LoanRequest, requestService } from '../../services/requestService';
import { 
  EyeIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface RequestCardProps {
  request: LoanRequest;
  onAction: (action: string, requestId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onAction }) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'under_review':
        return <ClockIcon className="w-4 h-4" />;
      case 'approved':
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-3">
              {requestService.getRequestTypeIcon(request.request_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {request.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {request.request_number}
              </p>
            </div>
          </div>
          
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requestService.getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            <span className="ml-1">{request.status_display}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        {/* Request Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Loan:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {request.loan.loan_number}
            </span>
          </div>

          {request.requested_amount_usd && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {requestService.formatCurrency(request.requested_amount_usd)}
              </span>
            </div>
          )}

          {request.fee_amount_usd && parseFloat(request.fee_amount_usd) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fee:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {requestService.formatCurrency(request.fee_amount_usd)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Requested:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {requestService.formatDate(request.requested_at)}
            </span>
          </div>

          {request.priority !== 'medium' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Priority:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${requestService.getPriorityColor(request.priority)}`}>
                {request.priority_display}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {request.description && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {request.description}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onAction('view', request.id)}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View Details
          </button>

          {requestService.canCancelRequest(request) && (
            <button
              onClick={() => onAction('cancel', request.id)}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;