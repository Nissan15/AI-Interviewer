import { ApiClient } from './apiClient';
import { TechnicalQuestion, QuizSubmission, QuizResult } from '../../types/technical';
import { CodingProblem, CodeExecutionResponse, SupportedLanguage } from '../../types/coding';

export const technicalApi = {
  // Fetch questions for technical quiz
  getQuizQuestions: async (category?: string): Promise<TechnicalQuestion[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    // Empty array by default - no hardcoded questions!
    return ApiClient.get<TechnicalQuestion[]>(`/technical/questions${query}`, []);
  },

  // Submit completed quiz
  submitQuiz: async (submission: QuizSubmission): Promise<QuizResult> => {
    return ApiClient.post<QuizSubmission, QuizResult>('/technical/submit', submission);
  },

  // Fetch coding challenges
  getCodingProblems: async (category?: string): Promise<CodingProblem[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    // Empty array by default - no hardcoded problems!
    return ApiClient.get<CodingProblem[]>(`/technical/coding${query}`, []);
  },

  // Run code against test cases
  runCode: async (
    problemId: string,
    language: SupportedLanguage,
    code: string,
    customInput?: string
  ): Promise<CodeExecutionResponse> => {
    return ApiClient.post<
      { problemId: string; language: string; code: string; customInput?: string },
      CodeExecutionResponse
    >('/technical/coding/run', {
      problemId,
      language,
      code,
      customInput,
    });
  },
};
