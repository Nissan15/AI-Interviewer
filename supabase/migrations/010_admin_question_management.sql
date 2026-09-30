-- Migration 010: Admin Question & Test Management System
-- Implements role-based access control, unified questions bank (Aptitude & Technical only),
-- configurable categories/topics, test management, and strict Row Level Security (RLS).

-- ============================================================================
-- 1. UPDATE PROFILES FOR USER ROLES
-- ============================================================================

-- Add role column to public.profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function to handle user role from raw_user_meta_data if present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 2. CATEGORIES AND TOPICS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'technical')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_category_name_type UNIQUE (name, type)
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'technical')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_topic_category_type UNIQUE (name, category_name, type)
);

CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category_name);
CREATE INDEX IF NOT EXISTS idx_topics_type ON public.topics(type);


-- ============================================================================
-- 3. UNIFIED QUESTIONS TABLE (Aptitude & Technical ONLY - No Coding)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'technical')),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  technology TEXT, -- for technical questions (e.g. Python, Java, JavaScript, React, SQL)
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marks INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER NOT NULL DEFAULT 60, -- time limit in seconds
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(active);
CREATE INDEX IF NOT EXISTS idx_questions_technology ON public.questions(technology);


-- ============================================================================
-- 4. TESTS & TEST_QUESTIONS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'technical')),
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 0,
  difficulty_distribution JSONB DEFAULT '{"easy": 5, "medium": 10, "hard": 5}'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tests_type ON public.tests(type);
CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);

CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_test_question UNIQUE (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_question_id ON public.test_questions(question_id);


-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Categories RLS:
-- Authenticated users (students & admins) can read categories
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Admins can create/update/delete categories
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Topics RLS:
-- Authenticated users can view topics
CREATE POLICY "Authenticated users can view topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage topics
CREATE POLICY "Admins can manage topics"
  ON public.topics FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Questions RLS:
-- Students can read only active questions
CREATE POLICY "Students can view active questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (active = true OR public.is_admin());

-- Admins can insert questions
CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can update questions (including soft delete / active toggle)
CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete questions
CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Tests RLS:
-- Students can view only published tests; admins can view all tests
CREATE POLICY "Students can view published tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());

-- Admins can create tests
CREATE POLICY "Admins can insert tests"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can update tests
CREATE POLICY "Admins can update tests"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete tests
CREATE POLICY "Admins can delete tests"
  ON public.tests FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Test Questions RLS:
-- Students can view questions for published tests; admins can view all
CREATE POLICY "Students can view test_questions for published tests"
  ON public.test_questions FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.tests
      WHERE public.tests.id = public.test_questions.test_id
      AND public.tests.status = 'published'
    )
  );

-- Admins can manage test_questions
CREATE POLICY "Admins can manage test_questions"
  ON public.test_questions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================================
-- 6. SEED INITIAL CATEGORIES & TOPICS
-- ============================================================================

-- Aptitude Categories
INSERT INTO public.categories (name, type) VALUES
  ('Quantitative Aptitude', 'aptitude'),
  ('Logical Reasoning', 'aptitude'),
  ('Verbal Ability', 'aptitude'),
  ('Data Interpretation', 'aptitude')
ON CONFLICT (name, type) DO NOTHING;

-- Aptitude Topics
INSERT INTO public.topics (category_name, name, type) VALUES
  ('Quantitative Aptitude', 'Percentages', 'aptitude'),
  ('Quantitative Aptitude', 'Profit and Loss', 'aptitude'),
  ('Quantitative Aptitude', 'Time and Work', 'aptitude'),
  ('Quantitative Aptitude', 'Time, Speed and Distance', 'aptitude'),
  ('Quantitative Aptitude', 'Probability', 'aptitude'),
  ('Quantitative Aptitude', 'Ratio and Proportion', 'aptitude'),
  ('Quantitative Aptitude', 'Number System', 'aptitude'),
  ('Quantitative Aptitude', 'Averages', 'aptitude'),
  ('Quantitative Aptitude', 'Permutations and Combinations', 'aptitude'),
  ('Logical Reasoning', 'Logical Series', 'aptitude'),
  ('Logical Reasoning', 'Coding-Decoding', 'aptitude'),
  ('Logical Reasoning', 'Blood Relations', 'aptitude'),
  ('Logical Reasoning', 'Syllogisms', 'aptitude'),
  ('Verbal Ability', 'Reading Comprehension', 'aptitude'),
  ('Verbal Ability', 'Grammar', 'aptitude'),
  ('Data Interpretation', 'Bar Charts', 'aptitude'),
  ('Data Interpretation', 'Pie Charts', 'aptitude'),
  ('Data Interpretation', 'Data Tables', 'aptitude')
ON CONFLICT (name, category_name, type) DO NOTHING;

-- Technical Technologies/Categories
INSERT INTO public.categories (name, type) VALUES
  ('Python', 'technical'),
  ('Java', 'technical'),
  ('JavaScript', 'technical'),
  ('SQL', 'technical'),
  ('React', 'technical'),
  ('Computer Science Fundamentals', 'technical')
ON CONFLICT (name, type) DO NOTHING;

-- Technical Topics
INSERT INTO public.topics (category_name, name, type) VALUES
  ('Computer Science Fundamentals', 'OOP', 'technical'),
  ('Computer Science Fundamentals', 'DBMS', 'technical'),
  ('Computer Science Fundamentals', 'Operating Systems', 'technical'),
  ('Computer Science Fundamentals', 'Computer Networks', 'technical'),
  ('Computer Science Fundamentals', 'Data Structures', 'technical'),
  ('Computer Science Fundamentals', 'Algorithms', 'technical'),
  ('Computer Science Fundamentals', 'Software Engineering', 'technical'),
  ('SQL', 'SQL Queries', 'technical'),
  ('JavaScript', 'Web Development', 'technical'),
  ('JavaScript', 'Programming Fundamentals', 'technical'),
  ('Python', 'Programming Fundamentals', 'technical'),
  ('Java', 'OOP', 'technical'),
  ('React', 'Frontend Engineering', 'technical')
ON CONFLICT (name, category_name, type) DO NOTHING;
