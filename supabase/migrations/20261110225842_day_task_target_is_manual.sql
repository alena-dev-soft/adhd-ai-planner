-- A target typed by the user stays when the task is renamed; the AI only fills
-- targets it set itself (or empty ones).
alter table public.day_tasks
  add column target_is_manual boolean not null default false;
