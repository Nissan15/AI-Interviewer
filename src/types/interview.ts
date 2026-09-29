export type InterviewType = 'general_hr' | 'technical_hr' | 'resume_based' | 'mixed';
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type InterviewStatus = 'idle' | 'configuring' | 'connecting' | 'speaking' | 'ready' | 'listening' | 'evaluating' | 'completed' | 'error';

export interface InterviewConfig {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: number; // 10, 15, 20, 30
  resumeId?: string;
  roleTarget?: string;
}

export interface HRInterviewState {
  questionsAsked: string[];
  competenciesEvaluated: string[];
  candidateClaims: string[];
  importantDetails: string[];
  followUpOpportunities: string[];
  pendingCompetencies: string[];
  questionCount: number;
  targetQuestions: number;
  currentPhase: 'introduction' | 'background' | 'behavioral' | 'situational' | 'deep_dive' | 'career_goals' | 'closing';
}

export interface InterviewExchange {
  id: string;
  questionNumber: number;
  questionText: string;
  questionTimestamp: string;
  userAnswerText?: string;
  answerTimestamp?: string;
  audioDurationSeconds?: number;
  isFollowUp?: boolean;
  followUpReason?: string;
  aiQuickFeedback?: string;
  // Qualitative HR additions
  category?: string;
  topic?: string;
  competencyEvaluated?: string;
  acknowledgementText?: string;
  starScore?: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
}

export interface InterviewSession {
  id: string;
  userId?: string;
  resumeId?: string;
  config: InterviewConfig;
  status: InterviewStatus;
  startedAt: string;
  endedAt?: string;
  currentQuestionIndex: number;
  exchanges: InterviewExchange[];
  currentTranscript: string;
  isMuted: boolean;
  timeRemainingSeconds: number;
}

export interface InterviewHistoryItem {
  id: string;
  sessionId: string;
  userId: string;
  interviewType: string;
  difficulty: string;
  durationSeconds: number;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  relevanceScore: number;
  problemSolvingScore: number;
  clarityScore: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  recommendedPreparationAreas: string[];
  questionAssessments?: any[];
  exchanges?: InterviewExchange[];
  createdAt: string;
  roleTarget?: string;
  reportData?: Record<string, any>;
}

