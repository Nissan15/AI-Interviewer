import { aiService, ResumeAnalysisOutput } from './aiService';

export const analyzeResumeText = async (
  rawText: string,
  fileName?: string,
  fileSize?: number
): Promise<ResumeAnalysisOutput> => {
  return aiService.analyzeResume(rawText, fileName, fileSize);
};
