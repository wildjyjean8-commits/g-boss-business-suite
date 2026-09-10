-- ============================================================
-- G-BOSS — Migration v6 (Nòt & Prezans — G-Kanpis Phase 1)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- Pèmèt upsert (yon sèl antre prezans pa elèv pa jou)
create unique index if not exists idx_student_attendance_unique
  on public.student_attendance(student_id, attended_on);

-- ------------------------------------------------------------
-- 1. Rekalkile students.average otomatikman lè yon nòt chanje
-- ------------------------------------------------------------
create or replace function public.recompute_student_average()
returns trigger
language plpgsql
as $$
declare
  v_student_id uuid;
  v_avg numeric;
begin
  v_student_id := coalesce(new.student_id, old.student_id);

  select round(avg(grade / nullif(max_grade, 0) * 20)::numeric, 1)
  into v_avg
  from public.student_grades
  where student_id = v_student_id;

  update public.students set average = v_avg, updated_at = now() where id = v_student_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_average on public.student_grades;
create trigger trg_recompute_average
  after insert or update or delete on public.student_grades
  for each row execute function public.recompute_student_average();

-- ------------------------------------------------------------
-- 2. Rekalkile students.attendance (%) otomatikman
-- ------------------------------------------------------------
create or replace function public.recompute_student_attendance()
returns trigger
language plpgsql
as $$
declare
  v_student_id uuid;
  v_pct numeric;
begin
  v_student_id := coalesce(new.student_id, old.student_id);

  select round(100.0 * count(*) filter (where present) / nullif(count(*), 0))
  into v_pct
  from public.student_attendance
  where student_id = v_student_id;

  update public.students set attendance = v_pct, updated_at = now() where id = v_student_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_attendance on public.student_attendance;
create trigger trg_recompute_attendance
  after insert or update or delete on public.student_attendance
  for each row execute function public.recompute_student_attendance();
