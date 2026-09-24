import { callLlmApi } from './aiConfig';
import {
  FOLLOW_UP_SYSTEM_PROMPT,
  createFollowUpPrompt,
} from '../../prompts/followUpQuestion';

export interface InterviewTurnResult {
  isFollowUp: boolean;
  followUpReason?: string;
  quickFeedback?: string;
  nextQuestionText: string;
}

export const processInterviewTurn = async (
  currentQuestion: string,
  userAnswer: string,
  conversationHistory: Array<{ question: string; answer: string }>
): Promise<InterviewTurnResult> => {
  const prompt = createFollowUpPrompt(currentQuestion, userAnswer, conversationHistory);
  const jsonResponse = await callLlmApi(prompt, FOLLOW_UP_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(jsonResponse);
    return {
      isFollowUp: Boolean(parsed.isFollowUp),
      followUpReason: parsed.followUpReason || undefined,
      quickFeedback: parsed.quickFeedback || undefined,
      nextQuestionText: parsed.nextQuestionText || 'Thank you. Moving forward, could you share another example?',
    };
  } catch (err: any) {
    throw new Error('Failed to parse interview turn JSON: ' + err.message);
  }
};
