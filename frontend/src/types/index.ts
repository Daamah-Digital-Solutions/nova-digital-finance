export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clientId: string;
  accountNumber: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  authProvider: string;
  createdAt: string;
  profile: UserProfile | null;
  kycStatus: string;
}

export interface UserProfile {
  phone: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  nationality: string;
  occupation: string;
  employer: string;
  incomeSource: string;
  monthlyIncome: number;
  investmentPurpose: string;
}

export interface KYCApplication {
  id: string;
  status: string;
  rejectionReason: string;
  documents: KYCDocument[];
  submittedAt: string;
  reviewedAt: string;
  createdAt: string;
}

export interface KYCDocument {
  id: string;
  documentType: string;
  file: string;
  fileName: string;
  fileSize: number;
  isVerified: boolean;
}

export interface FinancingApplication {
  id: string;
  applicationNumber: string;
  bronovaAmount: number;
  usdEquivalent: number;
  feePercentage: number;
  feeAmount: number;
  repaymentPeriodMonths: number;
  monthlyInstallment: number;
  status: string;
  ackTerms: boolean;
  ackFeeNonRefundable: boolean;
  ackRepaymentSchedule: boolean;
  ackRiskDisclosure: boolean;
  installments: Installment[];
  createdAt: string;
}

export interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  paidAt: string;
}

export interface Payment {
  id: string;
  financingId: string;
  installmentId: string;
  paymentType: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  transactionReference: string;
  createdAt: string;
}

export interface Document {
  id: string;
  documentType: string;
  documentNumber: string;
  title: string;
  file: string;
  verificationCode: string;
  isSigned: boolean;
  downloadUrl: string;
  createdAt: string;
}

export interface SignatureRequest {
  id: string;
  documentTitle: string;
  documentType: string;
  documentNumber: string;
  status: string;
  expiresAt: string;
  signedAt: string;
}

export interface ClientRequest {
  id: string;
  financingId: string;
  requestType: string;
  status: string;
  subject: string;
  details: string;
  description: string;
  adminResponse: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  channel: string;
  category: string;
  isRead: boolean;
  readAt: string;
  actionUrl: string;
  createdAt: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaDescription: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface CalculatorResult {
  bronovaAmount: number;
  usdEquivalent: number;
  feePercentage: number;
  feeAmount: number;
  repaymentPeriodMonths: number;
  monthlyInstallment: number;
  totalRepayment: number;
  totalCost: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail: string;
  errors: Record<string, string[]>;
}
