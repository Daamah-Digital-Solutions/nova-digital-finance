import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
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