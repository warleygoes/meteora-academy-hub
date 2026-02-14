-- Drop the wrong unique constraint
ALTER TABLE public.lesson_progress DROP CONSTRAINT lesson_progress_user_id_course_id_key;

-- Delete duplicate records keeping only the latest per (user_id, course_id, lesson_id)
DELETE FROM public.lesson_progress a
USING public.lesson_progress b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.course_id = b.course_id
  AND a.lesson_id = b.lesson_id;

-- Add the correct unique constraint
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_user_course_lesson_key UNIQUE (user_id, course_id, lesson_id);