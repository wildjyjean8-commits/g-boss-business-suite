-- ============================================================
-- G-BOSS — Migration v8 (Pòtay Paran/Elèv)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kòd aksè pou chak elèv (pou paran/elèv mare pwòp kont yo)
-- ------------------------------------------------------------
alter table public.students add column if not exists access_code text;

create or replace function public.set_student_access_code()
returns trigger
language plpgsql
as $$
begin
  if new.access_code is null then
    new.access_code := public.generate_member_access_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_student_access_code on public.students;
create trigger trg_set_student_access_code
  before insert on public.students
  for each row execute function public.set_student_access_code();

update public.students
set access_code = public.generate_member_access_code()
where access_code is null;

create unique index if not exists idx_students_access_code on public.students(access_code);

-- ------------------------------------------------------------
-- 2. RLS: pèmèt paran/elèv wè pwòp ranje `students` yo
--    (student_grades / student_attendance / student_payments deja
--    gen aksè paran/elèv depi migrasyon v2 — sèlman students manke)
-- ------------------------------------------------------------
drop policy if exists students_select_guardian on public.students;
create policy students_select_guardian on public.students
  for select using (guardian_user_id = auth.uid() or student_user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. Fonksyon pou paran/elèv mare kont yo ak yon elèv atravè kòd
-- ------------------------------------------------------------
create or replace function public.link_guardian_by_code(p_code text, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
begin
  if p_role not in ('paran', 'elèv') then
    raise exception 'Wòl envalid';
  end if;

  select * into v_student
  from public.students
  where access_code = upper(trim(p_code))
  limit 1;

  if v_student.id is null then
    raise exception 'Kòd la pa valab';
  end if;

  if p_role = 'paran' then
    if v_student.guardian_user_id is not null and v_student.guardian_user_id <> auth.uid() then
      raise exception 'Kòd sa a deja mare ak yon lòt kont paran';
    end if;
    update public.students set guardian_user_id = auth.uid() where id = v_student.id;
  else
    if v_student.student_user_id is not null and v_student.student_user_id <> auth.uid() then
      raise exception 'Kòd sa a deja mare ak yon lòt kont elèv';
    end if;
    update public.students set student_user_id = auth.uid() where id = v_student.id;
  end if;

  return v_student.id;
end;
$$;

grant execute on function public.link_guardian_by_code(text, text) to authenticated;
