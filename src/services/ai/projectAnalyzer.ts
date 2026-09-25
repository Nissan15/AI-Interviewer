import { aiService } from './aiService';
import { ProjectAnalysisItem } from '../../types/resume';

export const analyzeCandidateProjects = async (
  projects: any[]
): Promise<{ projectAnalyses: ProjectAnalysisItem[] }> => {
  return aiService.analyzeProjects(projects);
};
