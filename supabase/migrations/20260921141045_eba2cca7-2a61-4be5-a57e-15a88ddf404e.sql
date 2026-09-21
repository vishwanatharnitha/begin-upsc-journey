CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  target_year INT,
  optional_subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects public read" ON public.subjects FOR SELECT USING (true);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.topics TO anon;
GRANT SELECT ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics public read" ON public.topics FOR SELECT USING (true);

CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_progress TO authenticated;
GRANT ALL ON public.topic_progress TO service_role;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.topic_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  minutes INT NOT NULL DEFAULT 0,
  studied_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER notes_touch BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER progress_touch BEFORE UPDATE ON public.topic_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.subjects (slug, name, stage, description, sort_order) VALUES
('prelims-gs', 'Prelims GS Paper I', 'Prelims', 'History, Polity, Geography, Economy, Environment, Science', 1),
('csat', 'Prelims CSAT Paper II', 'Prelims', 'Comprehension, logical reasoning, basic numeracy', 2),
('essay', 'Essay (Paper I)', 'Mains', 'Essay writing practice and structure', 3),
('gs1', 'GS Paper I', 'Mains', 'Heritage, culture, history, geography of the world and society', 4),
('gs2', 'GS Paper II', 'Mains', 'Governance, Constitution, polity, social justice, international relations', 5),
('gs3', 'GS Paper III', 'Mains', 'Technology, economic development, environment, security', 6),
('gs4', 'GS Paper IV', 'Mains', 'Ethics, integrity and aptitude', 7),
('current-affairs', 'Current Affairs', 'Both', 'Daily newspaper, monthly magazines, government schemes', 8),
('interview', 'Personality Test', 'Interview', 'DAF based preparation and mock interviews', 9);

INSERT INTO public.topics (subject_id, title, sort_order)
SELECT s.id, t.title, t.ord FROM public.subjects s
JOIN (VALUES
('prelims-gs','Ancient and Medieval India',1),
('prelims-gs','Modern India and Freedom Struggle',2),
('prelims-gs','Art and Culture',3),
('prelims-gs','Indian Polity and Constitution',4),
('prelims-gs','Indian and World Geography',5),
('prelims-gs','Indian Economy and Budget Basics',6),
('prelims-gs','Environment and Ecology',7),
('prelims-gs','Science and Technology',8),
('csat','Reading Comprehension',1),
('csat','Logical Reasoning and Analytical Ability',2),
('csat','Basic Numeracy and Data Interpretation',3),
('essay','Essay Structure and Introductions',1),
('essay','Philosophical Essay Practice',2),
('essay','Current Affairs Based Essays',3),
('gs1','Indian Heritage and Culture',1),
('gs1','World History',2),
('gs1','Indian Society and Social Issues',3),
('gs1','Geography: Physical and Human',4),
('gs2','Constitution and Amendments',1),
('gs2','Parliament, Judiciary and Executive',2),
('gs2','Governance, Transparency and e-Governance',3),
('gs2','Social Justice and Welfare Schemes',4),
('gs2','International Relations',5),
('gs3','Indian Economy and Planning',1),
('gs3','Agriculture and Food Security',2),
('gs3','Science, Technology and Innovation',3),
('gs3','Environment, Disaster Management',4),
('gs3','Internal and External Security',5),
('gs4','Ethics and Human Interface',1),
('gs4','Attitude, Aptitude and Emotional Intelligence',2),
('gs4','Probity in Governance',3),
('gs4','Case Studies Practice',4),
('current-affairs','Daily Newspaper Notes',1),
('current-affairs','Monthly Magazine Revision',2),
('current-affairs','Government Schemes and Reports',3),
('current-affairs','Economic Survey and Budget',4),
('interview','DAF Analysis',1),
('interview','Home State and Hobbies',2),
('interview','Mock Interview Practice',3)
) AS t(slug, title, ord) ON t.slug = s.slug;