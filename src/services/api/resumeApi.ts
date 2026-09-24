import { ApiClient } from './apiClient';
import { ParsedResume, ResumeUploadResponse } from '../../types/resume';

export const resumeApi = {
  uploadResume: async (formData: FormData): Promise<ResumeUploadResponse> => {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${baseUrl}/resume/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Resume upload failed with status: ${response.status}`);
    }
    return response.json();
  },

  getResume: async (id: string): Promise<ParsedResume | null> => {
    return ApiClient.get<ParsedResume | null>(`/resume/${id}`, null);
  },
};
