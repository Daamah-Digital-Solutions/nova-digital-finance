import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { documentService, Document } from '../../services/documentService';
import DocumentCard from '../../components/Documents/DocumentCard';
import DocumentFilters from '../../components/Documents/DocumentFilters';
import { 
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

const Documents: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDocuments();
  };


  const handleDocumentAction = async (action: string, documentId: string) => {
    switch (action) {
      case 'view':
        navigate(`/documents/${documentId}`);
        break;
      case 'download':
        try {
          const blob = await documentService.downloadDocument(documentId);
          const document = documents.find(d => d.id === documentId);
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = `${document?.document_number || 'document'}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          setError('Failed to download document');
        }
        break;
      case 'share':
        navigate(`/documents/${documentId}/share`);
        break;
      case 'sign':
        navigate(`/documents/${documentId}/sign`);
        break;
      default:
        break;
    }
  };

  // Filter documents based on current filters
  const filteredDocuments = documents.filter(doc => {
    if (filters.type && doc.document_type !== filters.type) return false;
    if (filters.status && doc.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        doc.title.toLowerCase().includes(searchLower) ||
        doc.document_number.toLowerCase().includes(searchLower) ||
        doc.document_type_display.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Group documents by type for better organization
  const groupedDocuments = filteredDocuments.reduce((groups, doc) => {
    const type = doc.document_type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Documents
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
                  My Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your loan certificates, contracts, and financial documents
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={() => navigate('/apply-loan')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Apply for Loan
              </button>
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

        {/* Filters */}
        <div className="mb-6">
          <DocumentFilters
            filters={filters}
            onFilterChange={setFilters}
            documentCount={filteredDocuments.length}
            totalCount={documents.length}
          />
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <InboxIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {documents.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {documents.length === 0 
                  ? 'Apply for a loan to generate your first documents'
                  : 'Try adjusting your filters to find what you\'re looking for'
                }
              </p>
              
              {documents.length === 0 && (
                <button
                  onClick={() => navigate('/apply-loan')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply for Your First Loan
                </button>
              )}
              
              {documents.length > 0 && (
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
          <div className="space-y-8">
            {Object.entries(groupedDocuments).map(([type, docs]) => (
              <div key={type}>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">
                    {documentService.getDocumentTypeIcon(type)}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {docs[0].document_type_display}
                  </h2>
                  <span className="ml-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
                    {docs.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docs.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onAction={handleDocumentAction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;