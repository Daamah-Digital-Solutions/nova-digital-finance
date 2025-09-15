import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { state: themeState } = useTheme();

  // Simplified footer links organized by category
  const footerLinks = {
    company: [
      { path: '/about', label: t('aboutUs') },
      { path: '/contact', label: 'Contact' },
      { path: '/careers', label: 'Careers' },
    ],
    legal: [
      { path: '/privacy', label: 'Privacy Policy' },
      { path: '/terms', label: 'Terms of Service' },
      { path: '/compliance', label: 'Compliance' },
    ],
    support: [
      { path: '/faq', label: t('faq') },
      { path: '/help', label: 'Help Center' },
      { path: '/security', label: 'Security' },
    ],
  };

  return (
    <footer className={cn(
      "border-t transition-colors duration-200",
      themeState.actualTheme === 'dark' 
        ? "bg-gray-900 border-gray-800" 
        : "bg-gray-50 border-gray-200"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Branding */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <div className={cn(
                    "text-lg font-semibold",
                    themeState.actualTheme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    Nova Finance
                  </div>
                  <div className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    themeState.actualTheme === 'dark' ? "text-indigo-400" : "text-indigo-600"
                  )}>
                    Islamic Banking
                  </div>
                </div>
              </div>
              
              <p className={cn(
                "text-sm leading-relaxed mb-6 max-w-md",
                themeState.actualTheme === 'dark' ? "text-gray-300" : "text-gray-600"
              )}>
                Sharia-compliant financial services provider offering ethical digital banking solutions 
                with transparency and trust at our core.
              </p>

              {/* Certification Badge */}
              <div className={cn(
                "inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium",
                themeState.actualTheme === 'dark' 
                  ? "bg-indigo-900/20 text-indigo-400 border border-indigo-800/30"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
              )}>
                <ShieldCheckIcon className="h-3 w-3 mr-2" />
                Licensed & Sharia Compliant
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
              <div>
                <h3 className={cn(
                  "text-sm font-semibold uppercase tracking-wider mb-4",
                  themeState.actualTheme === 'dark' ? "text-gray-200" : "text-gray-900"
                )}>
                  Company
                </h3>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className={cn(
                          "text-sm transition-colors duration-200",
                          themeState.actualTheme === 'dark' 
                            ? "text-gray-400 hover:text-indigo-400" 
                            : "text-gray-600 hover:text-indigo-600"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className={cn(
                  "text-sm font-semibold uppercase tracking-wider mb-4",
                  themeState.actualTheme === 'dark' ? "text-gray-200" : "text-gray-900"
                )}>
                  Support
                </h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className={cn(
                          "text-sm transition-colors duration-200",
                          themeState.actualTheme === 'dark' 
                            ? "text-gray-400 hover:text-indigo-400" 
                            : "text-gray-600 hover:text-indigo-600"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={cn(
          "border-t py-6",
          themeState.actualTheme === 'dark' ? "border-gray-800" : "border-gray-200"
        )}>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className={cn(
              "text-sm",
              themeState.actualTheme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              © 2024 Nova Finance. All rights reserved.
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center space-x-6">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={cn(
                    "text-sm transition-colors duration-200",
                    themeState.actualTheme === 'dark' 
                      ? "text-gray-400 hover:text-indigo-400" 
                      : "text-gray-500 hover:text-indigo-600"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className={cn(
          "border-t py-4",
          themeState.actualTheme === 'dark' ? "border-gray-800" : "border-gray-200"
        )}>
          <div className={cn(
            "rounded-lg p-4 border",
            themeState.actualTheme === 'dark' 
              ? "bg-yellow-900/10 border-yellow-800/30 text-yellow-200" 
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          )}>
            <p className="text-xs leading-relaxed">
              <strong>Risk Disclosure:</strong> Cryptocurrency investments carry inherent risks. 
              Digital currency values can fluctuate significantly. While our financing is provided in USD, 
              investment returns are not guaranteed. Please ensure you understand the risks and consider 
              seeking independent financial advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;