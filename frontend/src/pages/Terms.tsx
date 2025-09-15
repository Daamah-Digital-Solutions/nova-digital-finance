import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Terms: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Last updated: January 1, 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Welcome to Nova Finance. These Terms of Service ("Terms") govern your use of our 
              financial services platform and applications ("Service") operated by Nova Finance Inc. 
              ("us", "we", or "our"). By accessing or using our Service, you agree to be bound by 
              these Terms. If you disagree with any part of these terms, then you may not access the Service.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Account Registration
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                To access our services, you must register for an account and provide accurate, 
                complete, and current information. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your information remains accurate and up-to-date</li>
              </ul>
            </div>
          </section>

          {/* Financial Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Financial Services
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                Nova Finance provides various financial services including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal and business loans</li>
                <li>Investment opportunities and portfolio management</li>
                <li>Digital document management and e-signature services</li>
                <li>Financial analytics and reporting</li>
              </ul>
              <p>
                All financial services are subject to eligibility requirements, credit checks, 
                and applicable regulations. We reserve the right to approve or deny any application 
                at our sole discretion.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. User Responsibilities
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and truthful information in all applications and communications</li>
                <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                <li>Not attempt to gain unauthorized access to any part of the Service</li>
                <li>Not use the Service to transmit malicious software or engage in illegal activities</li>
                <li>Comply with all applicable local, state, national, and international laws</li>
                <li>Report any suspected security vulnerabilities or unauthorized access immediately</li>
              </ul>
            </div>
          </section>

          {/* Privacy and Data Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Privacy and Data Protection
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
              and protect your personal information. By using our Service, you consent to the 
              collection and use of information in accordance with our Privacy Policy. We implement 
              industry-standard security measures to protect your data, including encryption, 
              secure data transmission, and regular security audits.
            </p>
          </section>

          {/* Fees and Payments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Fees and Payments
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                Our services may include various fees as outlined in your specific agreements. 
                All fees are clearly disclosed before you commit to any service. Key points:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Loan origination fees, interest rates, and repayment terms are specified in loan agreements</li>
                <li>Investment management fees are disclosed in investment documentation</li>
                <li>Late payment fees may apply for overdue payments</li>
                <li>Fee schedules may be updated with 30 days notice</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              The Service and its original content, features, and functionality are owned by 
              Nova Finance and are protected by international copyright, trademark, patent, 
              trade secret, and other intellectual property laws. You may not reproduce, 
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              In no event shall Nova Finance be liable for any indirect, incidental, special, 
              consequential, or punitive damages, including without limitation, loss of profits, 
              data, use, goodwill, or other intangible losses, resulting from your use of the Service. 
              Our total liability shall not exceed the amount paid by you to us in the twelve (12) 
              months preceding the event giving rise to the claim.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Dispute Resolution
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be resolved 
              through binding arbitration in accordance with the rules of the American Arbitration 
              Association. The arbitration shall take place in New York, NY, and shall be conducted 
              in English. You waive any right to a jury trial or to participate in a class action lawsuit.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                We may terminate or suspend your account and access to the Service immediately, 
                without prior notice, for any reason including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Breach of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Upon your request for account closure</li>
              </ul>
              <p>
                Upon termination, your right to use the Service will cease immediately, but your 
                obligations under these Terms will survive termination.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. If we make material changes, 
              we will notify you by email or through the Service at least 30 days before the changes 
              take effect. Your continued use of the Service after the effective date constitutes 
              acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Contact Information
            </h2>
            <div className="text-gray-600 dark:text-gray-300 space-y-2">
              <p>If you have any questions about these Terms, please contact us at:</p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                <p><strong>Nova Finance Inc.</strong></p>
                <p>Legal Department</p>
                <p>123 Finance Street</p>
                <p>New York, NY 10001</p>
                <p>Email: legal@novafinance.com</p>
                <p>Phone: (555) 123-4567</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>© 2024 Nova Finance Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;