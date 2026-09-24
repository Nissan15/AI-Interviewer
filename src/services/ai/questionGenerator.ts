import { InterviewConfig } from '../../types/interview';
import { ParsedResume } from '../../types/resume';
import { callLlmApi } from './aiConfig';
import {
  INTERVIEW_QUESTION_SYSTEM_PROMPT,
  createInterviewQuestionPrompt,
} from '../../prompts/interviewQuestion';

export interface GeneratedQuestion {
  questionText: string;
  category: string;
  expectedKeyPoints?: string[];
}

export const generateInterviewQuestion = async (
  config: InterviewConfig,
  resume: ParsedResume | null,
  questionNumber: number,
  previousQuestions: string[]
): Promise<GeneratedQuestion> => {
  const prompt = createInterviewQuestionPrompt(config, resume, questionNumber, previousQuestions);
  const jsonResponse = await callLlmApi(prompt, INTERVIEW_QUESTION_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(jsonResponse);
    return {
      questionText: parsed.questionText || 'Could you walk me through your background and relevant experiences?',
      category: parsed.category || 'general',
      expectedKeyPoints: parsed.expectedKeyPoints,
    };
  } catch (err: any) {
    throw new Error('Failed to parse AI generated question response: ' + err.message);
  }
};
