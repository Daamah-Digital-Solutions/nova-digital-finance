import api, { tokenManager, handleApiError } from './api';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_kyc_verified: boolean;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  client_number: string;
  preferred_language: string;
  created_at: string;
  is_staff?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export interface KYCSubmission {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  occupation: string;
  annual_income?: number;
  employer_name?: string;
  risk_tolerance: 'low' | 'medium' | 'high';
}

export interface KYCStatus {
  kyc_status: string;
  is_kyc_verified: boolean;
  documents_count: number;
  verified_documents_count: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Auth Service
const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', credentials);
      const { access, refresh, user } = response.data;

      // Store tokens and user data
      tokenManager.setTokens(access, refresh);
      localStorage.setItem('nova-user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Register
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await api.post<RegisterResponse>('/auth/register/', userData);
      const { access, refresh, user } = response.data;

      // Store tokens and user data
      tokenManager.setTokens(access, refresh);
      localStorage.setItem('nova-user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Logout
  logout: (): void => {
    tokenManager.clearTokens();
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/profile/');
      localStorage.setItem('nova-user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await api.patch<User>('/auth/profile/', data);
      localStorage.setItem('nova-user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Submit KYC information
  submitKYC: async (kycData: KYCSubmission): Promise<{ message: string; profile: unknown }> => {
    try {
      const response = await api.post('/auth/kyc/submit/', kycData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get KYC status
  getKYCStatus: async (): Promise<KYCStatus> => {
    try {
      const response = await api.get<KYCStatus>('/auth/kyc/status/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Upload KYC document
  uploadKYCDocument: async (file: File, documentType: string): Promise<unknown> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('file_name', file.name);
      formData.append('file_size', file.size.toString());

      const response = await api.post('/auth/kyc/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get KYC documents
  getKYCDocuments: async (): Promise<unknown[]> => {
    try {
      const response = await api.get('/auth/kyc/documents/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Verify password reset token
  verifyPasswordResetToken: async (token: string): Promise<{ valid: boolean; email?: string; message: string }> => {
    try {
      const response = await api.post('/auth/password-reset/verify/', { token });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Confirm password reset
  confirmPasswordReset: async (data: PasswordResetConfirm): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/password-reset/confirm/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get dashboard data
  getDashboardData: async (): Promise<unknown> => {
    try {
      const response = await api.get('/auth/dashboard/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return tokenManager.isAuthenticated();
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userJson = localStorage.getItem('nova-user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  },
};

export default authService;
