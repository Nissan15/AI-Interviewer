export type InterviewType = 'general_hr' | 'technical_hr' | 'resume_based' | 'mixed';
export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type InterviewStatus = 'idle' | 'configuring' | 'connecting' | 'speaking' | 'listening' | 'evaluating' | 'completed' | 'error';

export interface InterviewConfig {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  durationMinutes: number; // 10, 15, 20, 30
  resumeId?: string;
  roleTarget?: string;
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
