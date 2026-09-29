import { aiService, AiTurnResult, GeneratedQuestionResult } from './aiService';
import { InterviewConfig, HRInterviewState } from '../../types/interview';
import { CandidateAiProfile } from '../../types/resume';

export const processInterviewTurn = async (
  currentQuestion: string,
  userAnswer: string,
  conversationHistory: Array<{ question: string; answer: string }>,
  candidateProfile: CandidateAiProfile | null = null,
  roundType: string = 'general_hr',
  hrState?: HRInterviewState | null
): Promise<AiTurnResult> => {
  return aiService.processTurn(
    currentQuestion,
    userAnswer,
    conversationHistory,
    candidateProfile,
    roundType,
    hrState
  );
};

export const generateInterviewQuestion = async (
  config: InterviewConfig,
  candidateProfile: CandidateAiProfile | null,
  questionNumber: number,
  previousQuestions: string[],
  hrState?: HRInterviewState | null
): Promise<GeneratedQuestionResult> => {
  return aiService.generateQuestion(config, candidateProfile, questionNumber, previousQuestions, hrState);
};
