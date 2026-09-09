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

alter table public.job_applications add column if not exists profile_version integer;
alter table public.job_applications drop constraint if exists job_applications_profile_version_check;
alter table public.job_applications add constraint job_applications_profile_version_check check (profile_version is null or profile_version >= 1);

create index if not exists creator_profiles_public_idx on public.creator_profiles (is_public, updated_at desc);
create index if not exists job_applications_profile_version_idx on public.job_applications (contract_id, profile_version);

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
