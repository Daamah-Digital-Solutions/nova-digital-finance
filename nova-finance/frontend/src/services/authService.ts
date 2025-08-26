import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  async register(userData: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    phone_number?: string;
    preferred_language?: string;
  }) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  async updateProfile(userData: any) {
    const response = await api.patch('/auth/profile/', userData);
    return response.data;
  },

  async submitKYC(kycData: {
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
    annual_income: string;
    employer_name?: string;
    investment_experience?: string;
    risk_tolerance: 'low' | 'medium' | 'high';
  }) {
    const response = await api.post('/auth/kyc/submit/', kycData);
    return response.data;
  },

  async uploadKYCDocument(formData: FormData) {
    const response = await api.post('/auth/kyc/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getKYCDocuments() {
    const response = await api.get('/auth/kyc/documents/');
    return response.data;
  },

  async getKYCStatus() {
    const response = await api.get('/auth/kyc/status/');
    return response.data;
  },

  async getDashboardData() {
    const response = await api.get('/auth/dashboard/');
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export default api;