import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type {
  TechnicalQuestion,
  CodingProblem,
  AptitudeQuestion,
  AssessmentAttempt,
  AssessmentAnswer,
} from '../../types/database';

export const assessmentService = {
  /**
   * Fetch technical questions (returns empty array if zero records exist)
   */
  async getTechnicalQuestions(category?: string): Promise<{ data: TechnicalQuestion[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    try {
      let query = supabase.from('technical_questions').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to load technical questions.' };
    }
  },

  /**
   * Fetch coding problems (returns empty array if zero records exist)
   */
  async getCodingProblems(): Promise<{ data: CodingProblem[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    try {
      const { data, error } = await supabase.from('coding_problems').select('*');
      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to load coding problems.' };
    }
  },

  /**
   * Fetch aptitude questions (returns empty array if zero records exist)
   */
  async getAptitudeQuestions(category?: string): Promise<{ data: AptitudeQuestion[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    try {
      let query = supabase.from('aptitude_questions').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to load aptitude questions.' };
    }
  },

  /**
   * Create an assessment attempt for the current candidate
   */
  async createAttempt(
    userId: string,
    type: 'technical' | 'aptitude' | 'coding'
  ): Promise<{ data: AssessmentAttempt | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not connected.' };
    try {
      const { data, error } = await supabase
        .from('assessment_attempts')
        .insert({
          user_id: userId,
          assessment_type: type,
          status: 'in_progress',
        })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to create assessment attempt.' };
    }
  },

  /**
   * Record answer for an assessment question
   */
  async submitAnswer(answer: {
    attempt_id: string;
    question_id: string;
    selected_answer: string;
    is_correct: boolean;
    time_taken: number;
  }): Promise<{ data: AssessmentAnswer | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { data: null, error: 'Database not connected.' };
    try {
      const { data, error } = await supabase
        .from('assessment_answers')
        .insert({
          attempt_id: answer.attempt_id,
          question_id: answer.question_id,
          selected_answer: answer.selected_answer,
          is_correct: answer.is_correct,
          time_taken: answer.time_taken,
        })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to submit answer.' };
    }
  },
};
