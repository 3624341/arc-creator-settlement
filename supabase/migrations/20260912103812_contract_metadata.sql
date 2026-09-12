create table if not exists public.contract_metadata (
  escrow_address text primary key check (
    escrow_address ~ '^0x[0-9a-f]{40}$'
    and escrow_address = lower(escrow_address)
  ),
  advertiser_wallet text not null check (
    advertiser_wallet ~ '^0x[0-9a-f]{40}$'
    and advertiser_wallet = lower(advertiser_wallet)
  ),
  description text not null check (
    description = btrim(description)
    and char_length(description) between 20 and 2000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contract_metadata enable row level security;

revoke all on table public.contract_metadata from anon, authenticated;
grant select on table public.contract_metadata to anon, authenticated;
grant select, insert, update, delete on table public.contract_metadata to service_role;

drop policy if exists "Public can read contract metadata" on public.contract_metadata;
create policy "Public can read contract metadata"
on public.contract_metadata
for select
to anon, authenticated
using (true);
