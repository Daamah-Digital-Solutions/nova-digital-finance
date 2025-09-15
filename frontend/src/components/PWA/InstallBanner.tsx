import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem('nova-install-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('nova-install-banner-dismissed', 'true');
  };

  const handleShowLater = () => {
    setIsVisible(false);
    // Set a timeout to show the banner again later (e.g., after 24 hours)
    setTimeout(() => {
      const dismissed = localStorage.getItem('nova-install-banner-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  };

  if (!isVisible || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium">
                Install Nova Finance App
              </h3>
              <p className="text-xs text-primary-100 mt-1">
                Get quick access to your finances with our mobile app experience.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-600 focus:ring-white transition-colors duration-200"
            >
              Install
            </button>
            
            <button
              onClick={handleShowLater}
              className="text-primary-200 hover:text-white text-xs font-medium transition-colors duration-200"
            >
              Later
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-primary-200 hover:text-white transition-colors duration-200"
              aria-label="Dismiss install banner"
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
    </div>
  );
};

export default InstallBanner;