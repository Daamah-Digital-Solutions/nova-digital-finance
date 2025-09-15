import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'loans' | 'investments' | 'security' | 'account';
}

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'What is Nova Finance?',
      answer: 'Nova Finance is a comprehensive digital financial platform that provides loans, investment opportunities, and financial management tools. We combine traditional banking services with modern fintech innovations to offer a seamless, secure, and user-friendly experience.',
      category: 'general'
    },
    {
      id: '2',
      question: 'How do I apply for a loan?',
      answer: 'You can apply for a loan by logging into your Nova Finance account and navigating to the "Apply for Loan" section. Fill out the application form with your personal and financial information. Our AI-powered system will provide an instant preliminary assessment, and you\'ll receive a decision within 24 hours.',
      category: 'loans'
    },
    {
      id: '3',
      question: 'What types of loans do you offer?',
      answer: 'We offer various types of loans including personal loans, business loans, auto loans, and home equity loans. Each loan type has different terms, interest rates, and eligibility requirements. You can view all available options in your dashboard.',
      category: 'loans'
    },
    {
      id: '4',
      question: 'How secure is my financial data?',
      answer: 'We take security very seriously. Your data is protected with bank-grade 256-bit SSL encryption, multi-factor authentication, and advanced fraud detection systems. We comply with all relevant financial regulations and undergo regular security audits.',
      category: 'security'
    },
    {
      id: '5',
      question: 'Can I invest through Nova Finance?',
      answer: 'Yes, Nova Finance offers various investment opportunities including stocks, bonds, ETFs, and curated investment portfolios. Our platform provides real-time market data, portfolio analytics, and investment recommendations based on your risk profile and goals.',
      category: 'investments'
    },
    {
      id: '6',
      question: 'What are the fees associated with Nova Finance services?',
      answer: 'We believe in transparent pricing. Loan fees vary based on the loan type and amount. Investment services have competitive management fees. There are no hidden charges, and all fees are clearly disclosed before you commit to any service.',
      category: 'general'
    },
    {
      id: '7',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page and enter your registered email address. You\'ll receive a secure password reset link. For security reasons, the link expires after 30 minutes. If you continue having trouble, contact our support team.',
      category: 'account'
    },
    {
      id: '8',
      question: 'Is there a minimum investment amount?',
      answer: 'The minimum investment amount varies by investment type. For most stock investments, there\'s no minimum. For managed portfolios, the minimum is typically $500. Specific requirements are displayed when you select an investment option.',
      category: 'investments'
    },
    {
      id: '9',
      question: 'How long does loan approval take?',
      answer: 'Most loan applications receive a preliminary decision within minutes using our automated assessment system. Final approval typically takes 24-48 hours after document verification. Complex applications may take up to 5 business days.',
      category: 'loans'
    },
    {
      id: '10',
      question: 'Can I access Nova Finance on mobile devices?',
      answer: 'Absolutely! Nova Finance is designed as a Progressive Web App (PWA) that works seamlessly on all devices. You can install it on your phone for a native app experience, or access it through any web browser.',
      category: 'general'
    }
  ];

  const categories = [
    { key: 'all', label: 'All Questions' },
    { key: 'general', label: 'General' },
    { key: 'loans', label: 'Loans' },
    { key: 'investments', label: 'Investments' },
    { key: 'security', label: 'Security' },
    { key: 'account', label: 'Account' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find answers to common questions about Nova Finance services and features.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {item.question}
                </h3>
                <svg
                  className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${
                    openItem === item.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openItem === item.id && (
                <div className="px-6 pb-4">
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-primary-100 mb-6">
              Our support team is here to help you 24/7. Get in touch and we\'ll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </button>
              <button className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;