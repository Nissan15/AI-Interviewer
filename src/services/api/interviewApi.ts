import { ApiClient } from './apiClient';
import { InterviewConfig, InterviewSession } from '../../types/interview';
import { InterviewEvaluation } from '../../types/evaluation';

export const interviewApi = {
  startSession: async (config: InterviewConfig): Promise<InterviewSession> => {
    return ApiClient.post<InterviewConfig, InterviewSession>('/interview/start', config);
  },

  submitAnswer: async (
    sessionId: string,
    questionNumber: number,
    answerText: string
  ): Promise<{ nextQuestionText: string; isFollowUp: boolean; followUpReason?: string }> => {
    return ApiClient.post<
      { sessionId: string; questionNumber: number; answerText: string },
      { nextQuestionText: string; isFollowUp: boolean; followUpReason?: string }
    >('/interview/answer', {
      sessionId,
      questionNumber,
      answerText,
    });
  },

  endSession: async (sessionId: string): Promise<InterviewEvaluation> => {
    return ApiClient.post<{ sessionId: string }, InterviewEvaluation>('/interview/end', {
      sessionId,
    });
  },

  getSession: async (id: string): Promise<InterviewSession | null> => {
    return ApiClient.get<InterviewSession | null>(`/interview/${id}`, null);
  },

  getReport: async (id: string): Promise<InterviewEvaluation | null> => {
    return ApiClient.get<InterviewEvaluation | null>(`/interview/${id}/report`, null);
  },

  getHistory: async (): Promise<InterviewSession[]> => {
    // Zero sample data: returns empty array initially
    return ApiClient.get<InterviewSession[]>('/interview/history', []);
  },
};
