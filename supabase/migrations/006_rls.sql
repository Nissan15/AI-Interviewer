-- Migration 006: Row Level Security (RLS) Policies
-- Enforces strict ownership checks using auth.uid() on all user tables

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Resumes Table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Public/Shared Question Banks (Readable by authenticated users)
ALTER TABLE public.technical_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read technical questions"
  ON public.technical_questions FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read coding problems"
  ON public.coding_problems FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read aptitude questions"
  ON public.aptitude_questions FOR SELECT
  TO authenticated
  USING (true);

-- 4. Assessment Attempts Table
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment attempts"
  ON public.assessment_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment attempts"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment attempts"
  ON public.assessment_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Assessment Answers Table (Restricted via parent attempt user_id)
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answers for own attempts"
  ON public.assessment_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts
      WHERE public.assessment_attempts.id = assessment_answers.attempt_id
      AND public.assessment_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert answers for own attempts"
  ON public.assessment_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_attempts
      WHERE public.assessment_attempts.id = assessment_answers.attempt_id
      AND public.assessment_attempts.user_id = auth.uid()
    )
  );

-- 6. Interview Sessions Table
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview sessions"
  ON public.interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
  ON public.interview_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Interview Messages Table (Restricted via session ownership)
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own sessions"
  ON public.interview_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE public.interview_sessions.id = interview_messages.session_id
      AND public.interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into own sessions"
  ON public.interview_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE public.interview_sessions.id = interview_messages.session_id
      AND public.interview_sessions.user_id = auth.uid()
    )
  );

-- 8. Interview Evaluations Table (Restricted via session ownership)
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evaluations for own sessions"
  ON public.interview_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE public.interview_sessions.id = interview_evaluations.session_id
      AND public.interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evaluations for own sessions"
  ON public.interview_evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE public.interview_sessions.id = interview_evaluations.session_id
      AND public.interview_sessions.user_id = auth.uid()
    )
  );
