import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../services/authService';
import { 
  DocumentTextIcon, 
  UserIcon, 
  HomeIcon, 
  BriefcaseIcon,
  CloudArrowUpIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface KYCFormData {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  occupation: string;
  annual_income: string;
  employer_name: string;
  investment_experience: string;
  risk_tolerance: 'low' | 'medium' | 'high';
}

const KYCForm: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState, updateUser } = useAuth();
  const { t } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<KYCFormData>({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    occupation: '',
    annual_income: '',
    employer_name: '',
    investment_experience: '',
    risk_tolerance: 'medium',
  });

  const [termsAccepted, setTermsAccepted] = useState({
    loanInDollars: false,
    mortgagedByNova: false,
    investmentsMortgaged: false,
    agreementDebtInstrument: false,
    financingContract: false,
  });

  useEffect(() => {
    if (authState.user?.kyc_status === 'approved' || authState.user?.kyc_status === 'under_review') {
      navigate('/dashboard');
    }
  }, [authState.user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTermsChange = (key: keyof typeof termsAccepted) => {
    setTermsAccepted(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.date_of_birth && formData.nationality);
      case 2:
        return !!(formData.address_line_1 && formData.city && formData.country);
      case 3:
        return !!(formData.occupation && formData.annual_income);
      case 4:
        return uploadedFiles.length >= 2;
      case 5:
        return Object.values(termsAccepted).every(Boolean);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      setError('Please fill all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitKYC = async () => {
    setLoading(true);
    setError('');

    try {
      // Submit KYC data
      const response = await authService.submitKYC(formData);
      
      // Upload documents
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', getDocumentType(file.name));
        await authService.uploadKYCDocument(formData);
      }

      updateUser({ kyc_status: 'under_review' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('KYC Submission Error:', err);
      
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.error;
        if (errorMessage === 'KYC already submitted or approved') {
          setError('Your KYC information has already been submitted and is under review.');
          // Update user status and redirect to dashboard
          updateUser({ kyc_status: 'under_review' });
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
        setError(errorMessage || 'Invalid KYC information. Please check your details.');
      } else if (err.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to submit KYC. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDocumentType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('passport')) return 'passport';
    if (name.includes('id')) return 'national_id';
    if (name.includes('bank')) return 'bank_statement';
    if (name.includes('address')) return 'proof_of_address';
    if (name.includes('income')) return 'income_proof';
    return 'other';
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: UserIcon },
    { number: 2, title: 'Address', icon: HomeIcon },
    { number: 3, title: 'Employment', icon: BriefcaseIcon },
    { number: 4, title: 'Documents', icon: DocumentTextIcon },
    { number: 5, title: 'Terms', icon: CheckCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('kycVerification')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete your verification to access Nova Finance services
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className={`w-16 h-1 mx-4 ${
                    currentStep > step.number 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('personalInfo')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('dateOfBirth')} *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('nationality')} *
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your nationality"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Address Information
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={formData.address_line_1}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={formData.address_line_2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('city')} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      name="state_province"
                      value={formData.state_province}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Zip code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('country')} *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Employment Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Employment Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('occupation')} *
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Your job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    name="employer_name"
                    value={formData.employer_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('annualIncome')} (USD) *
                  </label>
                  <input
                    type="number"
                    name="annual_income"
                    value={formData.annual_income}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Risk Tolerance
                  </label>
                  <select
                    name="risk_tolerance"
                    value={formData.risk_tolerance}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Investment Experience
                  </label>
                  <textarea
                    name="investment_experience"
                    value={formData.investment_experience}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your investment experience..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('uploadDocuments')}
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      Click to upload files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-gray-500 mt-1">PDF, JPG, PNG up to 10MB each</p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Uploaded Files:</h3>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Required Documents:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Government-issued ID or Passport</li>
                  <li>• Bank statement (last 3 months)</li>
                  <li>• Proof of address</li>
                  <li>• Income verification</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Terms & Conditions */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Terms & Conditions Agreement
              </h2>
              
              <div className="space-y-4">
                {[
                  { key: 'loanInDollars', text: 'I understand the loan is at dollar value, debt in dollars, mortgaged by Nova Financial Digital' },
                  { key: 'mortgagedByNova', text: 'After repayment: Transfer amount to wallet at currency value or release investment value in Capimax' },
                  { key: 'investmentsMortgaged', text: 'I acknowledge that investments are mortgaged until full repayment' },
                  { key: 'agreementDebtInstrument', text: 'I agree this ownership certificate equals a debt instrument' },
                  { key: 'financingContract', text: 'I accept this as a financing contract between myself and Nova Financial Digital' },
                ].map(({ key, text }) => (
                  <label key={key} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={termsAccepted[key as keyof typeof termsAccepted]}
                      onChange={() => handleTermsChange(key as keyof typeof termsAccepted)}
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
                  </label>
                ))}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  By proceeding, you acknowledge that you have read and understood all terms and conditions.
                  Your application will be reviewed within 24-48 hours.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('back')}
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                {t('next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={submitKYC}
                disabled={loading || !Object.values(termsAccepted).every(Boolean)}
                className="px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? <div className="loading-spinner"></div> : t('submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCForm;