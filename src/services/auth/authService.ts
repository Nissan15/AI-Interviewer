import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { profileService } from '../profiles/profileService';

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: 'Supabase connection is not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('[Supabase Auth Error]', error);
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
          return { user: null, session: null, error: 'Invalid email or password.' };
        }
        if (msg.includes('email not confirmed')) {
          return {
            user: null,
            session: null,
            error: 'Email address has not been confirmed yet. Please verify your email via the link sent to your inbox, or disable "Confirm email" in your Supabase Auth settings to sign in immediately.',
          };
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          return {
            user: null,
            session: null,
            error: 'Network connection issue. Please check your internet connection.',
          };
        }
        return { user: null, session: null, error: error.message || 'Invalid email or password.' };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: unknown) {
      console.error('[Supabase Auth Exception]', err);
      const message = err instanceof Error ? err.message : 'Unable to connect to the authentication service. Please try again later.';
      return {
        user: null,
        session: null,
        error: message,
      };
    }
  },

  /**
   * Sign up new candidate
   */
  async signup(
    email: string,
    password: string,
    fullName: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    needsEmailVerification: boolean;
    error: string | null;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        needsEmailVerification: false,
        error: 'Supabase connection is not configured. Please add your credentials to .env',
      };
    }

    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        console.error('[Supabase Signup Error]', error);
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          return {
            user: null,
            session: null,
            needsEmailVerification: false,
            error: 'An account with this email address already exists. Try signing in instead.',
          };
        }
        if (msg.includes('password should be at least')) {
          return {
            user: null,
            session: null,
            needsEmailVerification: false,
            error: 'Password must be at least 6 characters long.',
          };
        }
        return {
          user: null,
          session: null,
          needsEmailVerification: false,
          error: error.message || 'Failed to create account. Please try again.',
        };
      }

      // If user is returned and session exists, create profile record if not auto-created by database trigger
      if (data.user && data.session) {
        try {
          await profileService.createProfile({
            user_id: data.user.id,
            full_name: trimmedName,
          });
        } catch {
          // Non-blocking if profile trigger exists
        }
      }

      const needsVerification = !data.session && !!data.user;

      return {
        user: data.user,
        session: data.session,
        needsEmailVerification: needsVerification,
        error: null,
      };
    } catch (err: unknown) {
      console.error('[Supabase Signup Exception]', err);
      const message = err instanceof Error ? err.message : 'Registration service error. Please try again later.';
      return {
        user: null,
        session: null,
        needsEmailVerification: false,
        error: message,
      };
    }
  },

  /**
   * Log out candidate
   */
  async logout(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch {
      return { error: 'Failed to sign out. Please try again.' };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Supabase connection is not configured. Please add your credentials to .env',
      };
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        return { error: error.message || 'Unable to send password reset link.' };
      }

      return { error: null };
    } catch {
      return { error: 'Failed to send password reset request. Please try again.' };
    }
  },

  /**
   * Update password for current session
   */
  async updatePassword(password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Supabase connection is not configured. Please add your credentials to .env',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: error.message || 'Failed to update password.' };
      }

      return { error: null };
    } catch {
      return { error: 'Failed to update password. Please try again.' };
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Get active session
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
