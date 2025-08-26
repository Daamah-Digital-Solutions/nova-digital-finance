import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { documentService, Document } from '../../services/documentService';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  CalendarIcon,
  UserIcon,
  HashtagIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (documentId: string) => {
    try {
      setLoading(true);
      setError('');
      const doc = await documentService.getDocument(documentId);
      setDocument(doc);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!document) return;

    setActionLoading(action);
    try {
      switch (action) {
        case 'download':
          const blob = await documentService.downloadDocument(document.id);
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = `${document.document_number}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          break;
        case 'share':
          navigate(`/documents/${document.id}/share`);
          break;
        case 'sign':
          navigate(`/documents/${document.id}/sign`);
          break;
        case 'send_email':
          await documentService.sendDocumentEmail(document.id);
          // Reload document to update email status
          await loadDocument(document.id);
          break;
        default:
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} document`);
    } finally {
      setActionLoading(null);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Document Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'The requested document could not be found.'}
              </p>
              <button
                onClick={() => navigate('/documents')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Documents
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">
                  {documentService.getDocumentTypeIcon(document.document_type)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {document.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {document.document_type_display}
                </p>
              </div>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
              <CheckBadgeIcon className="w-4 h-4 mr-1" />
              {document.status_display}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Document Information
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <HashtagIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Document Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {document.document_number}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {document.user.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(document.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {document.signature_timestamp && (
                    <div className="flex items-center">
                      <CheckBadgeIcon className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Signed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(document.signature_timestamp)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Data Display */}
                {document.generated_data && Object.keys(document.generated_data).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                      Document Details
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {Object.entries(document.generated_data).map(([key, value]) => (
                          <div key={key}>
                            <dt className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </dt>
                            <dd className="text-gray-900 dark:text-white mt-1">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              
              <div className="space-y-3">
                {/* Download */}
                {documentService.canDownload(document) && (
                  <button
                    onClick={() => handleAction('download')}
                    disabled={actionLoading === 'download'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    {actionLoading === 'download' ? 'Downloading...' : 'Download PDF'}
                  </button>
                )}

                {/* Sign */}
                {documentService.canSign(document) && (
                  <button
                    onClick={() => handleAction('sign')}
                    disabled={actionLoading === 'sign'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    {actionLoading === 'sign' ? 'Loading...' : 'Sign Document'}
                  </button>
                )}

                {/* Send Email */}
                <button
                  onClick={() => handleAction('send_email')}
                  disabled={actionLoading === 'send_email'}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  {actionLoading === 'send_email' ? 'Sending...' : 
                   document.email_sent ? 'Send Again' : 'Send via Email'}
                </button>

                {/* Share */}
                {documentService.canShare(document) && (
                  <button
                    onClick={() => handleAction('share')}
                    disabled={actionLoading === 'share'}
                    className="w-full flex items-center justify-center px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 transition-colors"
                  >
                    <ShareIcon className="w-4 h-4 mr-2" />
                    {actionLoading === 'share' ? 'Creating...' : 'Create Share Link'}
                  </button>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status Information
              </h3>
              
              <div className="space-y-3 text-sm">
                {document.email_sent && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckBadgeIcon className="w-4 h-4 mr-2" />
                    <span>Email sent {document.email_sent_at && formatDate(document.email_sent_at)}</span>
                  </div>
                )}
                
                {document.expires_at && (
                  <div className={`flex items-center ${
                    new Date(document.expires_at) < new Date() 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(document.expires_at) < new Date() ? 'Expired' : 'Expires'} {formatDate(document.expires_at)}
                    </span>
                  </div>
                )}
                
                <div className="text-gray-600 dark:text-gray-400">
                  <span>Last updated {formatDate(document.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;