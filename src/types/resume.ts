export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: string;
  gpa?: string;
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  role?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface ParsedResume {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  candidateName?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  technologies: string[];
  education: EducationItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: string[];
  rawText?: string;
}

export interface ResumeUploadResponse {
  success: boolean;
  resumeId: string;
  parsedData?: ParsedResume;
  error?: string;
}
