import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'signed' | 'completed' | 'expired';
  createdDate: string;
  dueDate?: string;
  size?: string;
}

const Documents: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      // Simulate loading documents
      setTimeout(() => {
        setDocuments([
          {
            id: '1',
            title: 'Personal Loan Agreement',
            type: 'loan_agreement',
            status: 'signed',
            createdDate: '2024-01-15',
            size: '1.2 MB'
          },
          {
            id: '2',
            title: 'KYC Documentation',
            type: 'kyc_document',
            status: 'completed',
            createdDate: '2024-01-10',
            size: '850 KB'
          },
          {
            id: '3',
            title: 'Investment Portfolio Review',
            type: 'investment_document',
            status: 'pending',
            createdDate: '2024-01-20',
            dueDate: '2024-02-20',
            size: '2.1 MB'
          },
          {
            id: '4',
            title: 'Tax Document - 1099',
            type: 'tax_document',
            status: 'completed',
            createdDate: '2024-01-01',
            size: '450 KB'
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
            Please sign in to view your documents
          </h2>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'signed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'loan_agreement':
        return (
          <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'investment_document':
        return (
          <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'tax_document':
        return (
          <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const filteredDocuments = filter === 'all' ? documents : documents.filter(doc => doc.status === filter);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('documents.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and access all your financial documents in one place
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'signed', 'completed', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${documents.length})`}
                {status !== 'all' && ` (${documents.filter(doc => doc.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {t('documents.upload')}
          </button>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getDocumentIcon(document.type)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {document.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {document.size}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(document.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                  {document.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Due:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(document.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/documents/${document.id}`}
                    className="flex-1 text-center py-2 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm font-medium"
                  >
                    {t('common.view')}
                  </Link>
                  {document.status === 'pending' && (
                    <Link
                      to={`/documents/${document.id}/sign`}
                      className="flex-1 text-center py-2 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-sm font-medium"
                    >
                      {t('documents.sign')}
                    </Link>
                  )}
                  <button className="py-2 px-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No documents found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'You don\'t have any documents yet.' : `No documents with status "${filter}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;