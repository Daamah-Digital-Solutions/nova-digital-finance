export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  client_id: string;
  account_number: string;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  auth_provider: string;
  created_at: string;
  profile: UserProfile | null;
  kyc_status: string;
}

export interface UserProfile {
  phone: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  nationality: string;
  occupation: string;
  employer: string;
  income_source: string;
  monthly_income: number;
  investment_purpose: string;
}

export interface KYCApplication {
  id: string;
  status: string;
  rejection_reason: string;
  documents: KYCDocument[];
  submitted_at: string;
  reviewed_at: string;
  created_at: string;
}

export interface KYCDocument {
  id: string;
  document_type: string;
  file: string;
  file_name: string;
  file_size: number;
  is_verified: boolean;
}

export interface FinancingApplication {
  id: string;
  application_number: string;
  bronova_amount: number;
  usd_equivalent: number;
  fee_percentage: number;
  fee_amount: number;
  repayment_period_months: number;
  monthly_installment: number;
  status: string;
  ack_terms: boolean;
  ack_fee_non_refundable: boolean;
  ack_repayment_schedule: boolean;
  ack_risk_disclosure: boolean;
  installments: Installment[];
  created_at: string;
}

export interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  paid_at: string;
}

export interface Payment {
  id: string;
  financing_id: string;
  installment_id: string;
  payment_type: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_reference: string;
  created_at: string;
}

export interface Document {
  id: string;
  document_type: string;
  document_number: string;
  title: string;
  file: string;
  verification_code: string;
  is_signed: boolean;
  download_url: string;
  created_at: string;
}

export interface SignatureRequest {
  id: string;
  document_title: string;
  document_type: string;
  document_number: string;
  status: string;
  expires_at: string;
  signed_at: string;
}

export interface ClientRequest {
  id: string;
  financing_id: string;
  request_type: string;
  status: string;
  subject: string;
  details: string;
  description: string;
  admin_response: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  channel: string;
  category: string;
  is_read: boolean;
  read_at: string;
  action_url: string;
  created_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface CalculatorResult {
  bronova_amount: number;
  usd_equivalent: number;
  fee_percentage: number;
  fee_amount: number;
  repayment_period_months: number;
  monthly_installment: number;
  total_repayment: number;
  total_cost: number;
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
