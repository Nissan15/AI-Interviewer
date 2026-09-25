import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ParsedResume,
  CandidateAiProfile,
  LearningPathItem,
} from '../types/resume';
import { useAuth } from '../hooks/useAuth';
import { resumeService } from '../services/resumes/resumeService';

interface ResumeContextValue {
  resume: ParsedResume | null;
  candidateProfile: CandidateAiProfile | null;
  uploadedFile: File | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  learningPath: LearningPathItem[];
  setUploadedFile: (file: File | null) => void;
  setResume: (resume: ParsedResume | null) => void;
  setCandidateProfile: (profile: CandidateAiProfile | null) => void;
  setLearningPath: (items: LearningPathItem[]) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  saveResumeAndProfile: (file: File, parsedResume: ParsedResume, profile: CandidateAiProfile) => Promise<void>;
  clearResume: () => void;
}

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateAiProfile | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing candidate profile from Supabase on user session initialization
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (!user) return;
      try {
        const existingProfile = await resumeService.getLatestCandidateProfile(user.id);
        if (existingProfile && isMounted) {
          setCandidateProfile(existingProfile);
          // If profile has projects/skills, hydrate parsed resume representation
          setResume({
            id: existingProfile.id || `res_${Date.now()}`,
            fileName: 'Analyzed_Resume.pdf',
            fileSize: 1024,
            uploadedAt: new Date().toISOString(),
            candidateName: existingProfile.candidateName,
            summary: existingProfile.summary,
            skills: Object.values(existingProfile.skills || {}).flat() as string[],
            technologies: (existingProfile.projects || []).flatMap((p) => p.technologies || []),
            categorizedSkills: existingProfile.skills,
            education: existingProfile.education || [],
            projects: existingProfile.projects || [],
            experience: existingProfile.experience || [],
            certifications: existingProfile.certifications || [],
            technicalStrengths: existingProfile.technicalStrengths || [],
            weakAreas: existingProfile.weakAreas || [],
            potentialInterviewTopics: existingProfile.potentialInterviewTopics || [],
          });
        }
      } catch (err) {
        console.warn('Could not auto-load profile:', err);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveResumeAndProfile = async (
    file: File,
    parsed: ParsedResume,
    profile: CandidateAiProfile
  ) => {
    if (!user) return;

    try {
      // 1. Upload file to storage
      const { path } = await resumeService.uploadResumeFile(user.id, file);

      // 2. Create resume record
      const { data: resumeRecord } = await resumeService.createResumeRecord({
        user_id: user.id,
        file_name: file.name,
        file_path: path || `resumes/${file.name}`,
        file_type: file.type || 'application/pdf',
        file_size: file.size,
        parsed_data: parsed as any,
      });

      const resumeId = resumeRecord?.id || `res_${Date.now()}`;

      // 3. Save deep resume analysis, audited skills, and projects
      await resumeService.saveCompleteResumeAnalysis(
        user.id,
        resumeId,
        parsed,
        profile
      );
    } catch (err) {
      console.warn('Could not persist resume to Supabase:', err);
    }
  };

  const clearResume = () => {
    setResume(null);
    setCandidateProfile(null);
    setLearningPath([]);
    setUploadedFile(null);
    setError(null);
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        candidateProfile,
        uploadedFile,
        isUploading,
        isAnalyzing,
        error,
        learningPath,
        setUploadedFile,
        setResume,
        setCandidateProfile,
        setLearningPath,
        setIsUploading,
        setIsAnalyzing,
        setError,
        saveResumeAndProfile,
        clearResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = (): ResumeContextValue => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
