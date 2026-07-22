-- supabase/migrations/014_province_intel_seed.sql
-- Seed province intelligence for 4 provinces (specialty_food category).

insert into province_intel (province_code, category, market_size, consumer_profile,
  top_retail_chains, top_distributors, recommended_entry_channel,
  competition_intensity, regulatory_notes, key_insights) values
('NS', 'specialty_food',
  'Small but concentrated market. Estimated CAD $120M specialty food retail annually.',
  '{"key_demographics": "Aging population, strong local food loyalty", "spending_habits": "Supports Atlantic producers, value-conscious", "trends": "Craft food, artisan, seafood-forward products"}',
  '[{"name":"Sobeys Atlantic","tier":"regional","fit":"Primary grocery entry point"},{"name":"Loblaws/Atlantic Superstore","tier":"national","fit":"Scale + local program"},{"name":"Farmers Markets (Halifax Seaside)","tier":"direct","fit":"Brand awareness"}]',
  '[{"name":"Acosta Canada","model":"broker_distributor","fit":"National reach from Atlantic base"},{"name":"Atlantic Organic","model":"broker_distributor","fit":"Organic/natural channel"}]',
  'Broker-led entry through Sobeys Atlantic first, then expand to Loblaws Atlantic. Farmers markets in Halifax for brand awareness before retail.',
  'Low to medium. Fewer specialty food SKUs than ON/BC. Local brands dominate.',
  'Nova Scotia Food & Beverage Program offers grants for local producers. CFIA registration required for interprovincial shipping.',
  'Nova Scotia offers the lowest competitive density of any Canadian province for specialty food brands. Sobeys Atlantic head office in Stellarton, NS makes local relationship building critical. Entry cost is low but scale is limited. Best used as a brand launch market before scaling to ON/BC.')
on conflict (province_code, category) do update set
  market_size = excluded.market_size,
  consumer_profile = excluded.consumer_profile,
  top_retail_chains = excluded.top_retail_chains,
  top_distributors = excluded.top_distributors,
  recommended_entry_channel = excluded.recommended_entry_channel,
  competition_intensity = excluded.competition_intensity,
  regulatory_notes = excluded.regulatory_notes,
  key_insights = excluded.key_insights,
  last_updated = now();

insert into province_intel (province_code, category, market_size, consumer_profile,
  top_retail_chains, top_distributors, recommended_entry_channel,
  competition_intensity, regulatory_notes, key_insights) values
('ON', 'specialty_food',
  'Canada largest market. Estimated CAD $2.1B specialty food retail annually.',
  '{"key_demographics": "Highly diverse, 50%+ immigrant population in GTA", "spending_habits": "Premium willingness in GTA, ethnic food demand high", "trends": "Plant-based, ethnic fusion, ready-to-eat, health-forward"}',
  '[{"name":"Loblaws","tier":"national","fit":"Largest national grocery chain"},{"name":"Metro","tier":"national","fit":"Strong in GTA, local supplier program"},{"name":"Farm Boy","tier":"regional","fit":"Premium natural positioning"},{"name":"Goodness Me","tier":"regional","fit":"Health specialty, Toronto only"}]',
  '[{"name":"UNFI Canada","model":"broker_distributor","fit":"Largest natural foods distributor"},{"name":"Tree of Life Canada","model":"broker_distributor","fit":"Organic/natural focus"},{"name":"Acosta Canada","model":"broker_distributor","fit":"Mass market grocery access"}]',
  'Start with a broker-distributor (UNFI or Tree of Life) to access natural/health channel. Mass market grocery (Loblaws/Metro) requires slotting fees and significant marketing investment.',
  'Very high. Most Canadian specialty food brands are based in or target Ontario first. Slotting fees range CAD $2,000-$10,000 per SKU per store.',
  'Ontario Ministry of Agriculture offers Food Innovation Program grants. CFIA registration mandatory. Provincial food safety audit required.',
  'Ontario is the must-win market for any specialty food brand in Canada. The market is large enough to sustain a brand on its own but is also the most competitive. Broker relationships are critical. Budget CAD $50K-$150K for market entry including slotting fees and trade marketing.')
on conflict (province_code, category) do update set
  market_size = excluded.market_size, consumer_profile = excluded.consumer_profile,
  top_retail_chains = excluded.top_retail_chains, top_distributors = excluded.top_distributors,
  recommended_entry_channel = excluded.recommended_entry_channel,
  competition_intensity = excluded.competition_intensity,
  regulatory_notes = excluded.regulatory_notes, key_insights = excluded.key_insights,
  last_updated = now();

insert into province_intel (province_code, category, market_size, consumer_profile,
  top_retail_chains, top_distributors, recommended_entry_channel,
  competition_intensity, regulatory_notes, key_insights) values
('BC', 'specialty_food',
  'Premium market. Estimated CAD $580M specialty food retail annually.',
  '{"key_demographics": "Affluent, health-conscious, high Asian population in Lower Mainland", "spending_habits": "Highest organic spend per capita in Canada", "trends": "Organic, sustainable, plant-based, functional foods, Asian fusion"}',
  '[{"name":"Choices Markets","tier":"regional","fit":"Premium health specialty"},{"name":"Natures Fare Markets","tier":"regional","fit":"Health specialty, 15 stores"},{"name":"Save-On-Foods","tier":"regional","fit":"Largest regional grocery"},{"name":"Loblaws","tier":"national","fit":"National grocery presence"}]',
  '[{"name":"UNFI Canada","model":"broker_distributor","fit":"BC headquarters in Vancouver"},{"name":"Tree of Life Canada","model":"broker_distributor","fit":"West Coast coverage"},{"name":"Purity Life","model":"direct_to_retail","fit":"Health specialty channel"}]',
  'Enter through health specialty channel first (Choices, Natures Fare) to build brand credibility. BC consumers value sustainability and local sourcing.',
  'Medium to high. Strong local brand loyalty. Organic certification is a significant advantage.',
  'BC Ministry of Agriculture offers Growing Forward 2 grants. Organic certification (BC organic logo) strongly recommended.',
  'British Columbia is Canada premium specialty food market. Consumers pay premium prices for certified organic and sustainably sourced products. The health specialty channel is strong and accessible. Entry through a Vancouver-based broker like UNFI BC provides the fastest path to market.')
on conflict (province_code, category) do update set
  market_size = excluded.market_size, consumer_profile = excluded.consumer_profile,
  top_retail_chains = excluded.top_retail_chains, top_distributors = excluded.top_distributors,
  recommended_entry_channel = excluded.recommended_entry_channel,
  competition_intensity = excluded.competition_intensity,
  regulatory_notes = excluded.regulatory_notes, key_insights = excluded.key_insights,
  last_updated = now();

insert into province_intel (province_code, category, market_size, consumer_profile,
  top_retail_chains, top_distributors, recommended_entry_channel,
  competition_intensity, regulatory_notes, key_insights) values
('AB', 'specialty_food',
  'Growing market. Estimated CAD $340M specialty food retail annually.',
  '{"key_demographics": "Youngest population in Canada, high disposable income", "spending_habits": "Value + quality, large-portion culture, protein-forward", "trends": "Meat alternatives, functional snacks, local sourcing, craft beer culture"}',
  '[{"name":"Sobeys","tier":"national","fit":"Strong Alberta presence"},{"name":"Loblaws","tier":"national","fit":"National grocery coverage"},{"name":"Costco Canada","tier":"national","fit":"Strong warehouse club presence"}]',
  '[{"name":"UNFI Canada","model":"broker_distributor","fit":"Calgary distribution centre"},{"name":"Tree of Life Canada","model":"broker_distributor","fit":"Western Canada coverage"},{"name":"Acosta Canada","model":"broker_distributor","fit":"Mass market access"}]',
  'Broker-led entry through Sobeys Alberta first. Costco is a strong channel for value-pack specialty food products. Alberta consumers respond well to protein-forward messaging.',
  'Medium. Lower competitive density than ON/BC but fewer specialty food retail outlets.',
  'Alberta Agriculture offers Diversification Program grants for value-added food products. CFIA registration required.',
  'Alberta is an attractive secondary market for specialty food brands. Lower entry costs than Ontario with solid growth. The young population and high disposable income make it ideal for functional and protein products. Consider a Calgary broker for market entry.')
on conflict (province_code, category) do update set
  market_size = excluded.market_size, consumer_profile = excluded.consumer_profile,
  top_retail_chains = excluded.top_retail_chains, top_distributors = excluded.top_distributors,
  recommended_entry_channel = excluded.recommended_entry_channel,
  competition_intensity = excluded.competition_intensity,
  regulatory_notes = excluded.regulatory_notes, key_insights = excluded.key_insights,
  last_updated = now();
