-- Migration 003: Assessment Questions Schema
-- Sets up tables for technical questions, coding problems, and aptitude questions
-- Zero sample records inserted

-- Technical Questions Table
CREATE TABLE IF NOT EXISTS public.technical_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tech_questions_category ON public.technical_questions(category);
CREATE INDEX IF NOT EXISTS idx_tech_questions_difficulty ON public.technical_questions(difficulty);

-- Coding Problems Table
CREATE TABLE IF NOT EXISTS public.coding_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  input_description TEXT,
  output_description TEXT,
  constraints TEXT,
  examples JSONB,
  test_cases JSONB,
  difficulty TEXT NOT NULL,
  supported_languages JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON public.coding_problems(difficulty);

-- Aptitude Questions Table
CREATE TABLE IF NOT EXISTS public.aptitude_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aptitude_questions_category ON public.aptitude_questions(category);
