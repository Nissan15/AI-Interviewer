import { aiService } from './aiService';
import { CandidateAiProfile, LearningPathItem } from '../../types/resume';

export const generatePersonalizedLearningPath = async (
  candidateProfile: CandidateAiProfile | null,
  interviewEvaluations: any[] = [],
  assessmentResults: any[] = []
): Promise<{ summary: string; recommendations: LearningPathItem[] }> => {
  return aiService.generateLearningPath(
    candidateProfile,
    interviewEvaluations,
    assessmentResults
  );
};
