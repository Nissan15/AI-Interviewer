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
    duration?: number;
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
          duration: session.duration ?? 15,
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
   * Record question into interview_questions
   */
  async recordQuestion(q: {
    session_id: string;
    user_id: string;
    question_number: number;
    question_text: string;
    question_type?: string;
    topic?: string;
    difficulty?: string;
    is_follow_up?: boolean;
    follow_up_reason?: string;
  }): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data } = await (supabase as any)
        .from('interview_questions')
        .insert({
          session_id: q.session_id,
          user_id: q.user_id,
          question_number: q.question_number,
          question_text: q.question_text,
          question_type: q.question_type || 'general',
          topic: q.topic || 'General',
          difficulty: q.difficulty || 'medium',
          is_follow_up: Boolean(q.is_follow_up),
          follow_up_reason: q.follow_up_reason || null,
        })
        .select('id')
        .single();
      return data?.id || null;
    } catch {
      return null;
    }
  },

  /**
   * Record answer into interview_answers
   */
  async recordAnswer(a: {
    question_id: string;
    session_id: string;
    user_id: string;
    answer_text: string;
    technical_accuracy?: number;
    communication?: number;
    clarity?: number;
    depth?: number;
    problem_solving?: number;
    confidence?: number;
    quick_feedback?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await (supabase as any).from('interview_answers').insert(a);
    } catch (err) {
      console.warn('Could not record answer:', err);
    }
  },

  /**
   * Save session evaluation
   */
  async saveEvaluation(
    evalData: any
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

  /**
   * Save learning recommendations to Supabase
   */
  async saveLearningRecommendations(
    userId: string,
    sessionId: string | null,
    recommendations: any[]
  ): Promise<void> {
    if (!isSupabaseConfigured() || !recommendations || recommendations.length === 0) return;
    try {
      const rows = recommendations.map((r) => ({
        user_id: userId,
        session_id: sessionId,
        current_skill: r.currentSkill,
        weak_area: r.weakArea,
        recommended_topic: r.recommendedTopic,
        practice_task: r.practiceTask,
        mock_test_focus: r.mockTestFocus,
        reassessment_criteria: r.reassessmentCriteria,
        priority: r.priority || 'high',
      }));
      await (supabase as any).from('learning_recommendations').insert(rows);
    } catch (err) {
      console.warn('Could not save learning recommendations:', err);
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
};
