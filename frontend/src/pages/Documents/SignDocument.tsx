import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && id) {
      // Simulate loading document
      setTimeout(() => {
        setDocument({
          id: id,
          title: 'Personal Loan Agreement',
          type: 'loan_agreement',
          status: 'pending'
        });
      }, 500);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setSignature(canvas.toDataURL());
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature('');
      }
    }
  };

  const handleSubmit = async () => {
    if (!signature) {
      alert('Please provide your signature before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to submit signature
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Document signed successfully!');
      navigate('/documents');
    } catch (error) {
      alert('Failed to sign document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to sign this document
          </h2>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sign Document
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {document.title}
          </p>
        </div>

        {/* Document Preview */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Document Preview</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-300">
              This is a preview of your {document.title}. Please review the document carefully before signing.
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Signature</h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Please sign in the box below using your mouse or touch device:
            </p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full max-w-full h-48 border border-gray-200 dark:border-gray-600 rounded cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Clear Signature
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Click and drag to sign
              </p>
            </div>
          </div>

          {/* Signer Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Signer Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Time:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Legal Notice</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  By signing this document electronically, you agree that your electronic signature 
                  is the legal equivalent of your manual signature and has the same legal force and effect.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !signature}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing Document...
                </div>
              ) : (
                'Sign Document'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignDocument;