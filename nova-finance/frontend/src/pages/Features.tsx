import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  BoltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CreditCardIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Features: React.FC = () => {
  const { t } = useLanguage();

  const mainFeatures = [
    {
      icon: BoltIcon,
      title: 'Instant Loan Approval',
      description: 'AI-powered risk assessment provides loan approval in minutes, not days. Our advanced algorithms analyze your profile and provide instant decisions.',
      benefits: ['Sub-minute approval times', 'Automated risk assessment', 'No waiting periods', '24/7 availability']
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Interest-Free Financing',
      description: 'True Islamic financing with transparent processing fees (3-5%) instead of interest. Fully Sharia-compliant with scholar certification.',
      benefits: ['No interest charges', 'Transparent fee structure', 'Sharia-compliant', 'Ethical financing']
    },
    {
      icon: ShieldCheckIcon,
      title: 'Bank-Level Security',
      description: 'Military-grade encryption, secure document storage, and MHCC cybersecurity partnership ensure maximum protection of your data.',
      benefits: ['256-bit SSL encryption', 'MHCC partnership', 'Secure document vault', 'Compliance monitoring']
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-Currency Support',
      description: 'Support for USD, EUR, and Pronova (PRN) cryptocurrency with real-time exchange rates and seamless currency conversion.',
      benefits: ['3+ major currencies', 'Real-time rates', 'Automatic conversion', 'Global accessibility']
    }
  ];

  const additionalFeatures = [
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-First Design',
      description: 'Responsive design optimized for mobile devices with PWA capabilities for app-like experience.'
    },
    {
      icon: DocumentTextIcon,
      title: 'Digital Documentation',
      description: 'Automated PDF generation, e-signatures, and secure document management with downloadable certificates.'
    },
    {
      icon: ChartBarIcon,
      title: 'Investment Integration',
      description: 'Seamless integration with Capimax investment platform for collateral management and portfolio growth.'
    },
    {
      icon: CreditCardIcon,
      title: 'Flexible Payments',
      description: 'Support for major credit cards, bank transfers, and cryptocurrency payments with Stripe integration.'
    },
    {
      icon: UserGroupIcon,
      title: '24/7 Support',
      description: 'Round-the-clock customer support with dedicated relationship managers for personalized service.'
    },
    {
      icon: ClockIcon,
      title: 'Flexible Terms',
      description: 'Customizable repayment schedules, early settlement options, and loan modification requests.'
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Quick Registration',
      description: 'Create your account and complete our streamlined KYC verification process with document upload.',
      icon: UserGroupIcon
    },
    {
      step: '02',
      title: 'Loan Application',
      description: 'Fill out our simple loan application form with your financing requirements and preferred terms.',
      icon: DocumentTextIcon
    },
    {
      step: '03',
      title: 'Instant Approval',
      description: 'Our AI system analyzes your application and provides instant approval with terms and conditions.',
      icon: BoltIcon
    },
    {
      step: '04',
      title: 'Funds Transfer',
      description: 'Upon acceptance, funds are transferred directly to your account or cryptocurrency wallet.',
      icon: CurrencyDollarIcon
    }
  ];

  const stats = [
    { value: '$50M+', label: 'Total Financing Provided' },
    { value: '10,000+', label: 'Satisfied Customers' },
    { value: '99.8%', label: 'Success Rate' },
    { value: '<2min', label: 'Average Approval Time' }
  ];

  const testimonials = [
    {
      name: 'Ahmed Al-Mahmoud',
      role: 'Business Owner',
      content: 'Nova Finance helped me expand my business with their fast, Sharia-compliant financing. The process was incredibly smooth and transparent.',
      rating: 5,
      location: 'Dubai, UAE'
    },
    {
      name: 'Sarah Johnson',
      role: 'Freelancer',
      content: 'As a digital nomad, I needed flexible financing that works globally. Nova Finance delivered exactly what I needed with excellent support.',
      rating: 5,
      location: 'London, UK'
    },
    {
      name: 'Mohamed Hassan',
      role: 'Tech Entrepreneur',
      content: 'The instant approval and competitive fees made Nova Finance the perfect choice for my startup\'s working capital needs.',
      rating: 5,
      location: 'Cairo, Egypt'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Platform Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Discover the powerful features that make Nova Finance the leading choice for 
            Islamic cryptocurrency financing worldwide.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Core Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                    <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <div className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Additional Capabilities
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connecting Line (except for last item) */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 transform translate-x-4 -translate-y-1/2"></div>
                )}
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full text-white font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <step.icon className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Nova Finance for their Islamic financing needs. 
            Apply for a loan today and experience the future of digital finance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Application
            </a>
            <a
              href="/about"
              className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-900 transition-colors border border-blue-500"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;