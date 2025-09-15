import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Show "back online" notification briefly
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowNotification(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and notification is not active
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform ${
        showNotification ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-yellow-600 text-white'
        } shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {isOnline ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 2.83l2.829 2.829m-2.829-2.829L3 21m9-10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {isOnline ? (
                    'Connection Restored'
                  ) : (
                    'You\'re Offline'
                  )}
                </p>
                <p className="text-xs opacity-90">
                  {isOnline ? (
                    'You\'re back online. All features are available.'
                  ) : (
                    'Some features may be limited. We\'ll sync your data when you\'re back online.'
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-gray-200 transition-colors duration-200 ml-4"
              aria-label="Dismiss notification"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Offline mode indicator - always visible when offline */}
      {!isOnline && (
        <div className="bg-gray-800 text-white border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Offline Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;