import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const Terms: React.FC = () => {
  const { t } = useLanguage();

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing and using Nova Finance services, you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and Nova Finance. If you do not agree to these terms, you may not use our services.`
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      content: `
        • "Platform" refers to Nova Finance digital finance platform and all related services
        • "User" or "Customer" refers to individuals or entities using our services
        • "Services" include loan applications, financing, payments, and related financial products
        • "Pronova (PRN)" refers to our native cryptocurrency used for transactions
        • "Sharia Compliance" refers to adherence to Islamic finance principles
      `
    },
    {
      id: 'eligibility',
      title: '3. Eligibility Requirements',
      content: `To use Nova Finance services, you must:
        • Be at least 18 years of age
        • Have legal capacity to enter into financial agreements
        • Provide accurate and complete personal information
        • Pass our KYC (Know Your Customer) verification process
        • Comply with all applicable laws and regulations in your jurisdiction
        • Not be listed on any sanctions or prohibited persons lists`
    },
    {
      id: 'kyc',
      title: '4. KYC and Verification',
      content: `All users must complete our comprehensive KYC process, which includes:
        • Identity verification with government-issued documents
        • Address verification with utility bills or bank statements
        • Financial information and source of funds documentation
        • Enhanced due diligence for high-risk customers or large transactions
        
        We reserve the right to request additional documentation and to deny service to users who fail to meet our verification standards.`
    },
    {
      id: 'services',
      title: '5. Financial Services',
      content: `Nova Finance provides interest-free Islamic financing services including:
        • Cryptocurrency financing with Pronova (PRN) currency
        • Multi-currency support (USD, EUR, PRN)
        • Processing fees ranging from 3-5% based on risk assessment
        • Flexible repayment terms and early settlement options
        • Investment platform integration through Capimax partnership
        
        All financing is provided in accordance with Islamic finance principles and Sharia compliance.`
    },
    {
      id: 'fees',
      title: '6. Fees and Charges',
      content: `Our fee structure is transparent and includes:
        • Processing fees: 3-5% of loan amount (determined by risk assessment)
        • No interest charges (Sharia-compliant)
        • Payment processing fees as disclosed at time of transaction
        • Late payment fees as specified in individual loan agreements
        • Currency conversion fees for multi-currency transactions
        
        All fees are clearly disclosed before agreement acceptance.`
    },
    {
      id: 'security',
      title: '7. Security and Privacy',
      content: `We implement bank-level security measures including:
        • 256-bit SSL encryption for all data transmission
        • Secure document storage with access controls
        • Regular security audits and penetration testing
        • MHCC cybersecurity partnership for enhanced protection
        • Compliance with international data protection standards
        
        Your personal information is protected according to our Privacy Policy.`
    },
    {
      id: 'responsibilities',
      title: '8. User Responsibilities',
      content: `Users are responsible for:
        • Providing accurate and up-to-date information
        • Maintaining the confidentiality of account credentials
        • Making timely payments according to agreed terms
        • Notifying us immediately of any unauthorized account access
        • Complying with all applicable laws and regulations
        • Using services only for lawful purposes`
    },
    {
      id: 'prohibited',
      title: '9. Prohibited Activities',
      content: `Users may not:
        • Engage in money laundering or terrorist financing
        • Use services for illegal activities or transactions
        • Provide false or misleading information
        • Attempt to circumvent security measures
        • Use automated systems to access our platform without permission
        • Transfer accounts or services to unauthorized parties`
    },
    {
      id: 'limitations',
      title: '10. Limitations and Disclaimers',
      content: `Nova Finance provides services "as is" without warranties. We:
        • Do not guarantee continuous or error-free service availability
        • Are not liable for market fluctuations in cryptocurrency values
        • Reserve the right to modify or discontinue services
        • May temporarily suspend services for maintenance or security reasons
        • Are not responsible for third-party service failures or interruptions`
    },
    {
      id: 'termination',
      title: '11. Account Termination',
      content: `We may terminate or suspend accounts:
        • For violation of these terms and conditions
        • For failure to complete KYC verification
        • For suspicious or fraudulent activity
        • For non-payment of outstanding obligations
        • At our discretion with appropriate notice
        
        Upon termination, outstanding obligations remain in effect.`
    },
    {
      id: 'disputes',
      title: '12. Dispute Resolution',
      content: `For dispute resolution:
        • Contact customer support first for resolution attempts
        • Mediation through agreed third-party mediators
        • Arbitration in accordance with applicable arbitration rules
        • Jurisdiction governed by laws of our primary operating jurisdiction
        • Class action waivers where legally permissible`
    },
    {
      id: 'compliance',
      title: '13. Regulatory Compliance',
      content: `Nova Finance operates in compliance with:
        • Anti-Money Laundering (AML) regulations
        • Counter-Terrorism Financing (CTF) requirements
        • Know Your Customer (KYC) standards
        • Islamic finance principles and Sharia compliance
        • Local and international financial regulations
        • Data protection and privacy laws`
    },
    {
      id: 'modifications',
      title: '14. Modifications to Terms',
      content: `We reserve the right to modify these terms:
        • With 30 days advance notice for material changes
        • Immediate effect for minor clarifications or legal requirements
        • Notification through email and platform announcements
        • Continued use constitutes acceptance of modified terms
        • Right to terminate services if you disagree with modifications`
    },
    {
      id: 'contact',
      title: '15. Contact Information',
      content: `For questions about these terms:
        • Email: legal@nova-finance.com
        • Customer Support: support@nova-finance.com
        • Address: Nova Finance Legal Department
        • Phone: Available through customer support portal
        • Business Hours: 24/7 customer support available`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <DocumentTextIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Terms & Conditions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Please read these terms carefully before using Nova Finance services. 
            These terms govern your use of our platform and financial services.
          </p>
        </div>

        {/* Last Updated Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Important Information
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-2">
                Last updated: January 2025
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                These terms and conditions are legally binding. By using our services, 
                you agree to comply with all terms outlined below. Please contact our 
                legal team if you have any questions.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {section.title}
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sharia Compliance Notice */}
        <div className="mt-12 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-start">
            <ShieldCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Sharia Compliance Certification
              </h3>
              <p className="text-green-800 dark:text-green-200">
                All Nova Finance services are certified as Sharia-compliant by qualified Islamic scholars. 
                Our financing products operate on interest-free principles with transparent fee structures 
                that align with Islamic finance guidelines. Certificates are available upon request.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Risk Disclosure
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200">
                Cryptocurrency and financial services carry inherent risks including market volatility, 
                regulatory changes, and technical risks. Please ensure you understand these risks before 
                using our services. Never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Questions About Our Terms?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Our legal and customer support teams are available to help clarify any 
            aspects of these terms and conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:legal@nova-finance.com"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Contact Legal Team
            </a>
            <a
              href="mailto:support@nova-finance.com"
              className="bg-blue-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors border border-blue-500"
            >
              Customer Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;