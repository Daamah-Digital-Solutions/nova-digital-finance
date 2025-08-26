import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'general', name: 'General Information' },
    { id: 'loans', name: 'Loans & Financing' },
    { id: 'payments', name: 'Payments & Fees' },
    { id: 'security', name: 'Security & Privacy' },
    { id: 'account', name: 'Account Management' },
    { id: 'islamic', name: 'Islamic Finance' }
  ];

  const faqData: FAQItem[] = [
    // General Information
    {
      id: '1',
      category: 'general',
      question: 'What is Nova Finance and how does it work?',
      answer: 'Nova Finance is a digital Islamic finance platform that provides interest-free cryptocurrency financing. We use Pronova (PRN) currency and offer instant loan approval with competitive processing fees ranging from 3-5%. Our platform combines traditional Islamic finance principles with modern technology.'
    },
    {
      id: '2',
      category: 'general',
      question: 'Who can use Nova Finance services?',
      answer: 'Nova Finance is available globally to individuals and businesses who pass our KYC (Know Your Customer) verification process. You must be at least 18 years old and provide valid identification documents to access our services.'
    },
    {
      id: '3',
      category: 'general',
      question: 'What currencies do you support?',
      answer: 'We support multiple currencies including USD, EUR, and our native Pronova (PRN) cryptocurrency. All transactions are processed with real-time exchange rate calculations to ensure transparency.'
    },

    // Loans & Financing
    {
      id: '4',
      category: 'loans',
      question: 'How quickly can I get loan approval?',
      answer: 'Our AI-powered system provides instant loan approval in most cases. Once you complete your application and pass the automated risk assessment, you can receive approval within minutes. Complex cases may require additional review time of 24-48 hours.'
    },
    {
      id: '5',
      category: 'loans',
      question: 'What are the minimum and maximum loan amounts?',
      answer: 'Loan amounts range from $1,000 to $100,000 USD equivalent, depending on your profile, income verification, and risk assessment. Higher amounts may be available for qualified borrowers with strong financial profiles.'
    },
    {
      id: '6',
      category: 'loans',
      question: 'What documents do I need to apply for a loan?',
      answer: 'You will need: valid government-issued ID, proof of income (salary certificates, bank statements), proof of address, and any additional documents requested during the KYC process. All documents can be uploaded directly through our secure platform.'
    },
    {
      id: '7',
      category: 'loans',
      question: 'Can I pay off my loan early?',
      answer: 'Yes, you can settle your loan early at any time without penalties. We encourage early settlement and provide settlement request functionality through your dashboard. Early settlement may result in fee reductions.'
    },

    // Payments & Fees
    {
      id: '8',
      category: 'payments',
      question: 'What are the processing fees?',
      answer: 'Our processing fees range from 3-5% of the loan amount, calculated based on your risk profile, loan amount, and duration. There are no hidden fees - all costs are clearly disclosed before you accept the loan terms.'
    },
    {
      id: '9',
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit and debit cards (Visa, MasterCard) through our secure Stripe integration. We also support bank transfers and cryptocurrency payments depending on your location and preferences.'
    },
    {
      id: '10',
      category: 'payments',
      question: 'When are payments due and how can I make them?',
      answer: 'Payment schedules are flexible and agreed upon during the loan application process. You can make payments through your dashboard using cards, bank transfers, or cryptocurrency. We send reminders before due dates and offer payment deferral requests if needed.'
    },

    // Security & Privacy
    {
      id: '11',
      category: 'security',
      question: 'How secure is my personal and financial information?',
      answer: 'We use bank-level security with 256-bit SSL encryption, secure document storage, and compliance with international data protection standards. Our partnership with MHCC provides additional cybersecurity monitoring and threat protection.'
    },
    {
      id: '12',
      category: 'security',
      question: 'Are my documents stored securely?',
      answer: 'Yes, all documents are encrypted and stored in secure, compliant data centers. We maintain strict access controls and audit trails. Documents are only accessible to authorized personnel for verification and compliance purposes.'
    },
    {
      id: '13',
      category: 'security',
      question: 'Do you share my information with third parties?',
      answer: 'We only share information as required by law or with your explicit consent. We may share necessary information with our verified partners (payment processors, KYC providers) to deliver services, but never sell your personal data to marketing companies.'
    },

    // Account Management
    {
      id: '14',
      category: 'account',
      question: 'How do I complete the KYC verification process?',
      answer: 'KYC verification is a 5-step process: Personal Information, Identity Verification, Address Verification, Financial Information, and Terms Acceptance. You can complete it entirely online by uploading required documents through our secure portal.'
    },
    {
      id: '15',
      category: 'account',
      question: 'Can I modify my loan after approval?',
      answer: 'Yes, you can submit requests for loan modifications including amount increases, payment deferrals, or restructuring through your dashboard. Each request is reviewed individually and may be subject to additional fees or terms.'
    },
    {
      id: '16',
      category: 'account',
      question: 'How can I track my loan and payments?',
      answer: 'Your dashboard provides comprehensive tracking including remaining balance, payment history, upcoming due dates, and downloadable statements. You also receive email notifications for important updates and payment reminders.'
    },

    // Islamic Finance
    {
      id: '17',
      category: 'islamic',
      question: 'How does Nova Finance comply with Islamic finance principles?',
      answer: 'We operate under Sharia-compliant principles with no interest (riba) charges. Our fees are transparent service charges, not interest. We have a dedicated Sharia Compliance Officer who ensures all operations align with Islamic finance principles.'
    },
    {
      id: '18',
      category: 'islamic',
      question: 'What makes your financing Halal?',
      answer: 'Our financing is based on service fees rather than interest, with transparent pricing and no compound charges. We avoid prohibited activities and maintain ethical business practices. All contracts and terms are reviewed by Islamic finance scholars.'
    },
    {
      id: '19',
      category: 'islamic',
      question: 'Do you have Sharia certification?',
      answer: 'Yes, our products and operations are certified by qualified Islamic scholars and maintain ongoing Sharia compliance monitoring. We provide Sharia compliance certificates with all loan documentation.'
    }
  ];

  const toggleItem = (itemId: string) => {
    setOpenItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Find answers to common questions about Nova Finance services, Islamic financing, and our platform features.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredFAQs.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredFAQs.length} of {faqData.length} questions
            </div>
          )}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full mr-3">
                        {categories.find(cat => cat.id === item.category)?.name}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {item.question}
                    </h3>
                  </div>
                  <div className="ml-4">
                    {openItems.includes(item.id) ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {openItems.includes(item.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No questions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or category filter
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Our support team is available 24/7 to help you with any questions about Nova Finance services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@nova-finance.com"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Email Support
            </a>
            <a
              href="/contact"
              className="bg-blue-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors border border-blue-500"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;