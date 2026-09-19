-- ============================================================
-- G-BOSS — Migration v10 (Memo Kalkilatè)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

create table if not exists public.calc_memos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  note text,
  expression text,
  result numeric not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_calc_memos_business on public.calc_memos(business_id, created_at desc);

alter table public.calc_memos enable row level security;

create policy calc_memos_select on public.calc_memos
  for select using (is_business_member(business_id) or is_super_admin());
create policy calc_memos_insert on public.calc_memos
  for insert with check (is_business_member(business_id));
create policy calc_memos_delete on public.calc_memos
  for delete using (is_business_member(business_id));

grant select, insert, delete on public.calc_memos to authenticated;
