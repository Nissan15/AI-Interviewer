import { aiService } from './aiService';
import { InterviewExchange } from '../../types/interview';
import { InterviewEvaluation } from '../../types/evaluation';
import { CandidateAiProfile } from '../../types/resume';

export const evaluateInterviewSession = async (
  sessionId: string,
  durationSeconds: number,
  exchanges: InterviewExchange[],
  candidateProfile: CandidateAiProfile | null = null
): Promise<InterviewEvaluation> => {
  return aiService.evaluateSession(sessionId, durationSeconds, exchanges, candidateProfile);
};
