-- supabase/migrations/013_canada_market_intel.sql
-- Canada Market Intelligence data infrastructure.
-- Tables: canada_provinces, canada_retail_chains, canada_distributors, province_intel
-- Enables pgvector for RAG embeddings on province_intel.

-- ══════════════════════════════════════════════════
-- STEP 1 — Enable pgvector
-- ══════════════════════════════════════════════════

create extension if not exists vector;

-- ══════════════════════════════════════════════════
-- STEP 2 — Core tables
-- ══════════════════════════════════════════════════

create table if not exists canada_provinces (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  population integer,
  gdp_billions numeric,
  consumer_profile jsonb,
  last_updated timestamptz default now()
);

create table if not exists canada_retail_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null,
  category text,
  province_codes text[],
  store_count integer,
  website text,
  notes text,
  last_updated timestamptz default now()
);

create table if not exists canada_distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model text not null,
  category_specialties text[],
  province_codes text[],
  website text,
  notes text,
  last_updated timestamptz default now()
);

create table if not exists province_intel (
  id uuid primary key default gen_random_uuid(),
  province_code text not null references canada_provinces(code),
  category text not null,
  market_size text,
  consumer_profile text,
  top_retail_chains jsonb,
  top_distributors jsonb,
  recommended_entry_channel text,
  competition_intensity text,
  regulatory_notes text,
  key_insights text,
  embedding vector(768),
  last_updated timestamptz default now(),
  unique(province_code, category)
);

-- RAG index on embedding column
create index if not exists province_intel_embedding_idx
  on province_intel
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Vector similarity search function
create or replace function search_province_intel(
  query_embedding vector(768),
  match_category text default null,
  match_count int default 4
)
returns table (
  id uuid,
  province_code text,
  category text,
  key_insights text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pi.id,
    pi.province_code,
    pi.category,
    pi.key_insights,
    1 - (pi.embedding <=> query_embedding) as similarity
  from province_intel pi
  where match_category is null or pi.category = match_category
  order by pi.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ══════════════════════════════════════════════════
-- STEP 3 — Seed provinces
-- ══════════════════════════════════════════════════

insert into canada_provinces (code, name, population, gdp_billions, consumer_profile) values
('NS', 'Nova Scotia', 1035542, 52.1, '{"key_demographics": "Aging population, strong rural-urban mix", "spending_habits": "Value-conscious, supports local producers", "trends": "Craft food, health-conscious, Atlantic pride brands"}'),
('ON', 'Ontario', 15606705, 1027.5, '{"key_demographics": "Diverse, urban-concentrated, high immigrant population", "spending_habits": "Premium willingness in GTA, ethnic food demand high", "trends": "Plant-based, ready-to-eat, ethnic fusion"}'),
('BC', 'British Columbia', 5441128, 377.5, '{"key_demographics": "Health-conscious, affluent urban centres", "spending_habits": "Premium natural/organic preference, outdoor lifestyle", "trends": "Organic, sustainable, plant-based, functional foods"}'),
('AB', 'Alberta', 4919619, 391.4, '{"key_demographics": "Young, growing population, high disposable income", "spending_habits": "Value + quality, large-portion culture", "trends": "Meat alternatives, functional snacks, local sourcing"}')
on conflict (code) do nothing;

-- ══════════════════════════════════════════════════
-- STEP 4 — Seed retail chains
-- ══════════════════════════════════════════════════

-- National grocery
insert into canada_retail_chains (name, tier, category, province_codes, store_count, website) values
('Loblaws', 'national', 'grocery', ARRAY['NS','ON','BC','AB'], 2300, 'https://www.loblaws.ca'),
('Sobeys', 'national', 'grocery', ARRAY['NS','ON','BC','AB'], 1600, 'https://www.sobeys.com'),
('Metro', 'national', 'grocery', ARRAY['ON','AB'], 950, 'https://www.metro.ca'),
('Costco Canada', 'national', 'club', ARRAY['NS','ON','BC','AB'], 108, 'https://www.costco.ca'),
('Walmart Canada', 'national', 'grocery', ARRAY['NS','ON','BC','AB'], 410, 'https://www.walmart.ca'),
('Bulk Barn', 'national', 'grocery', ARRAY['NS','ON','BC','AB'], 430, 'https://www.bulkbarn.ca');

-- Regional grocery
insert into canada_retail_chains (name, tier, category, province_codes, store_count, website) values
('Sobeys Atlantic', 'regional', 'grocery', ARRAY['NS'], 150, 'https://www.sobeys.com'),
('Overwaitea/Safeway BC', 'regional', 'grocery', ARRAY['BC'], 200, 'https://www.saveonfoods.com'),
('Farm Boy', 'regional', 'grocery', ARRAY['ON'], 30, 'https://www.farmboy.ca');

-- National pharmacy
insert into canada_retail_chains (name, tier, category, province_codes, store_count, website) values
('Shoppers Drug Mart', 'national', 'pharmacy', ARRAY['NS','ON','BC','AB'], 1300, 'https://www.shoppersdrugmart.ca'),
('Rexall', 'national', 'pharmacy', ARRAY['NS','ON','BC','AB'], 400, 'https://www.rexall.ca');

-- Health/Natural specialty
insert into canada_retail_chains (name, tier, category, province_codes, store_count, website) values
('Nature''s Fare Markets', 'regional', 'health_specialty', ARRAY['BC'], 15, 'https://www.naturesfare.com'),
('Choices Markets', 'regional', 'health_specialty', ARRAY['BC'], 12, 'https://www.choicesmarkets.com'),
('Goodness Me! Natural Food Market', 'regional', 'health_specialty', ARRAY['ON'], 1, 'https://www.goodnessme.ca'),
('Health Tree', 'regional', 'health_specialty', ARRAY['BC'], 3, 'https://www.healthtree.ca');

-- ══════════════════════════════════════════════════
-- STEP 5 — Seed distributors
-- ══════════════════════════════════════════════════

insert into canada_distributors (name, model, category_specialties, province_codes, website) values
('UNFI Canada', 'broker_distributor', ARRAY['organic','natural','health_specialty'], ARRAY['NS','ON','BC','AB'], 'https://www.unfi.com'),
('Tree of Life Canada', 'broker_distributor', ARRAY['organic','natural','fmcg'], ARRAY['ON','BC','AB'], 'https://www.treeoflife.ca'),
('Acosta Canada', 'broker_distributor', ARRAY['fmcg','health_wellness','specialty_food'], ARRAY['NS','ON','BC','AB'], 'https://www.acosta.ca'),
('Purity Life Health Products', 'direct_to_retail', ARRAY['health_wellness','supplements','natural'], ARRAY['ON','BC','AB'], 'https://www.puritylife.com'),
('Nature''s Path', 'direct_to_retail', ARRAY['organic','specialty_food'], ARRAY['ON','BC','AB'], 'https://www.naturespath.com'),
('Sysco Canada', 'direct_to_retail', ARRAY['fmcg','specialty_food'], ARRAY['NS','ON','BC','AB'], 'https://www.sysco.ca'),
('Gordon Food Service Canada', 'direct_to_retail', ARRAY['fmcg','specialty_food'], ARRAY['ON','BC','AB'], 'https://www.gfs.com'),
('Atlantic Organic', 'broker_distributor', ARRAY['organic','natural'], ARRAY['NS'], null);

-- ══════════════════════════════════════════════════
-- STEP 6 — RLS policies
-- ══════════════════════════════════════════════════

alter table canada_provinces enable row level security;
alter table canada_retail_chains enable row level security;
alter table canada_distributors enable row level security;
alter table province_intel enable row level security;

-- Read access for all authenticated users
create policy "Public read provinces" on canada_provinces for select using (true);
create policy "Public read retail chains" on canada_retail_chains for select using (true);
create policy "Public read distributors" on canada_distributors for select using (true);
create policy "Public read province intel" on province_intel for select using (true);

-- Write access (service role / platform)
create policy "Platform insert provinces" on canada_provinces for insert with check (true);
create policy "Platform update provinces" on canada_provinces for update using (true);
create policy "Platform insert retail chains" on canada_retail_chains for insert with check (true);
create policy "Platform update retail chains" on canada_retail_chains for update using (true);
create policy "Platform insert distributors" on canada_distributors for insert with check (true);
create policy "Platform update distributors" on canada_distributors for update using (true);
create policy "Platform insert province intel" on province_intel for insert with check (true);
create policy "Platform update province intel" on province_intel for update using (true);
