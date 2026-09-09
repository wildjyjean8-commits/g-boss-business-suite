-- ============================================================
-- G-BOSS — Migration v5 (Bilan konplè + Payroll)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

-- ------------------------------------------------------------
-- 1. owner_equity_entries (Kapital enjekte / Tirad pwopriyetè)
-- ------------------------------------------------------------
create table if not exists public.owner_equity_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('kapital', 'tirad')),
  amount numeric not null check (amount > 0),
  entry_date date not null default current_date,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_owner_equity_business on public.owner_equity_entries(business_id);

alter table public.owner_equity_entries enable row level security;

create policy owner_equity_select on public.owner_equity_entries
  for select using (is_business_member(business_id) or is_super_admin());
create policy owner_equity_insert on public.owner_equity_entries
  for insert with check (is_business_member(business_id));
create policy owner_equity_update on public.owner_equity_entries
  for update using (is_business_member(business_id));
create policy owner_equity_delete on public.owner_equity_entries
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.owner_equity_entries to authenticated;

-- ------------------------------------------------------------
-- 2. liabilities (Dèt / Prè bankè / Kont pou peye manyèl)
-- ------------------------------------------------------------
create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('prè_bankè', 'founisè', 'lòt')),
  creditor text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'an_atant' check (status in ('an_atant', 'peye')),
  due_date date,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_liabilities_business on public.liabilities(business_id);

drop trigger if exists trg_set_updated_at on public.liabilities;
create trigger trg_set_updated_at before update on public.liabilities
  for each row execute function public.set_updated_at();

alter table public.liabilities enable row level security;

create policy liabilities_select on public.liabilities
  for select using (is_business_member(business_id) or is_super_admin());
create policy liabilities_insert on public.liabilities
  for insert with check (is_business_member(business_id));
create policy liabilities_update on public.liabilities
  for update using (is_business_member(business_id));
create policy liabilities_delete on public.liabilities
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.liabilities to authenticated;

-- Lè yon dèt/prè vin "peye", kreye yon resi depans otomatikman
create or replace function public.create_receipt_from_liability_payment()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'peye' and (old.status is distinct from 'peye') then
    if not exists (select 1 from public.receipts where source = 'dèt' and source_id = new.id) then
      insert into public.receipts (business_id, kind, reference, party, amount, receipt_date, source, source_id)
      values (
        new.business_id, 'depans', public.generate_receipt_reference(),
        new.creditor, new.amount, current_date, 'dèt', new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_liability_payment on public.liabilities;
create trigger trg_receipt_from_liability_payment after update on public.liabilities
  for each row execute function public.create_receipt_from_liability_payment();

-- ------------------------------------------------------------
-- 3. Vi Bilan (Balance Sheet) — kalkile an tan reyèl pa biznis
--    Prensip: Aktif = Pasif + Kapital Pwòp (toujou balanse)
-- ------------------------------------------------------------
create or replace view public.v_balance_sheet as
select
  b.id as business_id,
  -- ACTIF
  coalesce((select sum(r.amount) from public.receipts r where r.business_id = b.id and r.kind = 'vant'), 0)
    - coalesce((select sum(r.amount) from public.receipts r where r.business_id = b.id and r.kind = 'depans'), 0)
    + coalesce((select sum(e.amount) from public.owner_equity_entries e where e.business_id = b.id and e.kind = 'kapital'), 0)
    - coalesce((select sum(e.amount) from public.owner_equity_entries e where e.business_id = b.id and e.kind = 'tirad'), 0)
    as kach,
  coalesce((select sum(i.amount) from public.invoices i where i.business_id = b.id and i.status <> 'paye'), 0)
    as kont_pou_resevwa,
  case when b.stock_enabled then
    coalesce((select sum(p.stock * p.cost) from public.products p where p.business_id = b.id), 0)
  else 0 end as valè_estòk,
  -- PASIF
  coalesce((select sum(l.amount) from public.liabilities l where l.business_id = b.id and l.status = 'an_atant'), 0)
    as pasif_total,
  -- Enfo sou Kapital Pwòp (pou detay/afichaj sèlman)
  coalesce((select sum(e.amount) from public.owner_equity_entries e where e.business_id = b.id and e.kind = 'kapital'), 0)
    as kapital_enjekte,
  coalesce((select sum(e.amount) from public.owner_equity_entries e where e.business_id = b.id and e.kind = 'tirad'), 0)
    as tirad_total
from public.businesses b;

grant select on public.v_balance_sheet to authenticated;

-- ------------------------------------------------------------
-- 4. Payroll — payroll_runs + payroll_run_items
-- ------------------------------------------------------------
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'brouyon' check (status in ('brouyon', 'trete')),
  total_amount numeric not null default 0,
  processed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_payroll_runs_business on public.payroll_runs(business_id);

alter table public.payroll_runs enable row level security;

create policy payroll_runs_select on public.payroll_runs
  for select using (is_business_member(business_id) or is_super_admin());
create policy payroll_runs_insert on public.payroll_runs
  for insert with check (is_business_member(business_id));
create policy payroll_runs_update on public.payroll_runs
  for update using (is_business_member(business_id));
create policy payroll_runs_delete on public.payroll_runs
  for delete using (is_business_member(business_id));

grant select, insert, update, delete on public.payroll_runs to authenticated;

create table if not exists public.payroll_run_items (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  member_id uuid references public.business_members(id) on delete set null,
  member_name text not null,
  salary numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_payroll_items_run on public.payroll_run_items(payroll_run_id);

alter table public.payroll_run_items enable row level security;

create policy payroll_items_select on public.payroll_run_items
  for select using (is_business_member(business_id) or is_super_admin());
create policy payroll_items_insert on public.payroll_run_items
  for insert with check (is_business_member(business_id));
create policy payroll_items_delete on public.payroll_run_items
  for delete using (is_business_member(business_id));

grant select, insert, delete on public.payroll_run_items to authenticated;

-- Kreye yon payroll run brouyon ak yon liy pou chak anplwaye aktif ki gen salè
create or replace function public.create_payroll_run(
  p_business_id uuid, p_period_label text, p_period_start date, p_period_end date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
begin
  if not is_business_member(p_business_id) then
    raise exception 'Pa otorize';
  end if;

  insert into public.payroll_runs (business_id, period_label, period_start, period_end, created_by)
  values (p_business_id, p_period_label, p_period_start, p_period_end, auth.uid())
  returning id into v_run_id;

  insert into public.payroll_run_items (payroll_run_id, business_id, member_id, member_name, salary)
  select v_run_id, p_business_id, m.id, m.name, m.salary
  from public.business_members m
  where m.business_id = p_business_id and m.active = true and coalesce(m.salary, 0) > 0;

  update public.payroll_runs
  set total_amount = coalesce((select sum(salary) from public.payroll_run_items where payroll_run_id = v_run_id), 0)
  where id = v_run_id;

  return v_run_id;
end;
$$;

-- Trete yon payroll run: kreye yon salary_payment pou chak anplwaye
-- (sa deja deklanche resi depans otomatik atravè trigger ki egziste a)
create or replace function public.process_payroll_run(p_run_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_period_label text;
  item record;
begin
  select business_id, period_label into v_business_id, v_period_label
  from public.payroll_runs where id = p_run_id and status = 'brouyon';

  if v_business_id is null then
    raise exception 'Payroll run pa jwenn oswa deja trete';
  end if;

  if not is_business_member(v_business_id) then
    raise exception 'Pa otorize';
  end if;

  for item in select * from public.payroll_run_items where payroll_run_id = p_run_id loop
    insert into public.salary_payments (business_id, member_id, amount, pay_date, period_label, created_by)
    values (v_business_id, item.member_id, item.salary, current_date, v_period_label, auth.uid());
  end loop;

  update public.payroll_runs
  set status = 'trete', processed_at = now()
  where id = p_run_id;
end;
$$;
