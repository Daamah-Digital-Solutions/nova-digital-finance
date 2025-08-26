import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  phone_number: string;
  preferred_language: string;
  is_kyc_verified: boolean;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  client_number: string;
  profile?: UserProfile;
  created_at: string;
}

interface UserProfile {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address_line_1: string;
  city: string;
  country: string;
  occupation: string;
  annual_income: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthAction {
  type: 'SET_LOADING' | 'SET_USER' | 'LOGOUT';
  payload?: any;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  isAuthenticated: false,
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}>({
  state: initialState,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await authService.getProfile();
        dispatch({ type: 'SET_USER', payload: userData });
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      dispatch({ type: 'SET_USER', payload: response.user });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      dispatch({ type: 'SET_USER', payload: response.user });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ 
      type: 'SET_USER', 
      payload: { ...state.user, ...userData } 
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};