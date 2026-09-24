import { ParsedResume } from '../../types/resume';
import { callLlmApi } from './aiConfig';
import {
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  createResumeAnalysisUserPrompt,
} from '../../prompts/resumeAnalysis';

export const analyzeResumeTextWithAi = async (
  rawText: string,
  fileName: string,
  fileSize: number
): Promise<ParsedResume> => {
  const prompt = createResumeAnalysisUserPrompt(rawText);
  const jsonResponse = await callLlmApi(prompt, RESUME_ANALYSIS_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(jsonResponse);

    return {
      id: `res_${Date.now()}`,
      fileName,
      fileSize,
      uploadedAt: new Date().toISOString(),
      candidateName: parsed.candidateName || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      summary: parsed.summary || undefined,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      rawText,
    };
  } catch (err: any) {
    throw new Error('Failed to parse AI resume extraction JSON: ' + err.message);
  }
};
