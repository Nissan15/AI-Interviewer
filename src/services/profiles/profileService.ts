import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { Profile } from '../../types/database';

export const profileService = {
  /**
   * Fetch user profile by user_id
   */
  async getProfile(userId: string): Promise<{ data: Profile | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to fetch candidate profile.' };
    }
  },

  /**
   * Create candidate profile
   */
  async createProfile(profile: {
    user_id: string;
    full_name: string;
    avatar_url?: string | null;
  }): Promise<{ data: Profile | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: profile.user_id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url ?? null,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to create candidate profile.' };
    }
  },

  /**
   * Update candidate profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
  ): Promise<{ data: Profile | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to update candidate profile.' };
    }
  },
};
