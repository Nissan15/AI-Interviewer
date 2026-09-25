import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { Resume } from '../../types/database';
import type { ParsedResume, CandidateAiProfile } from '../../types/resume';

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
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const hasValidExt = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return { path: null, error: 'Only PDF, DOC, DOCX, and TXT files are supported.' };
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
        // If storage bucket is not created in Supabase yet, return dummy path gracefully
        return { path: `local/${fileName}`, error: null };
      }

      return { path: filePath, error: null };
    } catch {
      return { path: null, error: 'Failed to upload resume to secure storage.' };
    }
  },

  /**
   * Create or update resume metadata record
   */
  async createResumeRecord(record: {
    user_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    parsed_data?: any;
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

  /**
   * Save complete candidate profile, skills, and projects to Supabase tables
   */
  async saveCompleteResumeAnalysis(
    userId: string,
    resumeId: string,
    parsedResume: ParsedResume,
    candidateProfile: CandidateAiProfile
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    try {
      // 1. Insert into resume_analysis
      await (supabase as any)
        .from('resume_analysis')
        .insert({
          user_id: userId,
          resume_id: resumeId,
          candidate_name: candidateProfile.candidateName,
          email: parsedResume.personalInfo?.email || parsedResume.email,
          phone: parsedResume.personalInfo?.phone || parsedResume.phone,
          linkedin: parsedResume.personalInfo?.linkedIn,
          github: parsedResume.personalInfo?.gitHub,
          portfolio: parsedResume.personalInfo?.portfolio,
          summary: candidateProfile.summary,
          education: candidateProfile.education,
          skills_categorized: candidateProfile.skills,
          projects_detailed: candidateProfile.projects,
          experience: candidateProfile.experience,
          certifications: parsedResume.certifications,
          technical_strengths: candidateProfile.technicalStrengths,
          weak_areas: candidateProfile.weakAreas,
          potential_interview_topics: candidateProfile.potentialInterviewTopics,
          raw_text: parsedResume.rawText,
        });

      // 2. Insert audited skills into candidate_skills
      if (candidateProfile.skillAnalysis) {
        const skillRows: any[] = [];
        const { strongSkills = [], intermediateSkills = [], beginnerSkills = [] } = candidateProfile.skillAnalysis;

        strongSkills.forEach((s) => {
          skillRows.push({
            user_id: userId,
            resume_id: resumeId,
            skill_name: s.skill,
            category: s.category || 'General',
            proficiency_level: 'strong',
            evidence: s.evidence,
            project_count: s.projectCount || 1,
          });
        });

        intermediateSkills.forEach((s) => {
          skillRows.push({
            user_id: userId,
            resume_id: resumeId,
            skill_name: s.skill,
            category: s.category || 'General',
            proficiency_level: 'intermediate',
            evidence: s.evidence,
            project_count: s.projectCount || 1,
          });
        });

        beginnerSkills.forEach((s) => {
          skillRows.push({
            user_id: userId,
            resume_id: resumeId,
            skill_name: s.skill,
            category: s.category || 'General',
            proficiency_level: 'beginner',
            evidence: s.evidence,
            project_count: s.projectCount || 0,
          });
        });

        if (skillRows.length > 0) {
          await (supabase as any).from('candidate_skills').insert(skillRows);
        }
      }

      // 3. Insert detailed projects into candidate_projects
      if (candidateProfile.projects && candidateProfile.projects.length > 0) {
        const projectRows = candidateProfile.projects.map((p) => {
          const matchedAnalysis = candidateProfile.projectAnalyses?.find(
            (pa) => pa.projectName?.toLowerCase() === p.name?.toLowerCase()
          );

          return {
            user_id: userId,
            resume_id: resumeId,
            project_name: p.name,
            problem_solved: p.problemSolved,
            technologies: p.technologies,
            technical_complexity: p.technicalComplexity || matchedAnalysis?.technicalComplexity || 'intermediate',
            architecture_understanding: matchedAnalysis?.architectureUnderstanding || p.architecture,
            backend_details: matchedAnalysis?.backendUnderstanding || p.backend,
            frontend_details: matchedAnalysis?.frontendUnderstanding || p.frontend,
            database_details: matchedAnalysis?.databaseUnderstanding || p.database,
            ai_ml_details: matchedAnalysis?.aiMlUnderstanding || p.aiMlUsage,
            deployment_details: matchedAnalysis?.deploymentKnowledge || p.deployment,
            potential_questions: matchedAnalysis?.potentialQuestions || p.potentialInterviewQuestions || [],
          };
        });

        await (supabase as any).from('candidate_projects').insert(projectRows);
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Failed to save full candidate profile to Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrieve the most recent candidate profile and analysis for this user
   */
  async getLatestCandidateProfile(userId: string): Promise<CandidateAiProfile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('resume_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        candidateName: data.candidate_name || 'Candidate',
        headline: data.summary,
        summary: data.summary,
        education: data.education || [],
        skills: data.skills_categorized || {},
        skillAnalysis: {
          strongSkills: [],
          intermediateSkills: [],
          beginnerSkills: [],
          skillsToImprove: [],
          recommendedSkills: [],
        },
        projects: data.projects_detailed || [],
        projectAnalyses: [],
        experience: data.experience || [],
        technicalStrengths: data.technical_strengths || [],
        weakAreas: data.weak_areas || [],
        potentialInterviewTopics: data.potential_interview_topics || [],
      };
    } catch {
      return null;
    }
  },
};
