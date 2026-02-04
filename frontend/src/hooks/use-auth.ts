"use client";

import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import type { User } from "@/types";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout, fetchUser } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/auth/login/", credentials);
    const { tokens } = response.data;

    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);

    await fetchUser();

    return response.data;
  };

  const register = async (data: RegisterData) => {
    const response = await api.post<AuthResponse>("/auth/register/", data);
    const { tokens } = response.data;

    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);

    await fetchUser();

    return response.data;
  };

  const logout = () => {
    storeLogout();
    window.location.href = "/login";
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    login,
    register,
    logout,
    fetchUser,
  };
}
