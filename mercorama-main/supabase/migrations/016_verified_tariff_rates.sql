-- Migration 016: verified_tariff_rates
-- Persistent store for MFN and preferential tariff rates.
-- Replaces the static lib/tariff-rates.ts file over time as rates are verified.
-- Admin panel can manually correct/verify rates; USITC cron auto-populates US rates.

create table if not exists verified_tariff_rates (
  id             uuid primary key default gen_random_uuid(),

  hs_code        char(6)      not null,   -- 6-digit WCO HS code, no dots
  country_iso2   varchar(2)   not null,   -- ISO 3166-1 alpha-2 (US, CN, EU, etc.)

  mfn_rate       varchar(50)  not null,   -- e.g. "6.5%", "€95/tonne", "0%"
  preferential_rate varchar(50),          -- e.g. "0% (CETA)", null if no FTA
  fta_name       varchar(50),             -- e.g. "CETA", "CUSMA", "CPTPP"

  source         varchar(100) not null,   -- e.g. "USITC HTS 2024", "EU TARIC 2024"
  verified        boolean      not null default false,
  notes          text,                    -- CVD/AD warnings, TRQ details, etc.

  verified_date  date         not null default current_date,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),

  -- One rate per hs_code × country
  constraint verified_tariff_rates_uq unique (hs_code, country_iso2)
);

-- Index for the primary lookup pattern: hsCode + country
create index if not exists idx_vtr_hs_country
  on verified_tariff_rates (hs_code, country_iso2);

-- Index for admin panel filtering by country or HS chapter
create index if not exists idx_vtr_country
  on verified_tariff_rates (country_iso2);

create index if not exists idx_vtr_hs_chapter
  on verified_tariff_rates (left(hs_code, 2));

-- Auto-update updated_at
create or replace function update_verified_tariff_rates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vtr_updated_at
  before update on verified_tariff_rates
  for each row execute function update_verified_tariff_rates_updated_at();

-- RLS: public read (tariff rates are public data), service role for writes
alter table verified_tariff_rates enable row level security;

create policy "public_read_tariff_rates"
  on verified_tariff_rates for select
  using (true);

create policy "service_write_tariff_rates"
  on verified_tariff_rates for all
  using (auth.role() = 'service_role');

-- Admin changelog entry
insert into admin_changelog (entry_type, title, description)
values (
  'rate_update',
  'Migration 016',
  'Created verified_tariff_rates table for persistent, admin-editable tariff rate storage'
);
