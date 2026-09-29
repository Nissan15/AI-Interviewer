import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type {
  InterviewSession,
  InterviewMessage,
  InterviewEvaluation,
} from '../../types/database';
import type { InterviewHistoryItem } from '../../types/interview';
import { assessmentService } from '../assessments/assessmentService';

// User-partitioned storage key generator to strictly isolate localStorage per candidate
const getIsolatedInterviewHistoryKey = (userId: string): string => `ai_interview_history_${userId}`;


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

  /**
   * Strictly partitions interview history storage by userId in local storage
   */
  async saveInterviewHistoryItem(
    userId: string,
    item: InterviewHistoryItem
  ): Promise<void> {
    if (!userId) return;
    try {
      const storageKey = getIsolatedInterviewHistoryKey(userId);
      const existingRaw = localStorage.getItem(storageKey);
      const existing: InterviewHistoryItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [
        item,
        ...existing.filter((i) => i.id !== item.id && i.sessionId !== item.sessionId),
      ].slice(0, 100);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[InterviewService] Local history item store warning:', e);
    }
  },

  /**
   * Retrieve all interview history items for a specific authenticated user.
   * Strictly filters by user_id = userId, guaranteeing data is only visible to this particular user.
   */
  async getUserInterviewHistory(
    userId: string
  ): Promise<{ data: InterviewHistoryItem[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: 'User ID is required to fetch interview history.' };
    }

    const itemsMap = new Map<string, InterviewHistoryItem>();

    // 1. Fetch unified interview reports stored in assessment_reports
    try {
      const { data: reports } = await assessmentService.getUserReports(userId, 'interview');
      for (const r of reports) {
        if (r.user_id !== userId) continue; // Strict User Isolation
        const rd = (r.report_data || {}) as Record<string, any>;
        const item: InterviewHistoryItem = {
          id: r.id,
          sessionId: rd.sessionId || r.attempt_id || r.id,
          userId: r.user_id,
          interviewType:
            rd.interviewType ||
            (r.category ? r.category.replace(' Round', '').toLowerCase() : 'general_hr'),
          difficulty: rd.difficulty || 'intermediate',
          durationSeconds: rd.durationSeconds || r.time_spent_seconds || 300,
          overallScore: Number(rd.overallScore ?? r.score ?? 0),
          communicationScore: Number(rd.communicationScore ?? r.score ?? 70),
          technicalScore: Number(rd.technicalScore ?? r.score ?? 70),
          confidenceScore: Number(rd.confidenceScore ?? 75),
          relevanceScore: Number(rd.relevanceScore ?? 75),
          problemSolvingScore: Number(rd.problemSolvingScore ?? 75),
          clarityScore: Number(rd.clarityScore ?? 75),
          overallFeedback:
            rd.overallFeedback ||
            `Interview assessment completed with score ${r.score}%.`,
          strengths:
            Array.isArray(rd.strengths) && rd.strengths.length > 0
              ? rd.strengths
              : ['Demonstrated clear articulation and professional structure'],
          improvements:
            Array.isArray(rd.improvements) && rd.improvements.length > 0
              ? rd.improvements
              : ['Support key arguments with specific technical or project metrics'],
          recommendedPreparationAreas: Array.isArray(rd.recommendedPreparationAreas)
            ? rd.recommendedPreparationAreas
            : [],
          questionAssessments: Array.isArray(rd.questionAssessments)
            ? rd.questionAssessments
            : [],
          exchanges: Array.isArray(rd.exchanges) ? rd.exchanges : [],
          createdAt: rd.completedAt || r.created_at,
          reportData: rd,
        };
        itemsMap.set(item.id, item);
        if (item.sessionId) itemsMap.set(item.sessionId, item);
      }
    } catch (e) {
      console.warn('[InterviewService] assessmentService query note:', e);
    }

    // 2. Fetch from Supabase interview_sessions & interview_evaluations if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: sessions } = await supabase
          .from('interview_sessions')
          .select('*, interview_evaluations(*)')
          .eq('user_id', userId)
          .order('started_at', { ascending: false });

        if (sessions) {
          for (const s of sessions) {
            if (s.user_id !== userId) continue; // Strict User Isolation
            const ev = Array.isArray(s.interview_evaluations)
              ? s.interview_evaluations[0]
              : s.interview_evaluations;

            const existing = itemsMap.get(s.id);
            if (!existing && ev) {
              const item: InterviewHistoryItem = {
                id: ev.id || s.id,
                sessionId: s.id,
                userId: s.user_id,
                interviewType: s.interview_type,
                difficulty: s.difficulty,
                durationSeconds: (s.duration || 15) * 60,
                overallScore: Number(ev.overall_score || 0),
                communicationScore: Number(ev.communication_score || 70),
                technicalScore: Number(ev.technical_score || 70),
                confidenceScore: Number(ev.confidence_score || 70),
                relevanceScore: Number(ev.relevance_score || 70),
                problemSolvingScore: Number(ev.problem_solving_score || 75),
                clarityScore: Number(ev.clarity_score || 75),
                overallFeedback: ev.feedback || 'Completed mock interview evaluation.',
                strengths: Array.isArray(ev.strengths) ? ev.strengths : [],
                improvements: Array.isArray(ev.improvements) ? ev.improvements : [],
                recommendedPreparationAreas: [],
                createdAt: ev.created_at || s.started_at,
              };
              itemsMap.set(item.id, item);
              itemsMap.set(s.id, item);
            }
          }
        }
      } catch (err) {
        console.warn('[InterviewService] Supabase interview history query note:', err);
      }
    }

    // 3. Check user-isolated local history partition
    try {
      const storageKey = getIsolatedInterviewHistoryKey(userId);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const localItems: InterviewHistoryItem[] = JSON.parse(raw);
        for (const item of localItems) {
          if (item.userId === userId) {
            // Strict User Isolation check
            if (!itemsMap.has(item.id) && !itemsMap.has(item.sessionId)) {
              itemsMap.set(item.id, item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[InterviewService] Local history query warning:', e);
    }

    // Deduplicate by unique id / sessionId
    const uniqueList: InterviewHistoryItem[] = [];
    const seenIds = new Set<string>();

    for (const item of itemsMap.values()) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        if (item.sessionId) seenIds.add(item.sessionId);
        // Final privacy safeguard: Strictly ensure item belongs to this particular user
        if (item.userId === userId) {
          uniqueList.push(item);
        }
      }
    }

    uniqueList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { data: uniqueList, error: null };
  },

  /**
   * Retrieve single interview report by ID, verifying user ownership
   */
  async getInterviewReportById(
    userId: string,
    reportId: string
  ): Promise<{ data: InterviewHistoryItem | null; error: string | null }> {
    if (!userId || !reportId) {
      return { data: null, error: 'User ID and Report ID required.' };
    }

    const { data: history } = await this.getUserInterviewHistory(userId);
    const found = history.find(
      (h) => (h.id === reportId || h.sessionId === reportId) && h.userId === userId
    );

    if (!found) {
      return {
        data: null,
        error: 'Interview report not found or does not belong to this user.',
      };
    }

    return { data: found, error: null };
  },
};

