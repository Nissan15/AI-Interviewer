import { Difficulty } from './technical';

export type AptitudeCategory =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Numerical Ability'
  | 'Data Interpretation'
  | 'Analytical Reasoning';

export interface AptitudeQuestion {
  id: string;
  category: AptitudeCategory;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface AptitudeSubmission {
  testId: string;
  category: AptitudeCategory;
  answers: Record<string, number>;
  markedForReview: string[];
  timeSpentSeconds: number;
}

export interface AptitudeResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  category: AptitudeCategory;
  completedAt: string;
}
