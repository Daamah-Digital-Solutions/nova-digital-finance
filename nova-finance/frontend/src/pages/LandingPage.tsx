import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  CurrencyDollarIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const { state: authState } = useAuth();
  const { t } = useLanguage();

  const features = [
    {
      icon: CurrencyDollarIcon,
      title: 'Interest-Free Financing',
      description: 'Get cryptocurrency financing with 0% interest, only 3-5% processing fees'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Licensed',
      description: 'Licensed financial services with MHCC cybersecurity protection'
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-Currency Support',
      description: 'Starting with Pronova (PRN), expanding to support multiple cryptocurrencies'
    },
    {
      icon: ChartBarIcon,
      title: 'Investment Integration',
      description: 'Seamless integration with Capimax investment platform'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-First PWA',
      description: 'Professional mobile app experience across all devices'
    },
    {
      icon: BanknotesIcon,
      title: 'Dollar-Denominated Loans',
      description: 'All loans in USD to protect against cryptocurrency volatility'
    }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Complete KYC Verification',
      description: 'Submit your documents and personal information for verification'
    },
    {
      step: '02',
      title: 'Apply for Financing',
      description: 'Request your desired cryptocurrency amount with flexible terms'
    },
    {
      step: '03',
      title: 'Get Approved',
      description: 'Our automated system processes your application instantly'
    },
    {
      step: '04',
      title: 'Receive Certificate',
      description: 'Get your digital ownership certificate for investment use'
    },
    {
      step: '05',
      title: 'Invest on Capimax',
      description: 'Use your certificate to invest on our partner platform'
    },
    {
      step: '06',
      title: 'Repay & Own',
      description: 'Make monthly payments and own your cryptocurrency investment'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Nova Finance
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-8">
              Digital Currency Financing Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get interest-free cryptocurrency financing with Pronova (PRN) currency. 
              Professional platform with 3-5% fees, Capimax integration, and enterprise-grade security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {authState.isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    {t('createAccount')}
                  </Link>
                  <Link
                    to="/login"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 transition-colors shadow-lg"
                  >
                    {t('login')}
                  </Link>
                </>
              )}
            </div>

            {/* Key Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">0%</div>
                <div className="text-gray-600 dark:text-gray-400">Interest Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">3-5%</div>
                <div className="text-gray-600 dark:text-gray-400">Processing Fee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                <div className="text-gray-600 dark:text-gray-400">Platform Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Nova Finance?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional cryptocurrency financing platform designed for modern investors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, secure, and professional process to get your cryptocurrency financing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-300 dark:bg-blue-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnerships Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Partnerships
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Trusted partnerships ensuring security, compliance, and professional investment opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Capimax</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Global investment platform specializing in tokenization, real estate, and portfolio management. 
                Seamlessly integrate your financing with professional investment opportunities.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">MHCC</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Cybersecurity and investment protection services. MHCC provides comprehensive security 
                verification, document authentication, and platform protection.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BanknotesIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Partners</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Integrated with major payment processors including Visa, MasterCard, and digital payment 
                systems for secure and convenient transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Crypto Investment Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join thousands of investors who trust Nova Finance for professional cryptocurrency financing. 
            Get started today with our simple verification process.
          </p>
          
          {!authState.isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started Now
              </Link>
              <Link
                to="/about"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;