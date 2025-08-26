import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { documentService, Document } from '../../services/documentService';
import { 
  DocumentTextIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'typed'>('canvas');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const doc = await documentService.getDocument(id!);
      setDocument(doc);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setSignatureData('');
  };

  const getCanvasSignatureData = () => {
    if (!canvasRef.current) return '';
    return canvasRef.current.toDataURL('image/png');
  };

  const isCanvasEmpty = () => {
    if (!canvasRef.current) return true;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return true;
    
    const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    return imgData.data.every(pixel => pixel === 0);
  };

  const handleSign = async () => {
    try {
      setSigning(true);
      setError('');

      let finalSignatureData = '';
      
      if (signatureMethod === 'canvas') {
        if (isCanvasEmpty()) {
          setError('Please provide a signature before signing');
          return;
        }
        finalSignatureData = getCanvasSignatureData();
      } else {
        if (!signatureData.trim()) {
          setError('Please enter your signature');
          return;
        }
        finalSignatureData = signatureData.trim();
      }

      await documentService.signDocument(id!, {
        signature_data: finalSignatureData,
        signature_method: signatureMethod,
        user_agent: navigator.userAgent
      });

      // Refresh document to show signed status
      await loadDocument();
      
      // Show success message and redirect after a delay
      setTimeout(() => {
        navigate('/documents');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign document');
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    if (canvasRef.current && signatureMethod === 'canvas') {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [signatureMethod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Document
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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

  if (!document) return null;

  // If document is already signed
  if (document.status === 'signed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <CheckIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Document Already Signed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This document has already been electronically signed on{' '}
                {document.signature_timestamp && 
                  new Date(document.signature_timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </p>
              <button
                onClick={() => navigate('/documents')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="flex items-center">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Documents
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Sign Document
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Electronically sign your {document.document_type_display}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Document Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{document.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Number
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{document.document_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{document.document_type_display}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Electronic Signature
            </h2>

            {/* Signature Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Signature Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="canvas"
                    checked={signatureMethod === 'canvas'}
                    onChange={(e) => setSignatureMethod(e.target.value as 'canvas' | 'typed')}
                    className="mr-2"
                  />
                  <span className="text-gray-900 dark:text-white">Draw Signature</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="typed"
                    checked={signatureMethod === 'typed'}
                    onChange={(e) => setSignatureMethod(e.target.value as 'canvas' | 'typed')}
                    className="mr-2"
                  />
                  <span className="text-gray-900 dark:text-white">Type Signature</span>
                </label>
              </div>
            </div>

            {/* Canvas Signature */}
            {signatureMethod === 'canvas' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Draw your signature below
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="border border-dashed border-gray-300 dark:border-gray-600 rounded cursor-crosshair w-full"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Typed Signature */}
            {signatureMethod === 'typed' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Type your full name as your signature
                </label>
                <input
                  type="text"
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg font-serif"
                  style={{ fontFamily: 'cursive' }}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Legal Notice */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Legal Notice:</strong> By signing this document, you agree that your electronic signature 
                has the same legal validity as a handwritten signature. This action will be recorded with 
                timestamp, IP address, and device information for verification purposes.
              </p>
            </div>

            {/* PDF Signature Feature Notice */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>✨ Professional Feature:</strong> Your signature will be permanently embedded into the PDF document. 
                When you download the signed document, it will display your actual signature (drawing or typed name) 
                along with verification details for maximum authenticity and legal compliance.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => navigate('/documents')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="w-5 h-5 mr-2" />
                {signing ? 'Signing...' : 'Sign Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignDocument;