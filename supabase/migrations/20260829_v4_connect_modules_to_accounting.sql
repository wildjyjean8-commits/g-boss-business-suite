-- ============================================================
-- G-BOSS — Migration v4 (Konekte Founisè/Ekip/Otèl/Elèv ak Kontabilite)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. supplier_purchases (acha/depans bay yon founisè)
-- ------------------------------------------------------------
create table if not exists public.supplier_purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  description text,
  amount numeric not null check (amount > 0),
  purchase_date date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_supplier_purchases_business on public.supplier_purchases(business_id);
create index if not exists idx_supplier_purchases_supplier on public.supplier_purchases(supplier_id);

alter table public.supplier_purchases enable row level security;

create policy supplier_purchases_select on public.supplier_purchases
  for select using (is_business_member(business_id) or is_super_admin());
create policy supplier_purchases_insert on public.supplier_purchases
  for insert with check (is_business_member(business_id));
create policy supplier_purchases_update on public.supplier_purchases
  for update using (is_business_member(business_id));
create policy supplier_purchases_delete on public.supplier_purchases
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.supplier_purchases to authenticated;

create or replace function public.create_receipt_from_supplier_purchase()
returns trigger
language plpgsql
as $$
declare
  supplier_name text;
begin
  select name into supplier_name from public.suppliers where id = new.supplier_id;
  insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
  values (
    new.business_id,
    'depans',
    public.generate_receipt_reference(),
    supplier_name,
    new.amount,
    new.purchase_date,
    'founise',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_supplier_purchase on public.supplier_purchases;
create trigger trg_receipt_from_supplier_purchase after insert on public.supplier_purchases
  for each row execute function public.create_receipt_from_supplier_purchase();

-- ------------------------------------------------------------
-- 2. salary (kolòn sou business_members) + salary_payments
-- ------------------------------------------------------------
alter table public.business_members
  add column if not exists salary numeric;

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  member_id uuid not null references public.business_members(id) on delete cascade,
  amount numeric not null check (amount > 0),
  pay_date date not null default current_date,
  period_label text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_salary_payments_business on public.salary_payments(business_id);
create index if not exists idx_salary_payments_member on public.salary_payments(member_id);

alter table public.salary_payments enable row level security;

create policy salary_payments_select on public.salary_payments
  for select using (is_business_member(business_id) or is_super_admin());
create policy salary_payments_insert on public.salary_payments
  for insert with check (is_business_member(business_id));
create policy salary_payments_update on public.salary_payments
  for update using (is_business_member(business_id));
create policy salary_payments_delete on public.salary_payments
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.salary_payments to authenticated;

create or replace function public.create_receipt_from_salary_payment()
returns trigger
language plpgsql
as $$
declare
  member_name text;
begin
  select name into member_name from public.business_members where id = new.member_id;
  insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
  values (
    new.business_id,
    'depans',
    public.generate_receipt_reference(),
    member_name,
    new.amount,
    new.pay_date,
    'ekip',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_salary_payment on public.salary_payments;
create trigger trg_receipt_from_salary_payment after insert on public.salary_payments
  for each row execute function public.create_receipt_from_salary_payment();

-- ------------------------------------------------------------
-- 3. hotel_reservations -> resi otomatik (revni)
--    (tab la deja egziste; nou annik ajoute trigger la)
-- ------------------------------------------------------------
create or replace function public.create_receipt_from_hotel_reservation()
returns trigger
language plpgsql
as $$
begin
  if new.amount_paid > 0 and (
    tg_op = 'INSERT' or old.amount_paid is distinct from new.amount_paid
  ) then
    if not exists (select 1 from public.receipts where source = 'otel' and source_id = new.id) then
      insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
      values (
        new.business_id, 'vant', public.generate_receipt_reference(),
        new.guest_name, new.amount_paid, new.checkin, 'otel', new.id
      );
    else
      update public.receipts set amount = new.amount_paid
      where source = 'otel' and source_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_hotel_reservation on public.hotel_reservations;
create trigger trg_receipt_from_hotel_reservation after insert or update on public.hotel_reservations
  for each row execute function public.create_receipt_from_hotel_reservation();

-- ------------------------------------------------------------
-- 4. student_payments -> resi otomatik (revni)
--    (tab la deja egziste; nou annik ajoute trigger la)
-- ------------------------------------------------------------
create or replace function public.create_receipt_from_student_payment()
returns trigger
language plpgsql
as $$
declare
  student_name text;
begin
  if new.amount_paid > 0 and (
    tg_op = 'INSERT' or old.amount_paid is distinct from new.amount_paid
  ) then
    select name into student_name from public.students where id = new.student_id;
    if not exists (select 1 from public.receipts where source = 'elev' and source_id = new.id) then
      insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
      values (
        new.business_id, 'vant', public.generate_receipt_reference(),
        student_name, new.amount_paid, coalesce(new.paid_at::date, current_date), 'elev', new.id
      );
    else
      update public.receipts set amount = new.amount_paid
      where source = 'elev' and source_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_student_payment on public.student_payments;
create trigger trg_receipt_from_student_payment after insert or update on public.student_payments
  for each row execute function public.create_receipt_from_student_payment();
