create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_wallet text not null,
  creator_wallet text not null,
  escrow_address text,
  total_amount_usdc numeric not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_index int not null,
  description text not null,
  amount_usdc numeric not null,
  status text not null default 'pending',
  submitted_tx text,
  released_tx text,
  created_at timestamptz not null default now()
);

create table if not exists public.settlement_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  escrow_address text not null,
  tx_hash text not null,
  event_name text not null,
  amount_usdc numeric,
  actor_wallet text,
  created_at timestamptz not null default now()
);

create table if not exists public.settlement_receipts (
  tx_hash text primary key check (tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  status text not null default 'confirmed' check (status = 'confirmed'),
  chain_id integer not null,
  block_number numeric(78, 0) not null,
  confirmed_at timestamptz not null,
  escrow_address text not null,
  client_address text not null,
  creator_address text not null,
  milestone_index integer not null check (milestone_index >= 0),
  milestone_description text not null,
  amount_usdc numeric not null check (amount_usdc >= 0),
  project_title text not null,
  explorer_url text not null,
  created_at timestamptz not null default now()
);

alter table public.settlement_receipts enable row level security;

grant select on table public.settlement_receipts to anon, authenticated;
grant select, insert, update, delete on table public.settlement_receipts to service_role;
revoke insert, update, delete on table public.settlement_receipts from anon, authenticated;

drop policy if exists "Public can read confirmed settlement receipts" on public.settlement_receipts;
create policy "Public can read confirmed settlement receipts"
on public.settlement_receipts
for select
to anon, authenticated
using (status = 'confirmed');
