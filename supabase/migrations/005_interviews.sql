-- Migration 005: Interview Sessions, Messages, and Evaluations Schema
-- Zero sample records inserted

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration INTEGER,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);

-- Interview Messages Table
CREATE TABLE IF NOT EXISTS public.interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ai', 'user', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_messages_session_id ON public.interview_messages(session_id);

-- Interview Evaluations Table
CREATE TABLE IF NOT EXISTS public.interview_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE UNIQUE,
  communication_score NUMERIC,
  technical_score NUMERIC,
  relevance_score NUMERIC,
  clarity_score NUMERIC,
  confidence_score NUMERIC,
  overall_score NUMERIC,
  strengths JSONB,
  improvements JSONB,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_evaluations_session_id ON public.interview_evaluations(session_id);
