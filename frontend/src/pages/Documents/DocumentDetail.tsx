import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && id) {
      // Simulate loading document
      setTimeout(() => {
        setDocument({
          id: id,
          title: 'Personal Loan Agreement',
          type: 'loan_agreement',
          status: 'signed',
          createdDate: '2024-01-15',
          size: '1.2 MB',
          content: 'This is a sample document content. In a real application, this would contain the actual document content or a PDF viewer.'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [isAuthenticated, id]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view this document
          </h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Document not found
          </h2>
          <Link
            to="/documents"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            ← Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/documents"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 mb-4 inline-block"
          >
            ← Back to Documents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {document.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Created: {new Date(document.createdDate).toLocaleDateString()}</span>
            <span>Size: {document.size}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              document.status === 'signed' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {document.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Download
          </button>
          {document.status === 'pending' && (
            <Link
              to={`/documents/${document.id}/sign`}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Sign Document
            </Link>
          )}
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* Document Viewer */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 min-h-96">
          <div className="text-center py-12">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Document Preview</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {document.content}
            </p>
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                In a production environment, this would display the actual document content using a PDF viewer or similar component.
              </p>
            </div>
          </div>
        </div>

        {/* Document History */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Document History</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Document signed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">January 15, 2024 at 3:45 PM</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Document sent for signature</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">January 14, 2024 at 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Document created</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">January 14, 2024 at 9:15 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;