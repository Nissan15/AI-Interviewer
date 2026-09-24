-- Migration 004: Candidate Assessment Attempts and Answers Schema
-- Zero sample records inserted

-- Assessment Attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  status TEXT NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);

-- Assessment Answers
CREATE TABLE IF NOT EXISTS public.assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt_id ON public.assessment_answers(attempt_id);
