-- ============================================================
-- G-BOSS — Migration v3 (Kontabilite/Liv Kont — Sistèm resi + Rapò)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. ledger_accounts (Chart of Accounts — kategori lib pa biznis)
-- ------------------------------------------------------------
create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type text not null check (type in ('revenu', 'depans')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_set_updated_at on public.ledger_accounts;
create trigger trg_set_updated_at before update on public.ledger_accounts
  for each row execute function public.set_updated_at();

alter table public.ledger_accounts enable row level security;

create policy ledger_accounts_select on public.ledger_accounts
  for select using (is_business_member(business_id) or is_super_admin());
create policy ledger_accounts_insert on public.ledger_accounts
  for insert with check (is_business_member(business_id));
create policy ledger_accounts_update on public.ledger_accounts
  for update using (is_business_member(business_id));
create policy ledger_accounts_delete on public.ledger_accounts
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.ledger_accounts to authenticated;

-- ------------------------------------------------------------
-- 2. receipts (resi — vant ak depans, façon QuickBooks)
-- ------------------------------------------------------------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('vant', 'depans')),
  reference text not null,
  party text,
  account_id uuid references public.ledger_accounts(id) on delete set null,
  amount numeric not null default 0,
  receipt_date date not null default current_date,
  file_url text,
  source text not null default 'manuel' check (source in ('manuel', 'vant', 'facture')),
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_receipts_business on public.receipts(business_id);
create index if not exists idx_receipts_source on public.receipts(source, source_id);

drop trigger if exists trg_set_updated_at on public.receipts;
create trigger trg_set_updated_at before update on public.receipts
  for each row execute function public.set_updated_at();

alter table public.receipts enable row level security;

create policy receipts_select on public.receipts
  for select using (is_business_member(business_id) or is_super_admin());
create policy receipts_insert on public.receipts
  for insert with check (is_business_member(business_id));
create policy receipts_update on public.receipts
  for update using (is_business_member(business_id));
create policy receipts_delete on public.receipts
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.receipts to authenticated;

-- ------------------------------------------------------------
-- 3. Referans otomatik pou resi (RC-YYYYMM-xxxx)
-- ------------------------------------------------------------
create or replace function public.generate_receipt_reference()
returns text
language plpgsql
as $$
declare
  stamp text := to_char(now(), 'YYYYMM');
  rand text := lpad(floor(random() * 9000 + 1000)::text, 4, '0');
begin
  return 'RC-' || stamp || '-' || rand;
end;
$$;

-- ------------------------------------------------------------
-- 4. Resi otomatik lè yon vant fèt nan Kès/Vant
-- ------------------------------------------------------------
create or replace function public.create_receipt_from_sale()
returns trigger
language plpgsql
as $$
begin
  insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
  values (
    new.business_id,
    'vant',
    public.generate_receipt_reference(),
    null,
    new.total,
    (new.occurred_at)::date,
    'vant',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_sale on public.sales;
create trigger trg_receipt_from_sale after insert on public.sales
  for each row execute function public.create_receipt_from_sale();

-- ------------------------------------------------------------
-- 5. Resi otomatik lè yon fakti vin "paye" (yon sèl fwa)
-- ------------------------------------------------------------
create or replace function public.create_receipt_from_paid_invoice()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paye' and (old.status is distinct from 'paye') then
    if not exists (
      select 1 from public.receipts
      where source = 'facture' and source_id = new.id
    ) then
      insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
      values (
        new.business_id,
        'vant',
        public.generate_receipt_reference(),
        new.client,
        new.amount,
        current_date,
        'facture',
        new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_paid_invoice on public.invoices;
create trigger trg_receipt_from_paid_invoice after update on public.invoices
  for each row execute function public.create_receipt_from_paid_invoice();

-- ------------------------------------------------------------
-- 6. Depo (Storage) prive pou eskane/foto resi depans
--    Chemen fichye a dwe kòmanse ak business_id: '<business_id>/xxx.jpg'
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists receipts_storage_select on storage.objects;
create policy receipts_storage_select on storage.objects
  for select using (
    bucket_id = 'receipts'
    and is_business_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists receipts_storage_insert on storage.objects;
create policy receipts_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and is_business_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists receipts_storage_delete on storage.objects;
create policy receipts_storage_delete on storage.objects
  for delete using (
    bucket_id = 'receipts'
    and is_business_member((storage.foldername(name))[1]::uuid)
  );
