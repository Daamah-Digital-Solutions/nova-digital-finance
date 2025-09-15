import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AboutUs: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About Nova Finance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Empowering individuals and businesses with innovative financial solutions 
            that drive growth and prosperity in the digital age.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center">
              At Nova Finance, we believe that everyone deserves access to fair, transparent, 
              and innovative financial services. Our mission is to democratize finance by 
              leveraging cutting-edge technology to provide seamless, secure, and accessible 
              financial solutions that help our customers achieve their goals.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Trust & Security</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We prioritize the security and privacy of our customers' financial data 
                with bank-grade encryption and robust security measures.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Innovation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We continuously innovate and adopt new technologies to provide 
                cutting-edge financial solutions that meet evolving customer needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Customer-Centric</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our customers are at the heart of everything we do. We design our 
                services with their needs and experiences in mind.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Leadership Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">JD</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">John Doe</h3>
              <p className="text-primary-600 dark:text-primary-400 mb-3">Chief Executive Officer</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                15+ years of experience in fintech and digital banking, 
                passionate about financial inclusion and innovation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">JS</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Jane Smith</h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-3">Chief Technology Officer</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Former senior engineer at leading tech companies, 
                expert in blockchain and distributed systems.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">MJ</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Michael Johnson</h3>
              <p className="text-green-600 dark:text-green-400 mb-3">Chief Financial Officer</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Former investment banker with deep expertise in 
                risk management and financial regulation.
              </p>
            </div>
          </div>
        </div>

        {/* Company Stats */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Nova Finance by the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary-600 mb-2">$100M+</div>
              <div className="text-gray-600 dark:text-gray-300">Loans Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;