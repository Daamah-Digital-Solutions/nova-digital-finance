/**
 * Tests for AuthContext
 * Tests authentication state management, login, logout, and user management
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the auth service
jest.mock('../services/authService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    getStoredUser: jest.fn(),
    submitKYC: jest.fn(),
    getKYCStatus: jest.fn(),
  },
}));

// Mock the API module
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
  tokenManager: {
    isAuthenticated: jest.fn(() => false),
    getAccessToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

import authService from '../services/authService';
import { tokenManager } from '../services/api';

const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  kyc_status: 'approved' as const,
  is_admin: false,
  created_at: '2025-01-01T00:00:00Z',
};

const mockAuthResponse = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
  user: mockUser,
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getStoredUser as jest.Mock).mockReturnValue(null);
  });

  it('provides initial unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('throws error when used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('handles login failure', async () => {
      const errorMessage = 'Invalid credentials';
      (authService.login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('sets loading state during login', async () => {
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      (authService.login as jest.Mock).mockReturnValueOnce(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login('test@example.com', 'password123').catch(() => {});
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(mockAuthResponse);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      password_confirm: 'password123',
      username: 'newuser',
      first_name: 'New',
      last_name: 'User',
    };

    it('successfully registers user', async () => {
      (authService.register as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register(registerData);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles registration failure', async () => {
      const errorMessage = 'Email already exists';
      (authService.register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register(registerData);
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('logs out user and clears state', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (authService.logout as jest.Mock).mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('updates user data', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      act(() => {
        result.current.updateUser({ first_name: 'Updated' });
      });

      expect(result.current.user?.first_name).toBe('Updated');
    });

    it('does nothing when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ first_name: 'Updated' });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const errorMessage = 'Test error';
      (authService.login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger error
      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        })
      ).rejects.toThrow();

      expect(result.current.error).toBe(errorMessage);

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('initialization', () => {
    it('restores user from stored data on mount', async () => {
      (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
      (authService.getProfile as jest.Mock).mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears state when stored token is invalid', async () => {
      (tokenManager.isAuthenticated as jest.Mock).mockReturnValue(true);
      (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
      (authService.getProfile as jest.Mock).mockRejectedValueOnce(new Error('Token expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(tokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('KYC', () => {
    it('submits KYC and refreshes user', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (authService.submitKYC as jest.Mock).mockResolvedValueOnce({ success: true });
      (authService.getProfile as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        kyc_status: 'pending',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const kycData = {
        document_type: 'passport',
        document_number: '123456789',
        document_front: new File([''], 'front.jpg'),
      };

      await act(async () => {
        await result.current.submitKYC(kycData);
      });

      expect(authService.submitKYC).toHaveBeenCalledWith(kycData);
    });

    it('gets KYC status', async () => {
      const kycStatus = {
        status: 'approved',
        reviewed_at: '2025-01-15T10:00:00Z',
      };
      (authService.getKYCStatus as jest.Mock).mockResolvedValueOnce(kycStatus);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let status;
      await act(async () => {
        status = await result.current.getKYCStatus();
      });

      expect(status).toEqual(kycStatus);
    });
  });
});
