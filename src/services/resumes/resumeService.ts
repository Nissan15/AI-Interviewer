import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { Resume } from '../../types/database';

export const resumeService = {
  /**
   * Get candidate resumes (RLS restricted to auth.uid())
   */
  async getUserResumes(userId: string): Promise<{ data: Resume[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch {
      return { data: [], error: 'Failed to retrieve resumes.' };
    }
  },

  /**
   * Upload resume file to private Supabase storage bucket
   */
  async uploadResumeFile(
    userId: string,
    file: File
  ): Promise<{ path: string | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { path: null, error: 'Storage is not configured.' };
    }

    // Validation: format and size (max 5MB)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return { path: null, error: 'Only PDF, DOC, and DOCX files are supported.' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { path: null, error: 'File size must not exceed 5MB.' };
    }

    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { path: null, error: uploadError.message };
      }

      return { path: filePath, error: null };
    } catch {
      return { path: null, error: 'Failed to upload resume to secure storage.' };
    }
  },

  /**
   * Create resume metadata record
   */
  async createResumeRecord(record: {
    user_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    parsed_data?: import('../../types/database').Json | null;
  }): Promise<{ data: Resume | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: record.user_id,
          file_name: record.file_name,
          file_path: record.file_path,
          file_type: record.file_type,
          file_size: record.file_size,
          parsed_data: record.parsed_data ?? null,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch {
      return { data: null, error: 'Failed to save resume record.' };
    }
  },
};
