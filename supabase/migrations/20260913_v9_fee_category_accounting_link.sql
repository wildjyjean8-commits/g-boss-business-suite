-- ============================================================
-- G-BOSS — Migration v9 (Mare kategori frè eskolarite ak Kontabilite)
-- Kouri sa a nan Supabase SQL Editor, pwojè qyguhdkjyesvmbnfytpk
-- ADDITIVE ONLY — pa touche done ki egziste
-- ============================================================

create or replace function public.create_receipt_from_student_payment()
returns trigger
language plpgsql
as $$
declare
  student_name text;
  v_account_id uuid;
  v_account_name text;
begin
  if new.amount_paid > 0 and (
    tg_op = 'INSERT'
    or old.amount_paid is distinct from new.amount_paid
    or old.category is distinct from new.category
  ) then
    select name into student_name from public.students where id = new.student_id;

    v_account_name := case new.category
      when 'enskripsyon' then 'Enskripsyon (Eskolarite)'
      when 'ekolaj' then 'Ekolaj'
      when 'egzamen' then 'Egzamen'
      when 'inifòm' then 'Inifòm'
      when 'kantin' then 'Kantin'
      when 'transpò' then 'Transpò eskolè'
      else 'Lòt frè eskolarite'
    end;

    select id into v_account_id
    from public.ledger_accounts
    where business_id = new.business_id and name = v_account_name and type = 'revenu'
    limit 1;

    if v_account_id is null then
      insert into public.ledger_accounts (business_id, name, type)
      values (new.business_id, v_account_name, 'revenu')
      returning id into v_account_id;
    end if;

    if not exists (select 1 from public.receipts where source = 'elev' and source_id = new.id) then
      insert into public.receipts (business_id, kind, reference, party, account_id, amount, receipt_date, source, source_id)
      values (
        new.business_id, 'vant', public.generate_receipt_reference(),
        student_name, v_account_id, new.amount_paid, coalesce(new.paid_at::date, current_date), 'elev', new.id
      );
    else
      update public.receipts set amount = new.amount_paid, account_id = v_account_id
      where source = 'elev' and source_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_receipt_from_student_payment on public.student_payments;
create trigger trg_receipt_from_student_payment after insert or update on public.student_payments
  for each row execute function public.create_receipt_from_student_payment();

-- Rakomode resi ki te deja kreye anvan fix la (yo te san kategori/account_id)
do $$
declare
  p record;
  v_account_id uuid;
  v_account_name text;
begin
  for p in select * from public.student_payments where amount_paid > 0 loop
    v_account_name := case p.category
      when 'enskripsyon' then 'Enskripsyon (Eskolarite)'
      when 'ekolaj' then 'Ekolaj'
      when 'egzamen' then 'Egzamen'
      when 'inifòm' then 'Inifòm'
      when 'kantin' then 'Kantin'
      when 'transpò' then 'Transpò eskolè'
      else 'Lòt frè eskolarite'
    end;

    select id into v_account_id from public.ledger_accounts
    where business_id = p.business_id and name = v_account_name and type = 'revenu'
    limit 1;

    if v_account_id is null then
      insert into public.ledger_accounts (business_id, name, type)
      values (p.business_id, v_account_name, 'revenu')
      returning id into v_account_id;
    end if;

    update public.receipts set account_id = v_account_id
    where source = 'elev' and source_id = p.id and account_id is null;
  end loop;
end $$;
