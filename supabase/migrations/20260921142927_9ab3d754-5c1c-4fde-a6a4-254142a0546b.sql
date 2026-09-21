-- BEGIN UPSC production foundation

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS target_attempt text,
  ADD COLUMN IF NOT EXISTS preparation_stage text,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS preferred_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS exam_type text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS paper text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.subjects SET display_order = sort_order WHERE display_order = 0 AND sort_order <> 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'subjects_touch'
  ) THEN
    CREATE TRIGGER subjects_touch BEFORE UPDATE ON public.subjects
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

CREATE TABLE public.syllabus_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.syllabus_topics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.syllabus_topics TO authenticated;
GRANT ALL ON public.syllabus_topics TO service_role;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Syllabus topics are public readable"
ON public.syllabus_topics FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage syllabus topics"
ON public.syllabus_topics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER syllabus_topics_touch BEFORE UPDATE ON public.syllabus_topics
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.syllabus_topics (subject_id, title, description, display_order)
SELECT t.subject_id, t.title, 'Core UPSC syllabus area for structured tracking.', t.sort_order
FROM public.topics t
WHERE NOT EXISTS (
  SELECT 1 FROM public.syllabus_topics st
  WHERE st.subject_id = t.subject_id AND st.title = t.title
);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  explanation text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  question_type text NOT NULL DEFAULT 'practice' CHECK (question_type IN ('practice','previous_year','mock')),
  source text,
  source_year integer,
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published questions are readable"
ON public.questions FOR SELECT
TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage questions"
ON public.questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER questions_touch BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  test_type text NOT NULL DEFAULT 'mock' CHECK (test_type IN ('practice','mock','previous_year')),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 120,
  total_questions integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tests TO authenticated;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published tests are readable"
ON public.tests FOR SELECT
TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tests"
ON public.tests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tests_touch BEFORE UPDATE ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, question_id)
);
GRANT SELECT ON public.test_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.test_questions TO authenticated;
GRANT ALL ON public.test_questions TO service_role;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Test questions are readable"
ON public.test_questions FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage test questions"
ON public.test_questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  incorrect_answers integer NOT NULL DEFAULT 0,
  unanswered integer NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_attempts TO authenticated;
GRANT ALL ON public.test_attempts TO service_role;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own test attempts"
ON public.test_attempts FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option text CHECK (selected_option IN ('A','B','C','D')),
  is_correct boolean NOT NULL DEFAULT false,
  time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_answers TO authenticated;
GRANT ALL ON public.test_answers TO service_role;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own test answers"
ON public.test_answers FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.test_attempts ta
    WHERE ta.id = attempt_id AND ta.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.test_attempts ta
    WHERE ta.id = attempt_id AND ta.user_id = auth.uid()
  )
);

CREATE TABLE public.current_affairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  prelims_relevance text,
  mains_relevance text,
  source_url text,
  tags text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.current_affairs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.current_affairs TO authenticated;
GRANT ALL ON public.current_affairs TO service_role;
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published current affairs are readable"
ON public.current_affairs FOR SELECT
TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage current affairs"
ON public.current_affairs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER current_affairs_touch BEFORE UPDATE ON public.current_affairs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.current_affairs_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_affairs_id uuid NOT NULL REFERENCES public.current_affairs(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (current_affairs_id, topic_id)
);
GRANT SELECT ON public.current_affairs_topics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.current_affairs_topics TO authenticated;
GRANT ALL ON public.current_affairs_topics TO service_role;
ALTER TABLE public.current_affairs_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Current affairs links are readable"
ON public.current_affairs_topics FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage current affairs links"
ON public.current_affairs_topics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('topic','current_affairs','question','resource','mains_question')),
  content_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks"
ON public.bookmarks FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.study_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 60,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks TO authenticated;
GRANT ALL ON public.study_tasks TO service_role;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study tasks"
ON public.study_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER study_tasks_touch BEFORE UPDATE ON public.study_tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.mains_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  paper text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  word_limit integer NOT NULL DEFAULT 150,
  marks integer NOT NULL DEFAULT 10,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  evaluation_criteria text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mains_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mains_questions TO authenticated;
GRANT ALL ON public.mains_questions TO service_role;
ALTER TABLE public.mains_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published mains questions are readable"
ON public.mains_questions FOR SELECT
TO anon, authenticated
USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage mains questions"
ON public.mains_questions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER mains_questions_touch BEFORE UPDATE ON public.mains_questions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.mains_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.mains_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  word_count integer NOT NULL DEFAULT 0,
  time_spent integer NOT NULL DEFAULT 0,
  ai_feedback jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mains_submissions TO authenticated;
GRANT ALL ON public.mains_submissions TO service_role;
ALTER TABLE public.mains_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mains submissions"
ON public.mains_submissions FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER mains_submissions_touch BEFORE UPDATE ON public.mains_submissions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_type text NOT NULL CHECK (resource_type IN ('article','pdf','video','note','external_link','study_material')),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  file_url text,
  external_url text,
  thumbnail_url text,
  author text,
  published_date date DEFAULT CURRENT_DATE,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','draft')),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published resources are readable"
ON public.resources FOR SELECT
TO anon, authenticated
USING ((published = true AND visibility = 'public') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage resources"
ON public.resources FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  reference_id uuid,
  duration integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activity"
ON public.user_activity FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.topic_progress
  ADD COLUMN IF NOT EXISTS progress_percentage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_subjects_exam_order ON public.subjects(exam_type, display_order);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_subject ON public.syllabus_topics(subject_id, display_order);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_parent ON public.syllabus_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON public.questions(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(published, difficulty);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_completed ON public.test_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_current_affairs_category_date ON public.current_affairs(category, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type ON public.bookmarks(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date ON public.study_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_user ON public.mains_submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type, published);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON public.user_activity(user_id, created_at DESC);

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "subjects admin manage" ON public.subjects;
CREATE POLICY "subjects admin manage"
ON public.subjects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "topics admin manage" ON public.topics;
CREATE POLICY "topics admin manage"
ON public.topics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed/update subjects
INSERT INTO public.subjects (slug, name, stage, description, sort_order, exam_type, paper, display_order)
VALUES
  ('prelims-gs', 'General Studies Paper I', 'Prelims', 'Polity, economy, history, geography, environment, science and current affairs for Prelims.', 1, 'prelims', 'GS Paper I', 1),
  ('csat', 'CSAT', 'Prelims', 'Comprehension, reasoning, numeracy and decision making for the qualifying Prelims paper.', 2, 'prelims', 'CSAT', 2),
  ('essay', 'Essay', 'Mains', 'Essay writing practice with structure, examples and balanced arguments.', 3, 'mains', 'Essay', 3),
  ('gs1', 'GS Paper I', 'Mains', 'Indian heritage, history, society and geography.', 4, 'mains', 'GS I', 4),
  ('gs2', 'GS Paper II', 'Mains', 'Governance, Constitution, polity, social justice and international relations.', 5, 'mains', 'GS II', 5),
  ('gs3', 'GS Paper III', 'Mains', 'Economy, technology, environment, security and disaster management.', 6, 'mains', 'GS III', 6),
  ('gs4', 'GS Paper IV', 'Mains', 'Ethics, integrity, aptitude and case studies.', 7, 'mains', 'GS IV', 7),
  ('current-affairs', 'Current Affairs', 'Integrated', 'Daily and monthly issue-based preparation connected to syllabus topics.', 8, 'integrated', 'Current Affairs', 8),
  ('interview', 'Personality Test', 'Interview', 'DAF, current issues, communication and personality-test preparation.', 9, 'interview', 'Interview', 9)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  stage = EXCLUDED.stage,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  exam_type = EXCLUDED.exam_type,
  paper = EXCLUDED.paper,
  display_order = EXCLUDED.display_order;

WITH topic_seed(slug, title, description, display_order) AS (
  VALUES
  ('prelims-gs','Constitutional framework','Preamble, fundamental rights, DPSPs, federalism and constitutional bodies.',1),
  ('prelims-gs','Modern Indian history','Freedom struggle, socio-religious reform and important personalities.',2),
  ('prelims-gs','Indian economy basics','National income, inflation, fiscal policy, banking and development.',3),
  ('prelims-gs','Environment and ecology','Biodiversity, climate change, protected areas and environmental governance.',4),
  ('csat','Reading comprehension','Passage-based comprehension and inference practice.',1),
  ('csat','Quantitative aptitude','Numbers, percentages, ratios, averages and data interpretation.',2),
  ('essay','Essay structure','Introduction, thesis, dimensions, examples and conclusion.',1),
  ('gs1','Indian society','Diversity, women, population, urbanization and social empowerment.',1),
  ('gs2','Parliament and governance','Legislature, executive accountability, transparency and citizen charters.',1),
  ('gs2','International relations','India and its neighbourhood, global institutions and diaspora.',2),
  ('gs3','Indian economy and growth','Planning, inclusive growth, infrastructure and investment models.',1),
  ('gs3','Internal security','Border management, cyber security and extremism.',2),
  ('gs4','Ethics and human interface','Values, attitude, aptitude and emotional intelligence.',1),
  ('current-affairs','Daily issue analysis','Daily news themes connected to Prelims facts and Mains dimensions.',1),
  ('interview','DAF preparation','Background, hobbies, home state and service preference readiness.',1)
)
INSERT INTO public.syllabus_topics (subject_id, title, description, display_order)
SELECT s.id, ts.title, ts.description, ts.display_order
FROM topic_seed ts
JOIN public.subjects s ON s.slug = ts.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.syllabus_topics st WHERE st.subject_id = s.id AND st.title = ts.title
);

WITH qseed AS (
  SELECT
    'Which constitutional idea is directly reflected in the phrase “We, the people of India”?'::text question_text,
    'prelims-gs'::text slug,
    'Constitutional framework'::text topic_title,
    'Parliamentary sovereignty'::text a,
    'Popular sovereignty'::text b,
    'Judicial supremacy'::text c,
    'Rule by convention'::text d,
    'B'::text correct,
    'The phrase emphasizes that authority flows from the people, a core expression of popular sovereignty.'::text explanation,
    'easy'::text difficulty,
    'practice'::text qtype,
    1::int ord
  UNION ALL SELECT
    'A student wants to connect climate change with UPSC Mains GS III. Which angle is most relevant?',
    'gs3','Indian economy and growth','Ancient literary sources','Disaster management and sustainable development','Only medieval art forms','Personal biography writing','B',
    'GS III links climate change with disaster management, environment, agriculture, infrastructure and sustainable development.',
    'medium','practice',2
  UNION ALL SELECT
    'In CSAT comprehension, the safest answer is usually the option that is:',
    'csat','Reading comprehension','A broad outside fact','Closest to the passage evidence','The longest statement','A personal opinion','B',
    'CSAT comprehension answers must be supported by the passage rather than outside knowledge.',
    'easy','practice',3
  UNION ALL SELECT
    'Which ethics term best describes choosing public interest over personal gain?',
    'gs4','Ethics and human interface','Apathy','Integrity','Nepotism','Hedonism','B',
    'Integrity means consistency with moral principles and prioritising duty over improper private gain.',
    'easy','practice',4
)
INSERT INTO public.questions (question_text, subject_id, topic_id, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, question_type, source, tags)
SELECT q.question_text, s.id, st.id, q.a, q.b, q.c, q.d, q.correct, q.explanation, q.difficulty, q.qtype, 'BEGIN UPSC demo practice set', ARRAY['demo','starter']
FROM qseed q
JOIN public.subjects s ON s.slug = q.slug
LEFT JOIN public.syllabus_topics st ON st.subject_id = s.id AND st.title = q.topic_title
WHERE NOT EXISTS (SELECT 1 FROM public.questions existing WHERE existing.question_text = q.question_text);

INSERT INTO public.tests (title, description, test_type, duration_minutes, total_questions, published)
SELECT 'Starter Prelims Diagnostic', 'A short demo diagnostic to verify the practice flow. Not an official UPSC paper.', 'practice', 15, 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.tests WHERE title = 'Starter Prelims Diagnostic');

INSERT INTO public.test_questions (test_id, question_id, display_order)
SELECT t.id, q.id, row_number() over (order by q.created_at)
FROM public.tests t
JOIN public.questions q ON q.source = 'BEGIN UPSC demo practice set'
WHERE t.title = 'Starter Prelims Diagnostic'
ON CONFLICT (test_id, question_id) DO NOTHING;

INSERT INTO public.current_affairs (title, summary, content, category, published_date, prelims_relevance, mains_relevance, source_url, tags, is_demo)
VALUES
  ('Demo issue brief: Climate adaptation in public policy', 'A sample current-affairs brief showing how BEGIN UPSC links an issue to Prelims facts and Mains dimensions.', 'This is demo learning content, not live news. Use it to practise connecting climate adaptation with governance, economy, disaster management and vulnerable communities.', 'Environment', CURRENT_DATE, 'Key terms: adaptation, mitigation, resilience, vulnerability, disaster risk reduction.', 'Useful for GS III environment, disaster management and GS II governance answers.', NULL, ARRAY['demo','environment'], true),
  ('Demo issue brief: Digital public infrastructure', 'A sample brief for practising economy-governance linkages.', 'This is demo learning content, not a current official announcement. It helps frame digital public infrastructure through inclusion, privacy, service delivery and federal coordination.', 'Economy', CURRENT_DATE, 'Terms: DPI, digital payments, identity layers, inclusion, data protection.', 'Useful for GS II governance and GS III economy/technology answers.', NULL, ARRAY['demo','economy'], true)
ON CONFLICT DO NOTHING;

WITH mq AS (
  SELECT 'Discuss how climate adaptation can be integrated into district-level development planning.'::text question_text, 'GS III'::text paper, 'gs3'::text slug, 'Indian economy and growth'::text topic_title, 150::int word_limit, 10::int marks, 'medium'::text difficulty
  UNION ALL SELECT 'Ethical governance requires both rules and inner values. Explain with examples.', 'GS IV', 'gs4', 'Ethics and human interface', 150, 10, 'medium'
)
INSERT INTO public.mains_questions (question_text, paper, subject_id, topic_id, word_limit, marks, difficulty, evaluation_criteria)
SELECT mq.question_text, mq.paper, s.id, st.id, mq.word_limit, mq.marks, mq.difficulty, ARRAY['structure','relevance','examples','clarity','conclusion']
FROM mq
JOIN public.subjects s ON s.slug = mq.slug
LEFT JOIN public.syllabus_topics st ON st.subject_id = s.id AND st.title = mq.topic_title
WHERE NOT EXISTS (SELECT 1 FROM public.mains_questions existing WHERE existing.question_text = mq.question_text);

INSERT INTO public.resources (title, description, resource_type, external_url, author, visibility, published, published_date)
VALUES
  ('UPSC official syllabus portal', 'External reference link for the official UPSC examination syllabus and notifications.', 'external_link', 'https://upsc.gov.in', 'UPSC', 'public', true, CURRENT_DATE),
  ('BEGIN UPSC answer-writing checklist', 'Demo checklist for structuring Mains answers with introduction, body, examples and conclusion.', 'article', NULL, 'BEGIN UPSC', 'public', true, CURRENT_DATE)
ON CONFLICT DO NOTHING;
