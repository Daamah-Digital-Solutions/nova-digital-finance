import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { initializeTheme } from './styles/design-tokens';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import KYCForm from './pages/Auth/KYCForm';
import LoanApplication from './pages/Loans/LoanApplication';
import LoanPayment from './pages/Loans/LoanPayment';
import Documents from './pages/Documents/Documents';
import DocumentDetail from './pages/Documents/DocumentDetail';
import SignDocument from './pages/Documents/SignDocument';
import Investments from './pages/Investments/Investments';
import Requests from './pages/Requests/Requests';
import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';
import Features from './pages/Features';
import Terms from './pages/Terms';
import InstallBanner from './components/PWA/InstallBanner';
import OfflineIndicator from './components/PWA/OfflineIndicator';
import './App.css';

/**
 * Nova Finance Application Root Component
 *
 * Implements the Nova Finance UI System with proper theme initialization,
 * accessibility features, and semantic structure.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize Nova Finance UI System theme on app startup
    initializeTheme();

    // Set up meta theme-color for mobile browsers
    const updateMetaThemeColor = () => {
      const theme = document.body.getAttribute('data-theme');
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');

      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? '#0F0F23' : '#FFFFFF');
      }
    };

    updateMetaThemeColor();

    // Listen for theme changes
    const observer = new MutationObserver(updateMetaThemeColor);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
                <Header />
                <main className="flex-grow" role="main">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/kyc" element={<KYCForm />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/apply-loan" element={<LoanApplication />} />
                    <Route path="/loans/payment" element={<LoanPayment />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/documents/:id" element={<DocumentDetail />} />
                    <Route path="/documents/:id/sign" element={<SignDocument />} />
                    <Route path="/investments" element={<Investments />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/terms" element={<Terms />} />
                  </Routes>
                </main>
                <Footer />
                <InstallBanner />
                <OfflineIndicator />
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
