import { Difficulty } from './technical';

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: Record<SupportedLanguage, string>;
  testCases: TestCase[];
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput: string;
  error?: string;
  executionTimeMs?: number;
}

export interface CodeExecutionResponse {
  status: 'accepted' | 'wrong_answer' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded';
  totalTests: number;
  passedTests: number;
  output?: string;
  error?: string;
  executionTimeMs: number;
  memoryKb?: number;
  testCaseResults: TestCaseResult[];
}
