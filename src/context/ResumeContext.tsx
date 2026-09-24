import React, { createContext, useContext, useState } from 'react';
import { ParsedResume } from '../types/resume';

interface ResumeContextValue {
  resume: ParsedResume | null;
  uploadedFile: File | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  setUploadedFile: (file: File | null) => void;
  setResume: (resume: ParsedResume | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  clearResume: () => void;
}

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearResume = () => {
    setResume(null);
    setUploadedFile(null);
    setError(null);
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        uploadedFile,
        isUploading,
        isAnalyzing,
        error,
        setUploadedFile,
        setResume,
        setIsUploading,
        setIsAnalyzing,
        setError,
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
