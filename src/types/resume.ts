export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  gitHub?: string;
  portfolio?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: string;
  gpa?: string;
  relevantCoursework?: string[];
}

export interface CategorizedSkills {
  programmingLanguages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  cloud: string[];
  aiMl: string[];
  frameworks: string[];
  tools: string[];
  otherTechnologies: string[];
}

export interface DetailedProject {
  id?: string;
  name: string;
  problemSolved: string;
  technologies: string[];
  features?: string[];
  architecture?: string;
  userContribution?: string;
  aiMlUsage?: string;
  database?: string;
  backend?: string;
  frontend?: string;
  deployment?: string;
  technicalComplexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  potentialInterviewQuestions?: string[];
}

export interface DetailedExperience {
  organization: string;
  company?: string;
  role: string;
  duration?: string;
  responsibilities: string[];
  technologies: string[];
  achievements: string[];
}

export interface ParsedResume {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  personalInfo?: PersonalInfo;
  candidateName?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  technologies: string[];
  categorizedSkills?: CategorizedSkills;
  education: EducationItem[];
  projects: DetailedProject[];
  experience: DetailedExperience[];
  certifications: string[];
  technicalStrengths?: string[];
  weakAreas?: string[];
  potentialInterviewTopics?: string[];
  rawText?: string;
}

export interface SkillEvidenceItem {
  skill: string;
  category: string;
  evidence: string;
  projectCount: number;
}

export interface SkillAnalysisResult {
  strongSkills: SkillEvidenceItem[];
  intermediateSkills: SkillEvidenceItem[];
  beginnerSkills: SkillEvidenceItem[];
  skillsToImprove: { skill: string; reason: string; recommendedAction: string }[];
  recommendedSkills: { skill: string; relevance: string; industryDemand: string }[];
}

export interface ProjectAnalysisItem {
  projectName: string;
  technicalComplexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  technologiesUsed: string[];
  architectureUnderstanding: string;
  backendUnderstanding: string;
  frontendUnderstanding: string;
  databaseUnderstanding: string;
  aiMlUnderstanding: string;
  deploymentKnowledge: string;
  problemSolvingDemonstrated: string;
  potentialQuestions: string[];
}

export interface CandidateAiProfile {
  id?: string;
  candidateName: string;
  headline?: string;
  summary?: string;
  education: EducationItem[];
  skills: CategorizedSkills;
  skillAnalysis: SkillAnalysisResult;
  projects: DetailedProject[];
  projectAnalyses: ProjectAnalysisItem[];
  experience: DetailedExperience[];
  certifications?: string[];
  technicalStrengths: string[];
  weakAreas: string[];
  potentialInterviewTopics: string[];
  suggestedInterviewRole?: string;
  recommendedDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface LearningPathItem {
  id?: string;
  currentSkill: string;
  weakArea: string;
  recommendedTopic: string;
  practiceTask: string;
  mockTestFocus: string;
  reassessmentCriteria: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ResumeUploadResponse {
  success: boolean;
  resumeId: string;
  parsedData?: ParsedResume;
  candidateProfile?: CandidateAiProfile;
  error?: string;
}
