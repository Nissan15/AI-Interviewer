import { aiService } from './aiService';
import { SkillAnalysisResult } from '../../types/resume';

export const analyzeCandidateSkills = async (
  skills: any,
  projects: any[],
  experience: any[]
): Promise<SkillAnalysisResult> => {
  return aiService.analyzeSkills(skills, projects, experience);
};
