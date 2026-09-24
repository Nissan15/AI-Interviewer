export type Difficulty = 'easy' | 'medium' | 'hard';

export type TechnicalCategory =
  | 'Programming'
  | 'Data Structures'
  | 'Algorithms'
  | 'DBMS'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'OOP'
  | 'Software Engineering'
  | 'AI / Machine Learning';

export interface TechnicalQuestion {
  id: string;
  category: TechnicalCategory;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: Difficulty;
}

export interface QuizSubmission {
  testId: string;
  category: TechnicalCategory;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  markedForReview: string[];
  timeSpentSeconds: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  category: TechnicalCategory;
  completedAt: string;
}
