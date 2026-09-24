import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Profile } from './database';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  login: (credentials: AuthCredentials) => Promise<{ error: string | null }>;
  signup: (data: SignUpData) => Promise<{ error: string | null; needsEmailVerification?: boolean }>;
  logout: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

export type { User, Session, AuthError };
