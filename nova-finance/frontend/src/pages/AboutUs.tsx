import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AboutUs: React.FC = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: ShieldCheckIcon,
      title: 'Security & Trust',
      description: 'Bank-level security with advanced encryption and compliance with international financial standards.'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Interest-Free Financing',
      description: 'True Islamic financing principles with transparent fee structure and no hidden charges.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Accessibility',
      description: 'Available worldwide with multi-currency support and localized experience.'
    },
    {
      icon: UserGroupIcon,
      title: 'Customer First',
      description: '24/7 customer support with dedicated relationship managers for each client.'
    }
  ];

  const features = [
    'Instant loan approval with AI-powered risk assessment',
    'Multi-currency support (USD, EUR, PRN)',
    'Investment platform integration with Capimax',
    'Professional document generation and e-signatures',
    'Real-time payment processing with major cards',
    'Comprehensive KYC and AML compliance'
  ];

  const team = [
    {
      name: 'Ahmed Al-Rashid',
      role: 'Chief Executive Officer',
      description: 'Former senior executive at Dubai Islamic Bank with 15+ years in Islamic finance.',
      image: '👨‍💼'
    },
    {
      name: 'Sarah Johnson',
      role: 'Chief Technology Officer',
      description: 'Ex-Goldman Sachs technology leader specializing in fintech innovation.',
      image: '👩‍💻'
    },
    {
      name: 'Dr. Mohammad Hassan',
      role: 'Sharia Compliance Officer',
      description: 'Islamic finance scholar ensuring all operations comply with Sharia principles.',
      image: '👨‍🎓'
    },
    {
      name: 'Maria Rodriguez',
      role: 'Head of Operations',
      description: 'Operations expert with experience at major international banks.',
      image: '👩‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About Nova Finance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing digital finance with interest-free cryptocurrency financing, 
            combining Islamic principles with cutting-edge technology.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg leading-relaxed mb-6">
                  To democratize access to ethical financing solutions by providing instant, 
                  interest-free cryptocurrency loans that comply with Islamic finance principles 
                  while leveraging modern technology for maximum efficiency and transparency.
                </p>
                <p className="text-lg leading-relaxed">
                  We bridge traditional Islamic finance with the digital economy, making 
                  financial inclusion accessible to everyone, everywhere.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center">
                  <GlobeAltIcon className="w-32 h-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <value.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              What We Offer
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Comprehensive Financial Solutions
                </h3>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-8">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">$50M+</div>
                  <div className="text-gray-600 dark:text-gray-400 mb-6">Total Financing Provided</div>
                  
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">10,000+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">99.8%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Leadership Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <div className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                  {member.role}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Our Partners
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <AcademicCapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Capimax Investment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Strategic investment platform integration for collateral management
              </p>
            </div>
            <div className="p-6">
              <ShieldCheckIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                MHCC Partnership
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced cybersecurity and compliance monitoring services
              </p>
            </div>
            <div className="p-6">
              <CurrencyDollarIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Stripe Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure payment processing with global card network support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;