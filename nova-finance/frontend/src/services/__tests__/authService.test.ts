import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as authService from '../authService';

// Create axios mock
const mock = new MockAdapter(axios);

describe('AuthService', () => {
  beforeEach(() => {
    mock.reset();
    // Clear localStorage
    localStorage.clear();
    // Clear any existing tokens
    delete (axios.defaults.headers as any).common['Authorization'];
  });

  afterAll(() => {
    mock.restore();
  });

  describe('register', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123',
      password_confirm: 'testpass123',
      first_name: 'Test',
      last_name: 'User'
    };

    test('successful registration', async () => {
      const responseData = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        }
      };

      mock.onPost('/api/auth/register/').reply(201, responseData);

      const result = await authService.register(registerData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.post[0].data).toBe(JSON.stringify(registerData));
    });

    test('registration with validation errors', async () => {
      const errorResponse = {
        username: ['This username is already taken'],
        email: ['This email is already registered']
      };

      mock.onPost('/api/auth/register/').reply(400, errorResponse);

      await expect(authService.register(registerData)).rejects.toThrow();
    });

    test('registration with server error', async () => {
      mock.onPost('/api/auth/register/').reply(500, { error: 'Internal server error' });

      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const loginData = {
      username: 'testuser',
      password: 'testpass123'
    };

    test('successful login', async () => {
      const responseData = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          kyc_status: 'approved'
        }
      };

      mock.onPost('/api/auth/login/').reply(200, responseData);

      const result = await authService.login(loginData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(mock.history.post[0].data).toBe(JSON.stringify(loginData));
    });

    test('login with invalid credentials', async () => {
      mock.onPost('/api/auth/login/').reply(401, {
        non_field_errors: ['Invalid credentials']
      });

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    test('login stores tokens', async () => {
      const responseData = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: '1', username: 'testuser' }
      };

      mock.onPost('/api/auth/login/').reply(200, responseData);

      await authService.login(loginData);

      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'access-token');
      localStorage.setItem('refresh_token', 'refresh-token');
    });

    test('successful logout', async () => {
      mock.onPost('/api/auth/logout/').reply(205);

      await authService.logout();

      expect(mock.history.post).toHaveLength(1);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    test('logout clears tokens even on server error', async () => {
      mock.onPost('/api/auth/logout/').reply(500);

      // Should not throw, just clear tokens
      await authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    test('successful token refresh', async () => {
      localStorage.setItem('refresh_token', 'refresh-token');
      
      const responseData = {
        access: 'new-access-token'
      };

      mock.onPost('/api/auth/token/refresh/').reply(200, responseData);

      const result = await authService.refreshToken();

      expect(result).toEqual(responseData);
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });

    test('token refresh with invalid refresh token', async () => {
      localStorage.setItem('refresh_token', 'invalid-token');
      
      mock.onPost('/api/auth/token/refresh/').reply(401, {
        detail: 'Token is invalid or expired'
      });

      await expect(authService.refreshToken()).rejects.toThrow();
      
      // Should clear tokens on refresh failure
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    test('gets current user with valid token', async () => {
      localStorage.setItem('access_token', 'valid-token');
      
      const userData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        kyc_status: 'approved'
      };

      mock.onGet('/api/auth/me/').reply(200, userData);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(userData);
      expect(mock.history.get).toHaveLength(1);
    });

    test('getCurrentUser with invalid token', async () => {
      localStorage.setItem('access_token', 'invalid-token');
      
      mock.onGet('/api/auth/me/').reply(401, {
        detail: 'Token is invalid'
      });

      await expect(authService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    const profileData = {
      first_name: 'Updated',
      last_name: 'Name'
    };

    test('successful profile update', async () => {
      localStorage.setItem('access_token', 'valid-token');
      
      const updatedUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Updated',
        last_name: 'Name'
      };

      mock.onPatch('/api/auth/me/').reply(200, updatedUser);

      const result = await authService.updateProfile(profileData);

      expect(result).toEqual(updatedUser);
      expect(mock.history.patch).toHaveLength(1);
      expect(mock.history.patch[0].data).toBe(JSON.stringify(profileData));
    });
  });

  describe('token management', () => {
    test('getAccessToken returns stored token', () => {
      localStorage.setItem('access_token', 'test-token');
      
      const token = authService.getAccessToken();
      
      expect(token).toBe('test-token');
    });

    test('getRefreshToken returns stored token', () => {
      localStorage.setItem('refresh_token', 'refresh-token');
      
      const token = authService.getRefreshToken();
      
      expect(token).toBe('refresh-token');
    });

    test('isAuthenticated checks for access token', () => {
      expect(authService.isAuthenticated()).toBe(false);
      
      localStorage.setItem('access_token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    test('clearTokens removes all tokens', () => {
      localStorage.setItem('access_token', 'access-token');
      localStorage.setItem('refresh_token', 'refresh-token');
      
      authService.clearTokens();
      
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('axios interceptors', () => {
    test('request interceptor adds auth header', async () => {
      localStorage.setItem('access_token', 'test-token');
      
      // Make a request to trigger interceptor
      mock.onGet('/api/test/').reply(200, {});
      
      await axios.get('/api/test/');
      
      expect(mock.history.get[0].headers).toMatchObject({
        Authorization: 'Bearer test-token'
      });
    });

    test('response interceptor handles token refresh', async () => {
      localStorage.setItem('access_token', 'expired-token');
      localStorage.setItem('refresh_token', 'valid-refresh');
      
      // First request fails with 401
      mock.onGet('/api/test/').replyOnce(401, { detail: 'Token expired' });
      
      // Refresh token request succeeds
      mock.onPost('/api/auth/token/refresh/').reply(200, {
        access: 'new-access-token'
      });
      
      // Retry original request succeeds
      mock.onGet('/api/test/').reply(200, { data: 'success' });
      
      const result = await axios.get('/api/test/');
      
      expect(result.data).toEqual({ data: 'success' });
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });
  });

  describe('KYC functions', () => {
    test('uploadKYCDocument', async () => {
      localStorage.setItem('access_token', 'valid-token');
      
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.pdf');
      formData.append('document_type', 'identity_card');
      
      const responseData = {
        id: '1',
        document_type: 'identity_card',
        status: 'pending'
      };
      
      mock.onPost('/api/auth/kyc/documents/').reply(201, responseData);
      
      const result = await authService.uploadKYCDocument(formData);
      
      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
    });

    test('getKYCStatus', async () => {
      localStorage.setItem('access_token', 'valid-token');
      
      const statusData = {
        kyc_status: 'approved',
        required_documents: [],
        completed_documents: ['identity_card', 'proof_of_address']
      };
      
      mock.onGet('/api/auth/kyc/status/').reply(200, statusData);
      
      const result = await authService.getKYCStatus();
      
      expect(result).toEqual(statusData);
    });
  });

  describe('error handling', () => {
    test('handles network errors', async () => {
      mock.onPost('/api/auth/login/').networkError();
      
      await expect(authService.login({
        username: 'test',
        password: 'test'
      })).rejects.toThrow();
    });

    test('handles timeout errors', async () => {
      mock.onPost('/api/auth/login/').timeout();
      
      await expect(authService.login({
        username: 'test',
        password: 'test'
      })).rejects.toThrow();
    });

    test('handles rate limiting', async () => {
      mock.onPost('/api/auth/login/').reply(429, {
        detail: 'Too many requests'
      });
      
      await expect(authService.login({
        username: 'test',
        password: 'test'
      })).rejects.toThrow();
    });
  });
});