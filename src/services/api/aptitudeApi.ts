import { ApiClient } from './apiClient';
import { AptitudeQuestion, AptitudeSubmission, AptitudeResult } from '../../types/aptitude';

export const aptitudeApi = {
  getQuestions: async (category?: string): Promise<AptitudeQuestion[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    // Empty array by default - no hardcoded questions!
    return ApiClient.get<AptitudeQuestion[]>(`/aptitude/questions${query}`, []);
  },

  submitTest: async (submission: AptitudeSubmission): Promise<AptitudeResult> => {
    return ApiClient.post<AptitudeSubmission, AptitudeResult>('/aptitude/submit', submission);
  },
};
