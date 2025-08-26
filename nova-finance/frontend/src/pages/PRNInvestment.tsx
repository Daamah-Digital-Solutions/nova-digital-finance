import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { prnovaService, PRNCertificate, CapimaxAccount, CapimaxInvestment } from '../services/prnovaService';

const PRNInvestment: React.FC = () => {
  const [certificates, setCertificates] = useState<PRNCertificate[]>([]);
  const [capimaxAccount, setCapimaxAccount] = useState<CapimaxAccount | null>(null);
  const [investments, setInvestments] = useState<CapimaxInvestment[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [certsData, accountData, investmentsData, opportunitiesData] = await Promise.all([
        prnovaService.getUserCertificates(),
        prnovaService.getCapimaxAccountStatus().catch(() => null),
        prnovaService.getUserInvestments(1).catch(() => ({ investments: [], total: 0 })),
        prnovaService.getInvestmentOpportunities().catch(() => [])
      ]);
      
      setCertificates(certsData);
      setCapimaxAccount(accountData);
      setInvestments(investmentsData.investments || []);
      setOpportunities(opportunitiesData);
    } catch (err: any) {
      setError('Failed to load investment data');
      console.error('Investment data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateCapimax = async () => {
    try {
      setActivating(true);
      const result = await prnovaService.activateCapimaxAccount();
      
      if (result.success) {
        await loadData(); // Reload data after activation
      } else {
        setError('Failed to activate Capimax account');
      }
    } catch (err: any) {
      setError('Failed to activate Capimax account');
    } finally {
      setActivating(false);
    }
  };

  const activeCertificates = certificates.filter(cert => cert.status === 'pledged');
  const totalPRNValue = activeCertificates.reduce((sum, cert) => sum + cert.usd_value, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading investment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                PRN Investment Platform
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Invest with your PRN certificates on Capimax platform
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* PRN Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-12 w-12 mr-4" />
              <div>
                <h2 className="text-2xl font-bold">Pronova (PRN) Token</h2>
                <p className="text-blue-100">1 PRN = $1.00 USD (Fixed Peg)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{totalPRNValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} PRN</p>
              <p className="text-blue-100">Available for Investment</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* No Certificates State */}
        {activeCertificates.length === 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No Active PRN Certificates
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You need an active PRN certificate to invest on Capimax. Apply for a loan to receive PRN tokens and certificates.
              </p>
              <Link
                to="/apply-loan"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Apply for PRN Loan
              </Link>
            </div>
          </div>
        )}

        {/* Active Certificates & Capimax Account */}
        {activeCertificates.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* PRN Certificates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active PRN Certificates ({activeCertificates.length})
              </h3>
              
              <div className="space-y-4">
                {activeCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cert.certificate_number}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                        Pledged
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">PRN Amount</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {cert.prn_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} PRN
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">USD Value</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${cert.usd_value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>
                    
                    {cert.capimax_investment_active && (
                      <div className="mt-2 flex items-center text-purple-600 dark:text-purple-400">
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Capimax Active</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Capimax Account Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Capimax Investment Account
              </h3>
              
              {!capimaxAccount?.active ? (
                <div className="text-center py-6">
                  <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Activate Investment Account
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Activate your Capimax account to start investing with your PRN certificates
                  </p>
                  
                  <button
                    onClick={handleActivateCapimax}
                    disabled={activating}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {activating ? (
                      <>
                        <div className="loading-spinner h-4 w-4 mr-2"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Activate Account
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Capacity</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${capimaxAccount.total_capacity_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Net Profit</p>
                      <p className={`text-lg font-bold ${capimaxAccount.net_profit_usd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {capimaxAccount.net_profit_usd >= 0 ? '+' : ''}${capimaxAccount.net_profit_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Active Investments: {capimaxAccount.active_investments}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Available: ${capimaxAccount.available_capacity_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Investment Opportunities */}
        {capimaxAccount?.active && opportunities.length > 0 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Investment Opportunities
              </h3>
              <Link
                to="/invest/create"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Investment
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {opportunity.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      opportunity.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      opportunity.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {opportunity.risk_level}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {opportunity.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Min Investment</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${opportunity.min_investment}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Expected Return</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {opportunity.expected_return}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Investments */}
        {investments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Investments ({investments.length})
              </h3>
              <Link
                to="/invest/portfolio"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-sm font-medium"
              >
                View Portfolio →
              </Link>
            </div>
            
            <div className="space-y-4">
              {investments.slice(0, 5).map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {investment.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {investment.type} • ${investment.invested_amount_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} invested
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${investment.profit_loss_usd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {investment.profit_loss_usd >= 0 ? '+' : ''}${investment.profit_loss_usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {investment.profit_loss_percentage >= 0 ? '+' : ''}{investment.profit_loss_percentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                How PRN Investment Works
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2"></span>
                  Your PRN tokens remain pledged to Nova Finance as loan collateral
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2"></span>
                  Use electronic certificates to invest on Capimax platform
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2"></span>
                  All investment profits belong entirely to you (0% commission to Nova)
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2"></span>
                  PRN tokens are released when you complete loan repayment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRNInvestment;