-- ============================================================
-- G-BOSS — Migration v11 (Matières, Emploi du temps, Discipline, Annonces)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. Matières
-- ------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_subjects_unique on public.subjects(business_id, name);

alter table public.subjects enable row level security;
create policy subjects_select on public.subjects for select using (is_business_member(business_id) or is_super_admin());
create policy subjects_insert on public.subjects for insert with check (is_business_member(business_id));
create policy subjects_delete on public.subjects for delete using (is_business_member(business_id));
grant select, insert, delete on public.subjects to authenticated;

-- ------------------------------------------------------------
-- 2. Emploi du temps
-- ------------------------------------------------------------
create table if not exists public.class_schedule (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  classroom text not null,
  subject text not null,
  teacher_name text,
  day_of_week int not null check (day_of_week between 1 and 6), -- 1=Lundi .. 6=Samedi
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_class_schedule_business on public.class_schedule(business_id, classroom);

alter table public.class_schedule enable row level security;
create policy class_schedule_select on public.class_schedule for select using (is_business_member(business_id) or is_super_admin());
create policy class_schedule_insert on public.class_schedule for insert with check (is_business_member(business_id));
create policy class_schedule_update on public.class_schedule for update using (is_business_member(business_id));
create policy class_schedule_delete on public.class_schedule for delete using (is_business_member(business_id));
grant select, insert, update, delete on public.class_schedule to authenticated;

-- ------------------------------------------------------------
-- 3. Discipline
-- ------------------------------------------------------------
create table if not exists public.discipline_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  occurred_on date not null default current_date,
  category text not null default 'avètisman' check (category in ('avètisman', 'sanksyon', 'ekspilsyon', 'lòt')),
  description text not null,
  action_taken text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_discipline_business on public.discipline_records(business_id, student_id);

alter table public.discipline_records enable row level security;
create policy discipline_select on public.discipline_records
  for select using (is_business_member(business_id) or is_super_admin() or is_student_or_guardian(student_id));
create policy discipline_insert on public.discipline_records for insert with check (is_business_member(business_id));
create policy discipline_delete on public.discipline_records for delete using (is_business_member(business_id));
grant select, insert, delete on public.discipline_records to authenticated;

-- ------------------------------------------------------------
-- 4. Annonces
-- ------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_business on public.announcements(business_id, created_at desc);

alter table public.announcements enable row level security;
create policy announcements_select on public.announcements
  for select using (
    is_business_member(business_id) or is_super_admin()
    or exists (select 1 from public.students s where s.business_id = announcements.business_id and (s.guardian_user_id = auth.uid() or s.student_user_id = auth.uid()))
  );
create policy announcements_insert on public.announcements for insert with check (is_business_member(business_id));
create policy announcements_delete on public.announcements for delete using (is_business_member(business_id));
grant select, insert, delete on public.announcements to authenticated;
