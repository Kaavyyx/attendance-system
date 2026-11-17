import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getCurrentUser, login, register, getBranches } from '../services/authService';
import { AuthState, BranchOption, UserProfile } from '../types';

interface AuthContextValue extends AuthState {
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: {
    full_name: string;
    employee_id: string;
    email: string;
    phone: string;
    password: string;
    branch_id: number;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  branches: BranchOption[];
  loadBranches: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'geo-face-token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const persistToken = useCallback(async (nextToken: string | null) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(TOKEN_KEY, nextToken || '');
      }
      return;
    }
    if (nextToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      let storedToken: string | null = null;
      if (Platform.OS === 'web') {
        storedToken = window.sessionStorage.getItem(TOKEN_KEY);
      } else {
        storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      }
      if (!storedToken) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const profile = await getCurrentUser(storedToken);
        setToken(storedToken);
        setUser(profile);
      } catch {
        await persistToken(null);
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [persistToken]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const response = await login({ identifier, password });
    await persistToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  }, [persistToken]);

  const signOut = useCallback(async () => {
    await persistToken(null);
    setToken(null);
    setUser(null);
  }, [persistToken]);

  const signUp = useCallback(async (data: {
    full_name: string;
    employee_id: string;
    email: string;
    phone: string;
    password: string;
    branch_id: number;
  }) => {
    const response = await register(data);
    await persistToken(null);
    setUser(response.user);
    setToken(null);
  }, [persistToken]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    const profile = await getCurrentUser(token);
    setUser(profile);
  }, [token]);

  const loadBranches = useCallback(async () => {
    const nextBranches = await getBranches();
    setBranches(nextBranches);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    signIn,
    signOut,
    signUp,
    refreshUser,
    branches,
    loadBranches,
  }), [branches, isLoading, signIn, signOut, signUp, refreshUser, token, user, loadBranches]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
