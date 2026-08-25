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
