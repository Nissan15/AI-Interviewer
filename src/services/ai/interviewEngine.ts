import { aiService, AiTurnResult, GeneratedQuestionResult } from './aiService';
import { InterviewConfig } from '../../types/interview';
import { CandidateAiProfile } from '../../types/resume';

export const processInterviewTurn = async (
  currentQuestion: string,
  userAnswer: string,
  conversationHistory: Array<{ question: string; answer: string }>,
  candidateProfile: CandidateAiProfile | null = null,
  roundType: string = 'technical'
): Promise<AiTurnResult> => {
  return aiService.processTurn(
    currentQuestion,
    userAnswer,
    conversationHistory,
    candidateProfile,
    roundType
  );
};

export const generateInterviewQuestion = async (
  config: InterviewConfig,
  candidateProfile: CandidateAiProfile | null,
  questionNumber: number,
  previousQuestions: string[]
): Promise<GeneratedQuestionResult> => {
  return aiService.generateQuestion(config, candidateProfile, questionNumber, previousQuestions);
};
