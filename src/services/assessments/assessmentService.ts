import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type {
  TechnicalQuestion,
  CodingProblem,
  AptitudeQuestion,
  AssessmentAttempt,
  AssessmentAnswer,
  AssessmentReport,
  Json,
} from '../../types/database';
import { activityService } from '../activity/activityService';

export interface AssessmentReportInput {
  assessmentType: 'aptitude' | 'technical' | 'coding' | 'interview';
  title: string;
  category: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers?: number;
  accuracy: number;
  timeSpentSeconds: number;
  reportData?: Record<string, any>;
  answersBreakdown?: Array<{
    questionId: string;
    selectedAnswer: string | number;
    isCorrect: boolean;
    timeTaken?: number;
  }>;
}

export interface UserPerformanceSummary {
  totalAssessments: number;
  averageScore: number;
  aptitudeAverage: number;
  technicalAverage: number;
  codingAverage: number;
  interviewAverage: number;
  highestScore: number;
  totalTimeSpentMinutes: number;
  recentReports: AssessmentReport[];
}

// User-partitioned storage key generator to strictly isolate localStorage per candidate
const getIsolatedReportsKey = (userId: string): string => `ai_assessment_reports_${userId}`;

export const assessmentService = {
  /**
   * Fetch technical questions (checks database first)
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
   * Fetch coding problems (checks database first)
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
   * Fetch aptitude questions (checks database first)
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
    if (!userId) return { data: null, error: 'User ID is required.' };
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

  /**
   * Store complete assessment report.
   * Strictly partitions report storage by userId so no reports mingle between candidates.
   */
  async saveAssessmentReport(
    userId: string,
    input: AssessmentReportInput
  ): Promise<{ data: AssessmentReport | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'User ID is required to store assessment reports.' };
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();

    const reportRecord: AssessmentReport = {
      id: reportId,
      user_id: userId,
      attempt_id: null,
      assessment_type: input.assessmentType,
      title: input.title,
      category: input.category,
      score: input.score,
      total_questions: input.totalQuestions,
      correct_answers: input.correctAnswers,
      incorrect_answers: input.incorrectAnswers,
      skipped_answers: input.skippedAnswers || 0,
      accuracy: input.accuracy,
      time_spent_seconds: input.timeSpentSeconds,
      report_data: (input.reportData as Json) || null,
      created_at: nowIso,
    };

    // 1. Save to user-isolated local cache partition immediately
    try {
      const storageKey = getIsolatedReportsKey(userId);
      const existingRaw = localStorage.getItem(storageKey);
      const existing: AssessmentReport[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [reportRecord, ...existing.filter((r) => r.id !== reportRecord.id)].slice(0, 100);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[AssessmentService] Local report storage warning:', e);
    }

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        // First record the completed attempt in assessment_attempts
        let attemptId: string | null = null;
        try {
          const { data: attemptData } = await supabase
            .from('assessment_attempts')
            .insert({
              user_id: userId,
              assessment_type: input.assessmentType,
              score: input.score,
              status: 'completed',
              completed_at: nowIso,
            })
            .select('id')
            .single();

          if (attemptData?.id) {
            attemptId = attemptData.id;
            reportRecord.attempt_id = attemptId;
          }
        } catch (attemptErr) {
          console.warn('[AssessmentService] Could not insert into assessment_attempts:', attemptErr);
        }

        // Insert answers if provided
        if (attemptId && input.answersBreakdown && input.answersBreakdown.length > 0) {
          try {
            const answerRows = input.answersBreakdown.map((ans) => ({
              attempt_id: attemptId as string,
              question_id: ans.questionId,
              selected_answer: String(ans.selectedAnswer),
              is_correct: ans.isCorrect,
              time_taken: ans.timeTaken || 0,
            }));
            await supabase.from('assessment_answers').insert(answerRows);
          } catch (ansErr) {
            console.warn('[AssessmentService] Could not insert into assessment_answers:', ansErr);
          }
        }

        // Insert into assessment_reports
        const { data: dbReport, error: reportErr } = await supabase
          .from('assessment_reports')
          .insert({
            user_id: userId,
            attempt_id: attemptId,
            assessment_type: input.assessmentType,
            title: input.title,
            category: input.category,
            score: input.score,
            total_questions: input.totalQuestions,
            correct_answers: input.correctAnswers,
            incorrect_answers: input.incorrectAnswers,
            skipped_answers: input.skippedAnswers || 0,
            accuracy: input.accuracy,
            time_spent_seconds: input.timeSpentSeconds,
            report_data: (input.reportData as Json) || {},
          })
          .select()
          .single();

        if (!reportErr && dbReport) {
          reportRecord.id = dbReport.id;
        }
      } catch (dbErr: any) {
        console.warn('[AssessmentService] Remote database sync note:', dbErr.message || dbErr);
      }
    }

    // 3. Log user activity strictly under this candidate's userId
    await activityService.logActivity(userId, {
      activity_type: 'assessment_completed',
      title: `Completed ${input.title}`,
      description: `Scored ${input.score}% with ${input.correctAnswers}/${input.totalQuestions} correct (${input.accuracy}% accuracy)`,
      metadata: {
        reportId: reportRecord.id,
        assessmentType: input.assessmentType,
        category: input.category,
        score: input.score,
        accuracy: input.accuracy,
      },
    });

    return { data: reportRecord, error: null };
  },

  /**
   * Retrieve all assessment reports for a specific user.
   * Strictly filters by user_id = userId, guaranteeing reports never mingle across users.
   */
  async getUserReports(
    userId: string,
    typeFilter?: string
  ): Promise<{ data: AssessmentReport[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: null };
    }

    let remoteReports: AssessmentReport[] = [];

    // 1. Query Supabase scoped strictly by user_id
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('assessment_reports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (typeFilter) {
          query = query.eq('assessment_type', typeFilter as any);
        }

        const { data, error } = await query;
        if (!error && data) {
          remoteReports = data as AssessmentReport[];
        }
      } catch (err: any) {
        console.warn('[AssessmentService] Supabase reports query note:', err.message || err);
      }
    }

    // 2. Load from isolated local cache partition
    let localReports: AssessmentReport[] = [];
    try {
      const storageKey = getIsolatedReportsKey(userId);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        localReports = JSON.parse(raw);
        // User isolation safeguard
        localReports = localReports.filter((r) => r.user_id === userId);
        if (typeFilter) {
          localReports = localReports.filter((r) => r.assessment_type === typeFilter);
        }
      }
    } catch {
      localReports = [];
    }

    // 3. Merge deduplicated list
    const map = new Map<string, AssessmentReport>();
    remoteReports.forEach((r) => map.set(r.id, r));
    localReports.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    });

    const combined = Array.from(map.values())
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { data: combined, error: null };
  },

  /**
   * Retrieve single assessment report by ID, verifying user ownership
   */
  async getUserReportById(
    userId: string,
    reportId: string
  ): Promise<{ data: AssessmentReport | null; error: string | null }> {
    if (!userId || !reportId) {
      return { data: null, error: 'User ID and Report ID required.' };
    }

    const { data: allReports } = await this.getUserReports(userId);
    const found = allReports.find((r) => r.id === reportId && r.user_id === userId);
    if (!found) {
      return { data: null, error: 'Report not found or does not belong to this user.' };
    }
    return { data: found, error: null };
  },

  /**
   * Calculate aggregated performance metrics for a specific user.
   * Strictly computes metrics from records matching userId.
   */
  async getUserPerformanceSummary(userId: string): Promise<UserPerformanceSummary> {
    if (!userId) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        aptitudeAverage: 0,
        technicalAverage: 0,
        codingAverage: 0,
        interviewAverage: 0,
        highestScore: 0,
        totalTimeSpentMinutes: 0,
        recentReports: [],
      };
    }

    const { data: reports } = await this.getUserReports(userId);

    if (reports.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        aptitudeAverage: 0,
        technicalAverage: 0,
        codingAverage: 0,
        interviewAverage: 0,
        highestScore: 0,
        totalTimeSpentMinutes: 0,
        recentReports: [],
      };
    }

    const totalAssessments = reports.length;
    const totalScore = reports.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    const averageScore = Math.round(totalScore / totalAssessments);

    const getAvgForType = (type: string) => {
      const typeReports = reports.filter((r) => r.assessment_type === type);
      if (typeReports.length === 0) return 0;
      const sum = typeReports.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
      return Math.round(sum / typeReports.length);
    };

    const highestScore = Math.max(...reports.map((r) => Number(r.score) || 0));
    const totalSeconds = reports.reduce((acc, r) => acc + (Number(r.time_spent_seconds) || 0), 0);
    const totalTimeSpentMinutes = Math.round(totalSeconds / 60);

    return {
      totalAssessments,
      averageScore,
      aptitudeAverage: getAvgForType('aptitude'),
      technicalAverage: getAvgForType('technical'),
      codingAverage: getAvgForType('coding'),
      interviewAverage: getAvgForType('interview'),
      highestScore,
      totalTimeSpentMinutes,
      recentReports: reports.slice(0, 5),
    };
  },
};
