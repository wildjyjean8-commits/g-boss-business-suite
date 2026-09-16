-- ============================================================
-- G-BOSS — Migration v7 (Frè fiks + Login manm ekip pa wòl)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kategori fiks pou frè eskolarite (student_payments)
-- ------------------------------------------------------------
alter table public.student_payments
  add column if not exists category text not null default 'ekolaj';

alter table public.student_payments drop constraint if exists student_payments_category_check;
alter table public.student_payments
  add constraint student_payments_category_check
  check (category in ('enskripsyon', 'ekolaj', 'egzamen', 'inifòm', 'kantin', 'transpò', 'lòt'));

create index if not exists idx_student_payments_category on public.student_payments(business_id, category);

-- ------------------------------------------------------------
-- 2. Kòd aksè pou chak manm ekip — pèmèt yo konekte ak pwòp
--    kont Supabase pa yo epi mare yo ak biznis la san envitasyon email
-- ------------------------------------------------------------
alter table public.business_members add column if not exists access_code text;

create or replace function public.generate_member_access_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

create or replace function public.set_member_access_code()
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

drop trigger if exists trg_set_member_access_code on public.business_members;
create trigger trg_set_member_access_code
  before insert on public.business_members
  for each row execute function public.set_member_access_code();

-- Backfill manm ki te la deja anvan migrasyon sa a
update public.business_members
set access_code = public.generate_member_access_code()
where access_code is null;

create unique index if not exists idx_business_members_access_code
  on public.business_members(access_code);

-- Fonksyon pou yon manm mare kont Supabase pa li ak biznis la, atravè kòd
create or replace function public.link_team_member_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member record;
begin
  select * into v_member
  from public.business_members
  where access_code = upper(trim(p_code))
  limit 1;

  if v_member.id is null then
    raise exception 'Kòd la pa valab';
  end if;

  if v_member.user_id is not null and v_member.user_id <> auth.uid() then
    raise exception 'Kòd sa a deja itilize pa yon lòt kont';
  end if;

  update public.business_members
  set user_id = auth.uid()
  where id = v_member.id;

  return v_member.business_id;
end;
$$;

grant execute on function public.link_team_member_by_code(text) to authenticated;
