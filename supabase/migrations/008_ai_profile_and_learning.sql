-- Migration 008: AI Candidate Profiles, Skills, Projects, Interview Questions & Answers, and Learning Recommendations
-- Fully RLS-enabled, strictly partitioned by auth.uid()

-- 1. Resume Analysis Table
CREATE TABLE IF NOT EXISTS public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  candidate_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  github TEXT,
  portfolio TEXT,
  summary TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  skills_categorized JSONB DEFAULT '{}'::jsonb,
  projects_detailed JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  technical_strengths JSONB DEFAULT '[]'::jsonb,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  potential_interview_topics JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_user_id ON public.resume_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume_id ON public.resume_analysis(resume_id);

-- 2. Candidate Skills Table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('strong', 'intermediate', 'beginner', 'improve', 'recommended')),
  evidence TEXT,
  project_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_user_id ON public.candidate_skills(user_id);

-- 3. Candidate Projects Table
CREATE TABLE IF NOT EXISTS public.candidate_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  problem_solved TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  technical_complexity TEXT CHECK (technical_complexity IN ('beginner', 'intermediate', 'advanced', 'expert')),
  architecture_understanding TEXT,
  backend_details TEXT,
  frontend_details TEXT,
  database_details TEXT,
  ai_ml_details TEXT,
  deployment_details TEXT,
  potential_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidate_projects_user_id ON public.candidate_projects(user_id);

-- 4. Interview Questions Table
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'general',
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  is_follow_up BOOLEAN DEFAULT false,
  follow_up_reason TEXT,
  expected_key_points JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_session_id ON public.interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_user_id ON public.interview_questions(user_id);

-- 5. Interview Answers Table
CREATE TABLE IF NOT EXISTS public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  technical_accuracy NUMERIC,
  communication NUMERIC,
  clarity NUMERIC,
  depth NUMERIC,
  problem_solving NUMERIC,
  confidence NUMERIC,
  quick_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id ON public.interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_user_id ON public.interview_answers(user_id);

-- 6. Learning Recommendations Table
CREATE TABLE IF NOT EXISTS public.learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  current_skill TEXT NOT NULL,
  weak_area TEXT NOT NULL,
  recommended_topic TEXT NOT NULL,
  practice_task TEXT NOT NULL,
  mock_test_focus TEXT NOT NULL,
  reassessment_criteria TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user_id ON public.learning_recommendations(user_id);

-- Ensure user_id column on interview_evaluations if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='interview_evaluations' AND column_name='user_id'
  ) THEN 
    ALTER TABLE public.interview_evaluations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='interview_evaluations' AND column_name='depth_score'
  ) THEN 
    ALTER TABLE public.interview_evaluations ADD COLUMN depth_score NUMERIC;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='interview_evaluations' AND column_name='problem_solving_score'
  ) THEN 
    ALTER TABLE public.interview_evaluations ADD COLUMN problem_solving_score NUMERIC;
  END IF;
END $$;

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_analysis
CREATE POLICY "Users can view own resume analysis"
  ON public.resume_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume analysis"
  ON public.resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume analysis"
  ON public.resume_analysis FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume analysis"
  ON public.resume_analysis FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for candidate_skills
CREATE POLICY "Users can view own candidate skills"
  ON public.candidate_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own candidate skills"
  ON public.candidate_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own candidate skills"
  ON public.candidate_skills FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own candidate skills"
  ON public.candidate_skills FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for candidate_projects
CREATE POLICY "Users can view own candidate projects"
  ON public.candidate_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own candidate projects"
  ON public.candidate_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own candidate projects"
  ON public.candidate_projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own candidate projects"
  ON public.candidate_projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for interview_questions
CREATE POLICY "Users can view own interview questions"
  ON public.interview_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview questions"
  ON public.interview_questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for interview_answers
CREATE POLICY "Users can view own interview answers"
  ON public.interview_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview answers"
  ON public.interview_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learning_recommendations
CREATE POLICY "Users can view own learning recommendations"
  ON public.learning_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning recommendations"
  ON public.learning_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own learning recommendations"
  ON public.learning_recommendations FOR DELETE USING (auth.uid() = user_id);
