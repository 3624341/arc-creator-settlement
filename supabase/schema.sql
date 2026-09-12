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

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null,
  escrow_address text,
  applicant_wallet text not null check (applicant_wallet ~ '^0x[0-9a-fA-F]{40}$'),
  status text not null default 'Applied' check (status in ('Applied', 'Selected', 'Rejected', 'Completed')),
  profile_version integer check (profile_version is null or profile_version >= 1),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, applicant_wallet)
);

create table if not exists public.creator_profiles (
  wallet_address text primary key check (wallet_address ~ '^0x[0-9a-f]{40}$' and wallet_address = lower(wallet_address)),
  display_name text not null check (char_length(display_name) between 1 and 80),
  headline text check (headline is null or char_length(headline) <= 140),
  bio text not null check (char_length(bio) between 40 and 1000),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  languages text[] not null check (cardinality(languages) between 1 and 10),
  roles text[] not null check (cardinality(roles) between 1 and 9 and roles <@ array['Content Creator','Influencer','KOL','Developer','Community Manager','Designer','Video Creator','Translator','Event Host']::text[]),
  skills text[] not null default '{}' check (cardinality(skills) <= 20),
  preferred_campaigns text[] not null default '{}' check (cardinality(preferred_campaigns) <= 20),
  availability text not null default 'available' check (availability in ('available', 'limited', 'unavailable')),
  typical_turnaround_days integer check (typical_turnaround_days is null or typical_turnaround_days between 1 and 365),
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array' and jsonb_array_length(social_links) <= 10),
  portfolio_items jsonb not null default '[]'::jsonb check (jsonb_typeof(portfolio_items) = 'array' and jsonb_array_length(portfolio_items) <= 6),
  is_public boolean not null default true,
  profile_version integer not null default 1 check (profile_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists creator_profiles_public_idx on public.creator_profiles (is_public, updated_at desc);

create index if not exists job_applications_contract_idx on public.job_applications (contract_id, applied_at desc);
create index if not exists job_applications_applicant_idx on public.job_applications (applicant_wallet, applied_at desc);

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

alter table public.job_applications enable row level security;

grant select on table public.job_applications to anon, authenticated;
grant select, insert, update, delete on table public.job_applications to service_role;
revoke insert, update, delete on table public.job_applications from anon, authenticated;

alter table public.creator_profiles enable row level security;
grant select on table public.creator_profiles to anon, authenticated;
grant select, insert, update, delete on table public.creator_profiles to service_role;
revoke insert, update, delete on table public.creator_profiles from anon, authenticated;

drop policy if exists "Public can read public creator profiles" on public.creator_profiles;
create policy "Public can read public creator profiles"
on public.creator_profiles
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Public can read job applications" on public.job_applications;
create policy "Public can read job applications"
on public.job_applications
for select
to anon, authenticated
using (true);

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
