CREATE TABLE IF NOT EXISTS public.current_affairs_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_affairs_id uuid NOT NULL REFERENCES public.current_affairs(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, current_affairs_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.current_affairs_reads TO authenticated;
GRANT ALL ON public.current_affairs_reads TO service_role;
ALTER TABLE public.current_affairs_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners can manage their own current affairs reads"
ON public.current_affairs_reads
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS current_affairs_reads_touch ON public.current_affairs_reads;
CREATE TRIGGER current_affairs_reads_touch
BEFORE UPDATE ON public.current_affairs_reads
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.mains_submissions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

ALTER TABLE public.test_answers
ADD COLUMN IF NOT EXISTS marked_for_review boolean NOT NULL DEFAULT false;
