// API Core
export { default as api, tokenManager, handleApiError } from './api';
export type { ApiResponse, ApiError, PaginatedResponse } from './api';

// Auth Service
export { default as authService } from './authService';
export type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  KYCSubmission,
  KYCStatus,
  PasswordResetRequest,
  PasswordResetConfirm,
} from './authService';

// Loan Service
export { default as loanService } from './loanService';
export type {
  Currency,
  LoanApplication,
  Loan,
  Payment,
  LoanCalculation,
  DashboardStats,
  LoanApplicationRequest,
} from './loanService';

// Payment Service
export { default as paymentService } from './paymentService';
export type {
  PaymentMethod,
  PaymentIntent,
  PaymentTransaction,
  CreatePaymentIntentResponse,
  PaymentDashboardStats,
  UpcomingPayment,
} from './paymentService';

// Document Service
export { default as documentService } from './documentService';
export type {
  Document,
  ElectronicSignature,
  DocumentShare,
  SignDocumentRequest,
} from './documentService';

// Investment Service
export { default as investmentService } from './investmentService';
export type {
  InvestmentPlatform,
  InvestmentAccount,
  InvestmentPosition,
  InvestmentTransaction,
  PortfolioSummary,
  MarketData,
  InvestmentOpportunity,
  InvestmentAlert,
  CreatePositionRequest,
} from './investmentService';

// Pronova Service
export { default as pronovaService } from './pronovaService';
export type {
  PRNWallet,
  PRNTransaction,
  ElectronicCertificate,
  CapimaxInvestment,
  PRNWalletBalance,
} from './pronovaService';
