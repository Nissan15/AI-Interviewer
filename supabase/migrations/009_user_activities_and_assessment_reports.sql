-- Migration 009: User Activities and Assessment Reports Schema
-- Fully isolated per user (auth.uid() = user_id) with strict RLS policies to prevent mingling

-- 1. User Activities Table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- Enable RLS for User Activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON public.user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.user_activities FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Assessment Reports Table (Stores comprehensive reports for all assessment types)
CREATE TABLE IF NOT EXISTS public.assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.assessment_attempts(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL, -- 'aptitude', 'technical', 'coding', 'interview'
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  skipped_answers INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  report_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON public.assessment_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_type ON public.assessment_reports(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_created_at ON public.assessment_reports(created_at DESC);

-- Enable RLS for Assessment Reports
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment reports"
  ON public.assessment_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment reports"
  ON public.assessment_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment reports"
  ON public.assessment_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessment reports"
  ON public.assessment_reports FOR DELETE
  USING (auth.uid() = user_id);
