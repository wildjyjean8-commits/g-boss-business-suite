-- ============================================================
-- G-BOSS — Migration v2 (ADDITIVE ONLY, pa touche done ki egziste)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pwofil faktirasyon sou businesses
-- ------------------------------------------------------------
alter table public.businesses
  add column if not exists legal_name text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists tax_number text,
  add column if not exists logo_url text;

-- ------------------------------------------------------------
-- 2. Kolòn updated_at + trigger otomatik sou tab prensipal yo
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'businesses','business_members','products','invoices',
    'tasks','students','suppliers','hotel_units','hotel_reservations'
  ]
  loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now();', t);
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3. customers (kliyan — separe de suppliers)
-- ------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_set_updated_at on public.customers;
create trigger trg_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

create policy customers_select on public.customers
  for select using (is_business_member(business_id) or is_super_admin());
create policy customers_insert on public.customers
  for insert with check (is_business_member(business_id));
create policy customers_update on public.customers
  for update using (is_business_member(business_id));
create policy customers_delete on public.customers
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.customers to authenticated;

-- ------------------------------------------------------------
-- 4. email_verification_codes (kòd verifikasyon enskripsyon)
-- ------------------------------------------------------------
create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verif_email on public.email_verification_codes(email);

alter table public.email_verification_codes enable row level security;
-- Pa gen policy pou 'authenticated' oswa 'anon' — sèlman server functions
-- (via service_role, ki pase RLS) dwe li/ekri isit la. Anyen pa gen aksè
-- dirèkteman soti nan kliyan an.

-- ------------------------------------------------------------
-- 5. moncash_transactions (peman MonCash)
-- ------------------------------------------------------------
create table if not exists public.moncash_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  order_id text not null,
  moncash_transaction_id text,
  amount numeric not null default 0,
  currency text not null default 'HTG',
  status text not null default 'pending', -- pending | success | failed | cancelled
  purpose text not null default 'subscription', -- subscription | invoice | pos
  reference_id uuid, -- lien vè invoices.id oswa subscription_payments.id selon purpose
  raw_response jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists idx_moncash_business on public.moncash_transactions(business_id);
create index if not exists idx_moncash_order on public.moncash_transactions(order_id);

alter table public.moncash_transactions enable row level security;

create policy moncash_transactions_select on public.moncash_transactions
  for select using (is_business_member(business_id) or is_super_admin());
-- INSERT/UPDATE fèt sèlman via server function (service_role) apre
-- konfimasyon MonCash reyèl — pa gen policy insert/update pou 'authenticated'.

grant select on public.moncash_transactions to authenticated;

-- ------------------------------------------------------------
-- 6. Pòtay elèv/titè — lyen ant students ak yon itilizatè auth
-- ------------------------------------------------------------
alter table public.students
  add column if not exists guardian_user_id uuid references auth.users(id),
  add column if not exists student_user_id uuid references auth.users(id);

create or replace function public.is_student_or_guardian(p_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id
      and (s.guardian_user_id = auth.uid() or s.student_user_id = auth.uid())
  );
$$;

-- ------------------------------------------------------------
-- 7. student_grades (nòt pa matyè/peryòd)
-- ------------------------------------------------------------
create table if not exists public.student_grades (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  period text not null, -- ex: "Trimès 1"
  grade numeric not null,
  max_grade numeric not null default 20,
  comment text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_grades_student on public.student_grades(student_id);

alter table public.student_grades enable row level security;

create policy student_grades_select on public.student_grades
  for select using (
    is_business_member(business_id)
    or is_super_admin()
    or is_student_or_guardian(student_id)
  );
create policy student_grades_insert on public.student_grades
  for insert with check (is_business_member(business_id));
create policy student_grades_update on public.student_grades
  for update using (is_business_member(business_id));
create policy student_grades_delete on public.student_grades
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.student_grades to authenticated;

-- ------------------------------------------------------------
-- 8. student_attendance (prezans jou pa jou)
-- ------------------------------------------------------------
create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attended_on date not null default current_date,
  present boolean not null default true,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (student_id, attended_on)
);

create index if not exists idx_student_attendance_student on public.student_attendance(student_id);

alter table public.student_attendance enable row level security;

create policy student_attendance_select on public.student_attendance
  for select using (
    is_business_member(business_id)
    or is_super_admin()
    or is_student_or_guardian(student_id)
  );
create policy student_attendance_insert on public.student_attendance
  for insert with check (is_business_member(business_id));
create policy student_attendance_update on public.student_attendance
  for update using (is_business_member(business_id));
create policy student_attendance_delete on public.student_attendance
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.student_attendance to authenticated;

-- ------------------------------------------------------------
-- 9. student_payments (frè eskolarite pa elèv)
-- ------------------------------------------------------------
create table if not exists public.student_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  label text not null, -- ex: "Frè inskripsyon", "Mansyalite Sept."
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  due_date date,
  paid_at timestamptz,
  status text not null default 'attente', -- attente | paye | anreta
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_payments_student on public.student_payments(student_id);

alter table public.student_payments enable row level security;

create policy student_payments_select on public.student_payments
  for select using (
    is_business_member(business_id)
    or is_super_admin()
    or is_student_or_guardian(student_id)
  );
create policy student_payments_insert on public.student_payments
  for insert with check (is_business_member(business_id));
create policy student_payments_update on public.student_payments
  for update using (is_business_member(business_id));
create policy student_payments_delete on public.student_payments
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.student_payments to authenticated;

-- ------------------------------------------------------------
-- 10. Dekreman stock otomatik lè yon sale_item kreye
-- ------------------------------------------------------------
create or replace function public.decrement_stock_on_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
    set stock = greatest(stock - new.quantity, 0)
    where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_decrement_stock on public.sale_items;
create trigger trg_decrement_stock
  after insert on public.sale_items
  for each row execute function public.decrement_stock_on_sale();

-- ------------------------------------------------------------
-- 11. Vi rezime pou peman elèv (pou dashboard lekòl)
-- ------------------------------------------------------------
create or replace view public.v_student_payment_summary as
select
  business_id,
  count(*) as total_items,
  sum(amount_due) as total_due,
  sum(amount_paid) as total_paid,
  sum(amount_due - amount_paid) filter (where status <> 'paye') as total_outstanding
from public.student_payments
group by business_id;

-- ============================================================
-- FIN migration v2
-- ============================================================
