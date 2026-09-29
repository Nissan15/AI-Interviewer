import { aiService } from './aiService';
import { InterviewExchange, HRInterviewState } from '../../types/interview';
import { InterviewEvaluation } from '../../types/evaluation';
import { CandidateAiProfile } from '../../types/resume';

export const evaluateInterviewSession = async (
  sessionId: string,
  durationSeconds: number,
  exchanges: InterviewExchange[],
  candidateProfile: CandidateAiProfile | null = null,
  hrState?: HRInterviewState | null,
  roundType: string = 'general_hr'
): Promise<InterviewEvaluation> => {
  return aiService.evaluateSession(sessionId, durationSeconds, exchanges, candidateProfile, hrState, roundType);
};
