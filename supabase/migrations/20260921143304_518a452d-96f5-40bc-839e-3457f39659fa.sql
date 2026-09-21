ALTER TABLE public.topic_progress DROP CONSTRAINT IF EXISTS topic_progress_topic_id_fkey;
DELETE FROM public.topic_progress tp
WHERE NOT EXISTS (
  SELECT 1 FROM public.syllabus_topics st WHERE st.id = tp.topic_id
);
ALTER TABLE public.topic_progress
  ADD CONSTRAINT topic_progress_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES public.syllabus_topics(id) ON DELETE CASCADE;
