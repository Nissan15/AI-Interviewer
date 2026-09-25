export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Resume = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  parsed_data: Json | null;
  created_at: string;
  updated_at: string;
};

export type TechnicalQuestion = {
  id: string;
  category: string;
  question: string;
  options: Json;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
  created_at: string;
};

export type CodingProblem = {
  id: string;
  title: string;
  description: string;
  input_description: string | null;
  output_description: string | null;
  constraints: string | null;
  examples: Json | null;
  test_cases: Json | null;
  difficulty: string;
  supported_languages: Json | null;
  created_at: string;
};

export type AptitudeQuestion = {
  id: string;
  category: string;
  question: string;
  options: Json;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  created_at: string;
};

export type AssessmentAttempt = {
  id: string;
  user_id: string;
  assessment_type: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  status: string;
};

export type AssessmentAnswer = {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_taken: number | null;
  created_at: string;
};

export type InterviewSession = {
  id: string;
  user_id: string;
  resume_id: string | null;
  interview_type: string;
  difficulty: string;
  duration: number | null;
  started_at: string;
  ended_at: string | null;
  status: string;
};

export type InterviewMessage = {
  id: string;
  session_id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  timestamp: string;
};

export type InterviewEvaluation = {
  id: string;
  session_id: string;
  user_id?: string | null;
  communication_score: number | null;
  technical_score: number | null;
  relevance_score: number | null;
  clarity_score: number | null;
  confidence_score: number | null;
  depth_score?: number | null;
  problem_solving_score?: number | null;
  overall_score: number | null;
  strengths: Json | null;
  improvements: Json | null;
  feedback: string | null;
  created_at: string;
};

export type ResumeAnalysisRecord = {
  id: string;
  user_id: string;
  resume_id: string | null;
  candidate_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  summary: string | null;
  education: Json | null;
  skills_categorized: Json | null;
  projects_detailed: Json | null;
  experience: Json | null;
  certifications: Json | null;
  technical_strengths: Json | null;
  weak_areas: Json | null;
  potential_interview_topics: Json | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
};

export type CandidateSkillRecord = {
  id: string;
  user_id: string;
  resume_id: string | null;
  skill_name: string;
  category: string;
  proficiency_level: 'strong' | 'intermediate' | 'beginner' | 'improve' | 'recommended';
  evidence: string | null;
  project_count: number;
  created_at: string;
};

export type CandidateProjectRecord = {
  id: string;
  user_id: string;
  resume_id: string | null;
  project_name: string;
  problem_solved: string | null;
  technologies: Json | null;
  technical_complexity: string | null;
  architecture_understanding: string | null;
  backend_details: string | null;
  frontend_details: string | null;
  database_details: string | null;
  ai_ml_details: string | null;
  deployment_details: string | null;
  potential_questions: Json | null;
  created_at: string;
};

export type InterviewQuestionRecord = {
  id: string;
  session_id: string;
  user_id: string;
  question_number: number;
  question_text: string;
  question_type: string | null;
  topic: string | null;
  difficulty: string | null;
  is_follow_up: boolean;
  follow_up_reason: string | null;
  expected_key_points: Json | null;
  created_at: string;
};

export type InterviewAnswerRecord = {
  id: string;
  question_id: string;
  session_id: string;
  user_id: string;
  answer_text: string;
  technical_accuracy: number | null;
  communication: number | null;
  clarity: number | null;
  depth: number | null;
  problem_solving: number | null;
  confidence: number | null;
  quick_feedback: string | null;
  created_at: string;
};

export type LearningRecommendationRecord = {
  id: string;
  user_id: string;
  session_id: string | null;
  current_skill: string;
  weak_area: string;
  recommended_topic: string;
  practice_task: string;
  mock_test_focus: string;
  reassessment_criteria: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      resumes: {
        Row: Resume;
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          parsed_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          parsed_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resumes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      technical_questions: {
        Row: TechnicalQuestion;
        Insert: {
          id?: string;
          category: string;
          question: string;
          options: Json;
          correct_answer: string;
          difficulty: string;
          explanation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question?: string;
          options?: Json;
          correct_answer?: string;
          difficulty?: string;
          explanation?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coding_problems: {
        Row: CodingProblem;
        Insert: {
          id?: string;
          title: string;
          description: string;
          input_description?: string | null;
          output_description?: string | null;
          constraints?: string | null;
          examples?: Json | null;
          test_cases?: Json | null;
          difficulty: string;
          supported_languages?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          input_description?: string | null;
          output_description?: string | null;
          constraints?: string | null;
          examples?: Json | null;
          test_cases?: Json | null;
          difficulty?: string;
          supported_languages?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      aptitude_questions: {
        Row: AptitudeQuestion;
        Insert: {
          id?: string;
          category: string;
          question: string;
          options: Json;
          correct_answer: string;
          explanation?: string | null;
          difficulty: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question?: string;
          options?: Json;
          correct_answer?: string;
          difficulty?: string;
          explanation?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assessment_attempts: {
        Row: AssessmentAttempt;
        Insert: {
          id?: string;
          user_id: string;
          assessment_type: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assessment_type?: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      assessment_answers: {
        Row: AssessmentAnswer;
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_answer?: string | null;
          is_correct?: boolean | null;
          time_taken?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_answer?: string | null;
          is_correct?: boolean | null;
          time_taken?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_answers_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_attempts';
            referencedColumns: ['id'];
          }
        ];
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          interview_type: string;
          difficulty: string;
          duration?: number | null;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          interview_type?: string;
          difficulty?: string;
          duration?: number | null;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interview_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      interview_messages: {
        Row: InterviewMessage;
        Insert: {
          id?: string;
          session_id: string;
          role: 'ai' | 'user' | 'system';
          content: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'ai' | 'user' | 'system';
          content?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interview_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'interview_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      interview_evaluations: {
        Row: InterviewEvaluation;
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          communication_score?: number | null;
          technical_score?: number | null;
          relevance_score?: number | null;
          clarity_score?: number | null;
          confidence_score?: number | null;
          depth_score?: number | null;
          problem_solving_score?: number | null;
          overall_score?: number | null;
          strengths?: Json | null;
          improvements?: Json | null;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          communication_score?: number | null;
          technical_score?: number | null;
          relevance_score?: number | null;
          clarity_score?: number | null;
          confidence_score?: number | null;
          depth_score?: number | null;
          problem_solving_score?: number | null;
          overall_score?: number | null;
          strengths?: Json | null;
          improvements?: Json | null;
          feedback?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interview_evaluations_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: true;
            referencedRelation: 'interview_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      resume_analysis: {
        Row: ResumeAnalysisRecord;
        Insert: Partial<ResumeAnalysisRecord> & { user_id: string };
        Update: Partial<ResumeAnalysisRecord>;
        Relationships: [];
      };
      candidate_skills: {
        Row: CandidateSkillRecord;
        Insert: Partial<CandidateSkillRecord> & { user_id: string; skill_name: string; category: string; proficiency_level: 'strong' | 'intermediate' | 'beginner' | 'improve' | 'recommended' };
        Update: Partial<CandidateSkillRecord>;
        Relationships: [];
      };
      candidate_projects: {
        Row: CandidateProjectRecord;
        Insert: Partial<CandidateProjectRecord> & { user_id: string; project_name: string };
        Update: Partial<CandidateProjectRecord>;
        Relationships: [];
      };
      interview_questions: {
        Row: InterviewQuestionRecord;
        Insert: Partial<InterviewQuestionRecord> & { session_id: string; user_id: string; question_number: number; question_text: string };
        Update: Partial<InterviewQuestionRecord>;
        Relationships: [];
      };
      interview_answers: {
        Row: InterviewAnswerRecord;
        Insert: Partial<InterviewAnswerRecord> & { question_id: string; session_id: string; user_id: string; answer_text: string };
        Update: Partial<InterviewAnswerRecord>;
        Relationships: [];
      };
      learning_recommendations: {
        Row: LearningRecommendationRecord;
        Insert: Partial<LearningRecommendationRecord> & { user_id: string; current_skill: string; weak_area: string; recommended_topic: string; practice_task: string; mock_test_focus: string; reassessment_criteria: string };
        Update: Partial<LearningRecommendationRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
