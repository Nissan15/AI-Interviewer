import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type {
  AuthContextType,
  AuthCredentials,
  SignUpData,
} from '../types/auth';
import type { Profile } from '../types/database';
import { authService } from '../services/auth/authService';
import { profileService } from '../services/profiles/profileService';
import { isSupabaseConfigured } from '../lib/supabase/client';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isConfigured) return;
    try {
      const { data } = await profileService.getProfile(userId);
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, [isConfigured]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Initial session load
    const initializeAuth = async () => {
      if (!isConfigured) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const initialSession = await authService.getSession();
        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured, fetchProfile]);

  const login = async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials.email, credentials.password);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await fetchProfile(result.user.id);
      }
      return { error: result.error };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignUpData) => {
    setLoading(true);
    try {
      const result = await authService.signup(data.email, data.password, data.fullName);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await fetchProfile(result.user.id);
      }
      return {
        error: result.error,
        needsEmailVerification: result.needsEmailVerification,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const result = await authService.logout();
      setUser(null);
      setSession(null);
      setProfile(null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  const updatePassword = async (password: string) => {
    return authService.updatePassword(password);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(session && user),
    isConfigured,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
