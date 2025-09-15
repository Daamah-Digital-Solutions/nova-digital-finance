import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isKYCCompleted: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('nova-auth-token');
        const savedUser = localStorage.getItem('nova-user');

        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Validate token with backend (in a real app)
          // await validateToken(token);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('nova-auth-token');
        localStorage.removeItem('nova-user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual API endpoint
      const response = await mockLogin(email, password);
      
      const { user: userData, token } = response;
      
      // Store auth data
      localStorage.setItem('nova-auth-token', token);
      localStorage.setItem('nova-user', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual API endpoint
      const response = await mockRegister(userData);
      
      const { user: newUser, token } = response;
      
      // Store auth data
      localStorage.setItem('nova-auth-token', token);
      localStorage.setItem('nova-user', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nova-auth-token');
    localStorage.removeItem('nova-user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('nova-user', JSON.stringify(updatedUser));
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!user) return;
      
      // Mock API call to refresh user data
      const refreshedUser = await mockRefreshUser(user.id);
      setUser(refreshedUser);
      localStorage.setItem('nova-user', JSON.stringify(refreshedUser));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
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

// Mock API functions (replace with actual API calls)
async function mockLogin(email: string, password: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === 'admin@nova.com' && password === 'admin123') {
    return {
      user: {
        id: '1',
        email: 'admin@nova.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+1234567890',
        isKYCCompleted: true,
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      token: 'mock-admin-token',
    };
  }
  
  if (email === 'user@nova.com' && password === 'user123') {
    return {
      user: {
        id: '2',
        email: 'user@nova.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        isKYCCompleted: false,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      token: 'mock-user-token',
    };
  }
  
  throw new Error('Invalid credentials');
}

async function mockRegister(userData: RegisterData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    user: {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      isKYCCompleted: false,
      role: 'user' as const,
      createdAt: new Date().toISOString(),
    },
    token: `mock-token-${Date.now()}`,
  };
}

async function mockRefreshUser(userId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return updated user data
  return {
    id: userId,
    email: 'user@nova.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    isKYCCompleted: true, // KYC might have been completed
    role: 'user' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  };
}