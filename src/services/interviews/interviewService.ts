import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type {
  InterviewSession,
  InterviewMessage,
  InterviewEvaluation,
} from '../../types/database';

export const interviewService = {
  /**
   * Get all interview sessions for the authenticated user
   */
  async getUserSessions(userId: string): Promise<{ data: InterviewSession[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to retrieve interview sessions.' };
    }
  },

  /**
   * Create an interview session
   */
  async createSession(session: {
    user_id: string;
    resume_id?: string | null;
    interview_type: string;
    difficulty: string;
  }): Promise<{ data: InterviewSession | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not connected.' };
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: session.user_id,
          resume_id: session.resume_id ?? null,
          interview_type: session.interview_type,
          difficulty: session.difficulty,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to create interview session.' };
    }
  },

  /**
   * Add message to interview session
   */
  async addMessage(msg: {
    session_id: string;
    role: 'ai' | 'user' | 'system';
    content: string;
  }): Promise<{ data: InterviewMessage | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not connected.' };
    try {
      const { data, error } = await supabase
        .from('interview_messages')
        .insert({
          session_id: msg.session_id,
          role: msg.role,
          content: msg.content,
        })
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to save interview message.' };
    }
  },

  /**
   * Get messages for an interview session (RLS validated)
   */
  async getSessionMessages(sessionId: string): Promise<{ data: InterviewMessage[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to retrieve messages.' };
    }
  },

  /**
   * Save session evaluation
   */
  async saveEvaluation(
    evalData: Omit<InterviewEvaluation, 'id' | 'created_at'>
  ): Promise<{ data: InterviewEvaluation | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not connected.' };
    try {
      const { data, error } = await supabase
        .from('interview_evaluations')
        .insert(evalData)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to save evaluation.' };
    }
  },
};
