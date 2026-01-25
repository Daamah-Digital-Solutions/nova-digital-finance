import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import authService, { User, LoginRequest, RegisterRequest, KYCSubmission, KYCStatus } from '../services/authService';
import { tokenManager } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  submitKYC: (kycData: KYCSubmission) => Promise<void>;
  getKYCStatus: () => Promise<KYCStatus>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  // Initialize auth state from stored data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens
        if (tokenManager.isAuthenticated()) {
          // Try to get stored user first
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }

          // Refresh user data from server
          try {
            const freshUser = await authService.getProfile();
            setUser(freshUser);
          } catch (err) {
            // Token might be expired, clear and redirect
            console.error('Failed to fetch user profile:', err);
            tokenManager.clearTokens();
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        tokenManager.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(userData);
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('nova-user', JSON.stringify(updatedUser));
  }, [user]);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!tokenManager.isAuthenticated()) return;

    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, []);

  const submitKYC = useCallback(async (kycData: KYCSubmission): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.submitKYC(kycData);

      // Refresh user to get updated KYC status
      await refreshUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'KYC submission failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const getKYCStatus = useCallback(async (): Promise<KYCStatus> => {
    try {
      return await authService.getKYCStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get KYC status';
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    submitKYC,
    getKYCStatus,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export User type for convenience
export type { User } from '../services/authService';
