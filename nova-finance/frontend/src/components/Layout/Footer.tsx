import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <span className="text-lg font-bold text-white">NF</span>
              </div>
              <span className="ml-3 text-xl font-bold">Nova Finance</span>
            </div>
            <p className="text-gray-300 text-sm leading-6">
              Nova Financial Digital is a licensed company that finances digital currencies 
              under certain financing terms and conditions, providing assistance and support 
              for cryptocurrency investments.
            </p>
            <div className="mt-6">
              <p className="text-xs text-gray-400">
                Licensed Financial Services Provider
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/loans" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Cryptocurrency Financing
                </Link>
              </li>
              <li>
                <Link to="/investment" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Investment Platform
                </Link>
              </li>
              <li>
                <Link to="/capimax" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Capimax Integration
                </Link>
              </li>
              <li>
                <Link to="/currencies" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Multi-Currency Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('partnerships')}
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Security & MHCC
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('contactUs')}
                </Link>
              </li>
              <li>
                <Link to="/documents" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Document Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  {t('termsConditions')}
                </Link>
              </li>
              <li>
                <Link to="/risks" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Risk Disclosure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Partnerships Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <h4 className="text-lg font-semibold mb-4">Our Partnerships</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <h5 className="font-medium mb-2">Capimax</h5>
              <p className="text-gray-300 text-sm">
                Global investment platform for tokenization and real estate investments
              </p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <h5 className="font-medium mb-2">MHCC</h5>
              <p className="text-gray-300 text-sm">
                Cybersecurity and investment protection services
              </p>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <h5 className="font-medium mb-2">Payment Processors</h5>
              <p className="text-gray-300 text-sm">
                Secure Visa, MasterCard, and digital payment integration
              </p>
            </div>
          </div>
        </div>

        {/* Currency Info */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-2">Pronova (PRN) Currency</h4>
            <p className="text-gray-300 text-sm mb-4">
              Our flagship digital currency offering interest-free financing with competitive 3-5% fees. 
              Fully integrated with major investment platforms for seamless trading and portfolio management.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-400 font-medium">Interest Rate:</span>
                <span className="ml-2">0% (Fee-based)</span>
              </div>
              <div>
                <span className="text-blue-400 font-medium">Processing Fee:</span>
                <span className="ml-2">3-5%</span>
              </div>
              <div>
                <span className="text-blue-400 font-medium">Investment Platform:</span>
                <span className="ml-2">Capimax Integrated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2024 Nova Financial Digital. All rights reserved. Licensed financial services provider.
          </div>
          
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/compliance" className="text-gray-400 hover:text-white text-sm transition-colors">
              Compliance
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-xs text-yellow-200 leading-relaxed">
              <strong>Risk Warning:</strong> Cryptocurrency investments carry inherent risks. 
              The value of digital currencies can fluctuate significantly. While our financing is provided in USD 
              to mitigate currency risk, investment returns are not guaranteed. Please ensure you understand 
              the risks involved and consider seeking independent financial advice. Nova Financial Digital 
              is committed to transparency and regulatory compliance in all jurisdictions where we operate.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;