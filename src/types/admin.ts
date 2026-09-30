export type UserRole = 'student' | 'admin';

export type QuestionType = 'aptitude' | 'technical';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type TestStatus = 'draft' | 'published' | 'unpublished';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  options: string[];
  correct_answer: string; // "Option A" or "A" or the exact option text
  explanation: string;
  category: string;
  topic: string;
  technology?: string; // For technical questions (e.g. Python, Java, JavaScript, etc.)
  difficulty: QuestionDifficulty;
  marks: number;
  time_limit: number; // in seconds
  active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionDTO {
  type: QuestionType;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  category: string;
  topic: string;
  technology?: string;
  difficulty: QuestionDifficulty;
  marks?: number;
  time_limit?: number;
  active?: boolean;
}

export interface UpdateQuestionDTO extends Partial<CreateQuestionDTO> {
  id?: string;
}

export interface QuestionFilters {
  type?: 'all' | QuestionType;
  category?: string;
  topic?: string;
  difficulty?: 'all' | QuestionDifficulty;
  active?: 'all' | 'active' | 'inactive';
  search?: string;
}

export interface Category {
  id: string;
  name: string;
  type: QuestionType;
  created_at: string;
}

export interface Topic {
  id: string;
  category_name: string;
  name: string;
  type: QuestionType;
  created_at: string;
}

export interface TestDifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface Test {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  difficulty_distribution?: TestDifficultyDistribution;
  categories: string[];
  topics: string[];
  status: TestStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_id: string;
  order_index: number;
  marks: number;
  created_at: string;
}

export interface TestWithQuestions extends Test {
  questions: Question[];
}

export interface CreateTestDTO {
  title: string;
  description?: string;
  type: QuestionType;
  duration_minutes: number;
  total_questions?: number;
  total_marks?: number;
  difficulty_distribution?: TestDifficultyDistribution;
  categories: string[];
  topics: string[];
  status: TestStatus;
  question_ids?: string[];
}

export interface AutoTestGenerationConfig {
  type: QuestionType;
  totalQuestions: number;
  difficultyDistribution: TestDifficultyDistribution;
  categories?: string[];
  topics?: string[];
}

export interface BulkUploadRow {
  rowNumber: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  category: string;
  topic: string;
  difficulty: string;
  explanation?: string;
  marks?: number | string;
  time_limit?: number | string;
  technology?: string;
  isValid: boolean;
  errors: string[];
}

export interface BulkUploadValidationResult {
  totalRows: number;
  validRows: BulkUploadRow[];
  invalidRows: BulkUploadRow[];
  canImport: boolean;
}

export interface AdminDashboardStats {
  totalAptitudeQuestions: number;
  totalTechnicalQuestions: number;
  activeQuestions: number;
  publishedTests: number;
  draftTests: number;
  totalQuestions: number;
  totalTests: number;
}
