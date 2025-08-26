import React, { useState } from 'react';
import { Document, documentService } from '../../services/documentService';
import { 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilSquareIcon,
  EyeIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentCardProps {
  document: Document;
  onAction: (action: string, documentId: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onAction }) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      await onAction(action, document.id);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <ClockIcon className="w-4 h-4" />;
      case 'generated':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'signed':
        return <CheckBadgeIcon className="w-4 h-4" />;
      case 'delivered':
        return <ShareIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = documentService.getStatusColor(status);
    switch (colors) {
      case 'gray':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">
                  {documentService.getDocumentTypeIcon(document.document_type)}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {document.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {document.document_number}
              </p>
            </div>
          </div>
          
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(document.status)}`}>
            {getStatusIcon(document.status)}
            <span className="ml-1">{document.status_display}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        <div className="space-y-3">
          {/* Created Date */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>Created {formatDate(document.created_at)}</span>
          </div>

          {/* Signature Status */}
          {document.signature_timestamp && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckBadgeIcon className="w-4 h-4 mr-2" />
              <span>Signed {formatDate(document.signature_timestamp)}</span>
            </div>
          )}

          {/* Email Status */}
          {document.email_sent && document.email_sent_at && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <ShareIcon className="w-4 h-4 mr-2" />
              <span>Emailed {formatDate(document.email_sent_at)}</span>
            </div>
          )}

          {/* Expiry Warning */}
          {document.expires_at && new Date(document.expires_at) < new Date() && (
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              <span>Expired {formatDate(document.expires_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {/* View Action */}
            <button
              onClick={() => handleAction('view')}
              disabled={actionLoading === 'view'}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </button>

            {/* Download Action */}
            {documentService.canDownload(document) && (
              <button
                onClick={() => handleAction('download')}
                disabled={actionLoading === 'download'}
                className="flex items-center px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Download
              </button>
            )}

            {/* Sign Action */}
            {documentService.canSign(document) && (
              <button
                onClick={() => handleAction('sign')}
                disabled={actionLoading === 'sign'}
                className="flex items-center px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 border border-green-300 dark:border-green-600 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
              >
                <PencilSquareIcon className="w-4 h-4 mr-1" />
                Sign
              </button>
            )}
          </div>

          {/* Share Action */}
          {documentService.canShare(document) && (
            <button
              onClick={() => handleAction('share')}
              disabled={actionLoading === 'share'}
              className="flex items-center px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
            >
              <ShareIcon className="w-4 h-4 mr-1" />
              Share
            </button>
          )}
        </div>

        {/* Loading State */}
        {actionLoading && (
          <div className="mt-3 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {actionLoading === 'download' ? 'Downloading...' : 
               actionLoading === 'view' ? 'Loading...' : 
               actionLoading === 'sign' ? 'Preparing signature...' : 
               actionLoading === 'share' ? 'Creating share link...' : 
               'Processing...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;