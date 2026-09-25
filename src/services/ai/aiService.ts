/**
 * Central AI Client Service
 * Calls the internal server-side AI API (/api/ai/*).
 * Never communicates directly with third-party AI providers from the browser.
 * Never handles, stores, or transmits API keys in the client.
 */

import { ParsedResume, CandidateAiProfile, SkillAnalysisResult, ProjectAnalysisItem, LearningPathItem } from '../../types/resume';
import { InterviewExchange, InterviewConfig } from '../../types/interview';
import { InterviewEvaluation } from '../../types/evaluation';

export interface AiTurnResult {
  isFollowUp: boolean;
  followUpReason?: string;
  quickFeedback?: string;
  nextQuestionText: string;
  category?: string;
  topic?: string;
  difficulty?: string;
  evaluation?: {
    technicalAccuracy?: number;
    communication?: number;
    clarity?: number;
    depth?: number;
    problemSolving?: number;
    confidence?: number;
  };
}

export interface GeneratedQuestionResult {
  questionText: string;
  category: string;
  topic?: string;
  difficulty?: string;
  expectedKeyPoints?: string[];
}

export interface ResumeAnalysisOutput {
  parsedResume: ParsedResume;
  candidateProfile: CandidateAiProfile;
}

class AiService {
  private baseUrl = '/api/ai';

  private async post<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMessage = `AI request to ${endpoint} failed (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMessage = errJson.error;
      } catch {}
      throw new Error(errorMessage);
    }

    const json = await res.json();
    if (json.success === false) {
      throw new Error(json.error || 'AI service execution error');
    }

    return json.data !== undefined ? json.data : json;
  }

  /**
   * Check status of server AI integration
   */
  async checkStatus(): Promise<{ configured: boolean; provider: string; model: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { configured: false, provider: 'gemini', model: 'gemini-1.5-flash' };
  }

  /**
   * Analyze raw resume text and synthesize parsed resume + full candidate AI profile
   */
  async analyzeResume(rawText: string, fileName?: string, fileSize?: number): Promise<ResumeAnalysisOutput> {
    return this.post<{ rawText: string; fileName?: string; fileSize?: number }, ResumeAnalysisOutput>(
      '/resume-analyze',
      { rawText, fileName, fileSize }
    );
  }

  /**
   * Cross-check candidate skills against projects and experience
   */
  async analyzeSkills(skills: any, projects: any[], experience: any[]): Promise<SkillAnalysisResult> {
    return this.post<{ skills: any; projects: any[]; experience: any[] }, SkillAnalysisResult>(
      '/skill-analyze',
      { skills, projects, experience }
    );
  }

  /**
   * Deep technical evaluation of candidate projects with tailored interview questions
   */
  async analyzeProjects(projects: any[]): Promise<{ projectAnalyses: ProjectAnalysisItem[] }> {
    return this.post<{ projects: any[] }, { projectAnalyses: ProjectAnalysisItem[] }>(
      '/project-analyze',
      { projects }
    );
  }

  /**
   * Generate an adaptive question grounded in candidate profile
   */
  async generateQuestion(
    config: InterviewConfig,
    candidateProfile: CandidateAiProfile | null,
    questionNumber: number,
    previousQuestions: string[]
  ): Promise<GeneratedQuestionResult> {
    return this.post<
      { config: InterviewConfig; candidateProfile: CandidateAiProfile | null; questionNumber: number; previousQuestions: string[] },
      GeneratedQuestionResult
    >('/interview-question', {
      config,
      candidateProfile,
      questionNumber,
      previousQuestions,
    });
  }

  /**
   * Process a turn: evaluates candidate answer internally and generates adaptive follow-up or next question
   */
  async processTurn(
    currentQuestion: string,
    candidateAnswer: string,
    conversationHistory: Array<{ question: string; answer: string }>,
    candidateProfile: CandidateAiProfile | null,
    roundType: string = 'technical'
  ): Promise<AiTurnResult> {
    return this.post<
      {
        currentQuestion: string;
        candidateAnswer: string;
        conversationHistory: Array<{ question: string; answer: string }>;
        candidateProfile: CandidateAiProfile | null;
        roundType: string;
      },
      AiTurnResult
    >('/interview-turn', {
      currentQuestion,
      candidateAnswer,
      conversationHistory,
      candidateProfile,
      roundType,
    });
  }

  /**
   * Final post-session rubric evaluation and feedback report
   */
  async evaluateSession(
    sessionId: string,
    durationSeconds: number,
    exchanges: InterviewExchange[],
    candidateProfile: CandidateAiProfile | null
  ): Promise<InterviewEvaluation> {
    return this.post<
      {
        sessionId: string;
        durationSeconds: number;
        exchanges: InterviewExchange[];
        candidateProfile: CandidateAiProfile | null;
      },
      InterviewEvaluation
    >('/interview-evaluate', {
      sessionId,
      durationSeconds,
      exchanges,
      candidateProfile,
    });
  }

  /**
   * Synthesize personalized learning path recommendations
   */
  async generateLearningPath(
    candidateProfile: CandidateAiProfile | null,
    interviewEvaluations: any[] = [],
    assessmentResults: any[] = []
  ): Promise<{ summary: string; recommendations: LearningPathItem[] }> {
    return this.post<
      {
        candidateProfile: CandidateAiProfile | null;
        interviewEvaluations: any[];
        assessmentResults: any[];
      },
      { summary: string; recommendations: LearningPathItem[] }
    >('/learning-path', {
      candidateProfile,
      interviewEvaluations,
      assessmentResults,
    });
  }
}

export const aiService = new AiService();
