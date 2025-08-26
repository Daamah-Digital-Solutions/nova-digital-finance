// User and Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Common form types
export interface FormError {
  field: string;
  message: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Theme and language types
export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ar';

// Navigation types
export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
}

// Dashboard types
export interface DashboardStats {
  total_borrowed_usd: number;
  active_loans: number;
  total_paid_usd: number;
  total_remaining_usd: number;
  next_payment_due: string | null;
  next_payment_amount: number | null;
  total_applications: number;
}

export default {};