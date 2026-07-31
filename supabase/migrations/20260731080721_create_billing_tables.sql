create type public.billing_order_status as enum (
  'checkout_created',
  'completed',
  'refunded',
  'canceled',
  'failed'
);

create type public.entitlement_status as enum ('active', 'revoked');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null check (sku = 'middle-school-physics-foundations'),
  provider text not null default 'waffo' check (provider = 'waffo'),
  provider_product_id text not null,
  provider_session_id text unique,
  provider_order_id text unique,
  provider_payment_id text,
  currency text not null default 'USD' check (char_length(currency) = 3),
  amount numeric(12, 2) not null check (amount >= 0),
  status public.billing_order_status not null default 'checkout_created',
  buyer_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz,
  updated_at timestamptz not null default now()
);

create index orders_user_status_idx on public.orders (user_id, status);
create index orders_provider_order_idx on public.orders (provider_order_id);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null check (sku = 'middle-school-physics-foundations'),
  status public.entitlement_status not null default 'active',
  source_order_id uuid not null references public.orders (id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, sku)
);

create index entitlements_user_status_idx on public.entitlements (user_id, status);

create table public.billing_events (
  provider_event_id text primary key,
  provider text not null default 'waffo' check (provider = 'waffo'),
  event_type text not null,
  event_id text not null,
  mode text not null check (mode in ('test', 'prod')),
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create or replace function private.set_billing_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_orders_updated_at
before update on public.orders
for each row execute function private.set_billing_updated_at();

create trigger set_entitlements_updated_at
before update on public.entitlements
for each row execute function private.set_billing_updated_at();

alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.billing_events enable row level security;

revoke all on table public.orders, public.entitlements, public.billing_events from anon, authenticated;
grant select on table public.orders, public.entitlements to authenticated;

create policy "users can read their own orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read their own entitlements"
on public.entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke execute on function private.set_billing_updated_at() from public, anon, authenticated;

create or replace function public.process_waffo_event(
  p_event_id text,
  p_event_type text,
  p_business_event_id text,
  p_mode text,
  p_payload jsonb
)
returns table(processed boolean, internal_order_id uuid, entitlement_state text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted integer;
  v_external_order_id text;
  v_provider_order_id text;
  v_provider_payment_id text;
  v_identity text;
  v_internal_order_id uuid;
  v_user_id uuid;
  v_sku text;
  v_state text := null;
begin
  if p_event_id is null or p_event_id = '' then
    raise exception 'Waffo event ID is required';
  end if;

  insert into public.billing_events (provider_event_id, event_type, event_id, mode, payload)
  values (p_event_id, p_event_type, p_business_event_id, p_mode, p_payload)
  on conflict (provider_event_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return query select false, null::uuid, null::text;
    return;
  end if;

  v_external_order_id := nullif(p_payload #>> '{data,orderMerchantExternalId}', '');
  v_provider_order_id := nullif(p_payload #>> '{data,orderId}', '');
  v_provider_payment_id := nullif(p_payload #>> '{data,paymentId}', '');
  v_identity := nullif(p_payload #>> '{data,merchantProvidedBuyerIdentity}', '');

  if p_event_type = 'order.completed' then
    if v_external_order_id is null then
      raise exception 'Waffo order.completed is missing orderMerchantExternalId';
    end if;

    update public.orders
    set provider_order_id = coalesce(v_provider_order_id, provider_order_id),
        provider_payment_id = coalesce(v_provider_payment_id, provider_payment_id),
        status = 'completed',
        completed_at = coalesce(completed_at, now())
    where id::text = v_external_order_id
      and provider = 'waffo'
    returning id, user_id, sku into v_internal_order_id, v_user_id, v_sku;

    if v_internal_order_id is null then
      raise exception 'No matching pending order for Waffo external ID %', v_external_order_id;
    end if;

    if v_identity is not null and v_identity <> v_user_id::text then
      raise exception 'Waffo buyer identity does not match the pending order';
    end if;

    insert into public.entitlements (user_id, sku, status, source_order_id, granted_at, revoked_at)
    values (v_user_id, v_sku, 'active', v_internal_order_id, now(), null)
    on conflict (user_id, sku) do update
      set status = 'active', source_order_id = excluded.source_order_id,
          granted_at = coalesce(public.entitlements.granted_at, excluded.granted_at),
          revoked_at = null;
    v_state := 'active';
  elsif p_event_type = 'refund.succeeded' then
    if v_provider_order_id is null and v_external_order_id is null then
      raise exception 'Waffo refund.succeeded is missing order identifiers';
    end if;

    update public.orders
    set status = 'refunded', refunded_at = coalesce(refunded_at, now())
    where (v_provider_order_id is not null and provider_order_id = v_provider_order_id)
       or (v_external_order_id is not null and id::text = v_external_order_id)
    returning id, user_id, sku into v_internal_order_id, v_user_id, v_sku;

    if v_internal_order_id is null then
      raise exception 'No matching order for Waffo refund';
    end if;

    update public.entitlements
    set status = 'revoked', revoked_at = coalesce(revoked_at, now())
    where user_id = v_user_id and sku = v_sku;
    v_state := 'revoked';
  end if;

  return query select true, v_internal_order_id, v_state;
end;
$$;

revoke execute on function public.process_waffo_event(text, text, text, text, jsonb) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update, delete on table public.orders, public.entitlements, public.billing_events to service_role';
    execute 'grant execute on function public.process_waffo_event(text, text, text, text, jsonb) to service_role';
  end if;
end;
$$;
