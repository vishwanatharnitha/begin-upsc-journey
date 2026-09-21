CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
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

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read"
ON public.profiles FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "subjects admin manage" ON public.subjects;
CREATE POLICY "subjects admin manage"
ON public.subjects FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "topics admin manage" ON public.topics;
CREATE POLICY "topics admin manage"
ON public.topics FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Syllabus topics are public readable" ON public.syllabus_topics;
DROP POLICY IF EXISTS "Admins manage syllabus topics" ON public.syllabus_topics;
CREATE POLICY "Syllabus topics are public readable"
ON public.syllabus_topics FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage syllabus topics"
ON public.syllabus_topics FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published questions are readable" ON public.questions;
DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Published questions are readable"
ON public.questions FOR SELECT
TO anon, authenticated
USING (published = true OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage questions"
ON public.questions FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published tests are readable" ON public.tests;
DROP POLICY IF EXISTS "Admins manage tests" ON public.tests;
CREATE POLICY "Published tests are readable"
ON public.tests FOR SELECT
TO anon, authenticated
USING (published = true OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tests"
ON public.tests FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Test questions are readable" ON public.test_questions;
DROP POLICY IF EXISTS "Admins manage test questions" ON public.test_questions;
CREATE POLICY "Test questions are readable"
ON public.test_questions FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage test questions"
ON public.test_questions FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own test attempts" ON public.test_attempts;
CREATE POLICY "Users manage own test attempts"
ON public.test_attempts FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own test answers" ON public.test_answers;
CREATE POLICY "Users manage own test answers"
ON public.test_answers FOR ALL
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.test_attempts ta
    WHERE ta.id = attempt_id AND ta.user_id = auth.uid()
  )
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.test_attempts ta
    WHERE ta.id = attempt_id AND ta.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Published current affairs are readable" ON public.current_affairs;
DROP POLICY IF EXISTS "Admins manage current affairs" ON public.current_affairs;
CREATE POLICY "Published current affairs are readable"
ON public.current_affairs FOR SELECT
TO anon, authenticated
USING (published = true OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage current affairs"
ON public.current_affairs FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Current affairs links are readable" ON public.current_affairs_topics;
DROP POLICY IF EXISTS "Admins manage current affairs links" ON public.current_affairs_topics;
CREATE POLICY "Current affairs links are readable"
ON public.current_affairs_topics FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins manage current affairs links"
ON public.current_affairs_topics FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage own bookmarks"
ON public.bookmarks FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own study tasks" ON public.study_tasks;
CREATE POLICY "Users manage own study tasks"
ON public.study_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published mains questions are readable" ON public.mains_questions;
DROP POLICY IF EXISTS "Admins manage mains questions" ON public.mains_questions;
CREATE POLICY "Published mains questions are readable"
ON public.mains_questions FOR SELECT
TO anon, authenticated
USING (published = true OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage mains questions"
ON public.mains_questions FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own mains submissions" ON public.mains_submissions;
CREATE POLICY "Users manage own mains submissions"
ON public.mains_submissions FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Published resources are readable" ON public.resources;
DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Published resources are readable"
ON public.resources FOR SELECT
TO anon, authenticated
USING ((published = true AND visibility = 'public') OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage resources"
ON public.resources FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own activity" ON public.user_activity;
CREATE POLICY "Users manage own activity"
ON public.user_activity FOR ALL
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
