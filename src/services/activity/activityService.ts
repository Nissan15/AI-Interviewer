import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { UserActivity } from '../../types/database';

export interface ActivityInput {
  activity_type:
    | 'assessment_completed'
    | 'quiz_completed'
    | 'coding_submitted'
    | 'interview_started'
    | 'interview_completed'
    | 'resume_uploaded'
    | 'profile_updated';
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

// User-partitioned storage key generator to strictly isolate localStorage per candidate
const getIsolatedStorageKey = (userId: string): string => `ai_user_activities_${userId}`;

export const activityService = {
  /**
   * Log an activity for a specific user.
   * Strictly records under the provided userId to prevent cross-user contamination.
   */
  async logActivity(
    userId: string,
    activity: ActivityInput
  ): Promise<{ data: UserActivity | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'User ID is required to log user activity.' };
    }

    const newActivity: UserActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      activity_type: activity.activity_type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata || null,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately store in user-isolated local cache (guaranteed per-user partition)
    try {
      const storageKey = getIsolatedStorageKey(userId);
      const existingRaw = localStorage.getItem(storageKey);
      const existing: UserActivity[] = existingRaw ? JSON.parse(existingRaw) : [];
      // Keep most recent 50 activities for this user
      const updated = [newActivity, ...existing.filter((a) => a.id !== newActivity.id)].slice(0, 50);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[ActivityService] Local storage write warning:', e);
    }

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_activities')
          .insert({
            user_id: userId,
            activity_type: activity.activity_type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata || {},
          })
          .select()
          .single();

        if (!error && data) {
          return { data: data as UserActivity, error: null };
        }
      } catch (err: any) {
        // Fallback to local partition already stored
        console.warn('[ActivityService] Supabase insert note:', err.message || err);
      }
    }

    return { data: newActivity, error: null };
  },

  /**
   * Fetch activities for a specific user only.
   * Enforces .eq('user_id', userId) on database queries and reads exclusively from
   * that user's isolated local partition.
   */
  async getUserActivities(
    userId: string,
    limit: number = 20
  ): Promise<{ data: UserActivity[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: null };
    }

    let remoteActivities: UserActivity[] = [];

    // 1. Try querying Supabase with strict user_id scoping
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          remoteActivities = data as UserActivity[];
        }
      } catch (err: any) {
        console.warn('[ActivityService] Supabase query note:', err.message || err);
      }
    }

    // 2. Load from isolated local storage partition
    let localActivities: UserActivity[] = [];
    try {
      const storageKey = getIsolatedStorageKey(userId);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        localActivities = JSON.parse(raw);
        // Double-check user isolation safeguard
        localActivities = localActivities.filter((a) => a.user_id === userId);
      }
    } catch {
      localActivities = [];
    }

    // 3. Merge deduplicated list, strictly belonging to this user
    const map = new Map<string, UserActivity>();
    remoteActivities.forEach((a) => map.set(a.id, a));
    localActivities.forEach((a) => {
      if (!map.has(a.id)) {
        map.set(a.id, a);
      }
    });

    const combined = Array.from(map.values())
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return { data: combined, error: null };
  },

  /**
   * Clear all activities for a specific user
   */
  async clearUserActivities(userId: string): Promise<void> {
    if (!userId) return;

    try {
      localStorage.removeItem(getIsolatedStorageKey(userId));
    } catch {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('user_activities').delete().eq('user_id', userId);
      } catch {}
    }
  },
};
