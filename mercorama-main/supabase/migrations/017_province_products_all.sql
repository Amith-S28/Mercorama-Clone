-- supabase/migrations/017_province_products_all.sql
-- Seed province_products for all 10 Canadian provinces.
-- NS already seeded in 012. All others added here.
-- HS6 codes sourced from Statistics Canada top exports by province (2023-2024).

INSERT INTO province_products (province_code, category, product_name, est_export_value_cad, hs6_codes)
VALUES

-- ── ONTARIO ────────────────────────────────────────────────────────────────────
('ON', 'Automotive',       'Motor Vehicle Parts',                  8000000000, ARRAY['870840','870829','870850','870891','870899']),
('ON', 'Automotive',       'Passenger Vehicles',                  12000000000, ARRAY['870323','870324','870332','870333']),
('ON', 'Machinery',        'Industrial Machinery & Equipment',     3500000000, ARRAY['847989','848180','841182','841391']),
('ON', 'Pharmaceuticals',  'Pharmaceutical Products',              2000000000, ARRAY['300490','300215','300439']),
('ON', 'Food & Beverage',  'Processed Food Products',              1500000000, ARRAY['190590','190120','190531','190532']),
('ON', 'Chemicals',        'Chemical Products',                    1800000000, ARRAY['390110','390120','390210','390230']),
('ON', 'Electronics',      'Electronic Components',                1200000000, ARRAY['854442','853710','853650','851762']),
('ON', 'Agriculture',      'Soybeans',                              900000000, ARRAY['120100','120190']),
('ON', 'Agriculture',      'Corn & Grain',                          700000000, ARRAY['100590','100700','100199']),
('ON', 'Metals',           'Nickel & Alloys',                       600000000, ARRAY['750210','750220','750600']),

-- ── BRITISH COLUMBIA ───────────────────────────────────────────────────────────
('BC', 'Forestry',         'Softwood Lumber',                      4500000000, ARRAY['440710','440791','440799']),
('BC', 'Forestry',         'Wood Pulp',                            2000000000, ARRAY['470321','470329','470500']),
('BC', 'Mining',           'Copper Ore & Concentrates',            3000000000, ARRAY['260300','741999']),
('BC', 'Mining',           'Coal',                                 4000000000, ARRAY['270112','270119']),
('BC', 'Seafood',          'Pacific Salmon',                        600000000, ARRAY['030211','030213','030311','030319']),
('BC', 'Seafood',          'Herring & Groundfish',                  300000000, ARRAY['030224','030369','030389']),
('BC', 'Agriculture',      'Blueberries & Berries',                 400000000, ARRAY['081040','081060','200899']),
('BC', 'Agriculture',      'Canola',                                500000000, ARRAY['120510','120590','151419']),
('BC', 'Technology',       'Software & IT Services',               2500000000, ARRAY['850450','854370','847160']),
('BC', 'Chemicals',        'Potash & Industrial Chemicals',         800000000, ARRAY['310420','310230','282736']),

-- ── ALBERTA ────────────────────────────────────────────────────────────────────
('AB', 'Energy',           'Crude Oil',                           55000000000, ARRAY['270900']),
('AB', 'Energy',           'Natural Gas',                         10000000000, ARRAY['271121','271119']),
('AB', 'Energy',           'Refined Petroleum Products',           8000000000, ARRAY['271012','271019','271600']),
('AB', 'Agriculture',      'Wheat',                                2500000000, ARRAY['100199','100119','100111']),
('AB', 'Agriculture',      'Canola',                               5000000000, ARRAY['120510','120590','151419']),
('AB', 'Agriculture',      'Beef & Beef Products',                 4000000000, ARRAY['020110','020120','020130','020220','020230']),
('AB', 'Agriculture',      'Pork Products',                        1200000000, ARRAY['020311','020312','020319','020321']),
('AB', 'Petrochemicals',   'Fertilizers & Chemicals',              2000000000, ARRAY['310210','310420','310520','281410']),
('AB', 'Forestry',         'Lumber & Wood Products',               1000000000, ARRAY['440710','440791','440311']),
('AB', 'Mining',           'Coal & Bituminous Products',           1500000000, ARRAY['270112','271311','271391']),

-- ── QUEBEC ─────────────────────────────────────────────────────────────────────
('QC', 'Aerospace',        'Aircraft & Parts',                     8000000000, ARRAY['880240','880230','880330','880390']),
('QC', 'Metals',           'Aluminum & Alloys',                    5000000000, ARRAY['760110','760120','760410','760429']),
('QC', 'Pharmaceuticals',  'Pharmaceutical Products',              2500000000, ARRAY['300490','300215','300220']),
('QC', 'Forestry',         'Newsprint & Paper',                    1800000000, ARRAY['480100','480255','480256']),
('QC', 'Forestry',         'Softwood Lumber',                      2000000000, ARRAY['440710','440791','440311']),
('QC', 'Food & Beverage',  'Maple Syrup & Products',                600000000, ARRAY['170290','210690']),
('QC', 'Mining',           'Iron Ore & Concentrates',              2500000000, ARRAY['260111','260120']),
('QC', 'Electronics',      'Electronic Equipment',                 1500000000, ARRAY['854442','853710','850440']),
('QC', 'Chemicals',        'Industrial Chemicals',                 1200000000, ARRAY['390720','281410','284420']),
('QC', 'Machinery',        'Industrial Machinery',                  900000000, ARRAY['843143','842952','847989']),

-- ── SASKATCHEWAN ──────────────────────────────────────────────────────────────
('SK', 'Agriculture',      'Potash',                               5000000000, ARRAY['310420','310230','282736']),
('SK', 'Agriculture',      'Wheat',                                4000000000, ARRAY['100199','100119','100111']),
('SK', 'Agriculture',      'Canola',                               3500000000, ARRAY['120510','120590','151419']),
('SK', 'Agriculture',      'Lentils & Pulses',                     2000000000, ARRAY['071340','071350','071360']),
('SK', 'Agriculture',      'Peas',                                 1500000000, ARRAY['071310','071390']),
('SK', 'Energy',           'Crude Oil',                            5000000000, ARRAY['270900']),
('SK', 'Mining',           'Uranium',                              1200000000, ARRAY['261210','284420']),
('SK', 'Agriculture',      'Barley & Oats',                         600000000, ARRAY['100300','100401']),
('SK', 'Agriculture',      'Mustard Seed',                          300000000, ARRAY['120910','120999']),
('SK', 'Agriculture',      'Beef & Livestock',                     1000000000, ARRAY['020110','020120','020230']),

-- ── MANITOBA ───────────────────────────────────────────────────────────────────
('MB', 'Agriculture',      'Wheat & Grain',                        1500000000, ARRAY['100199','100119','100590']),
('MB', 'Agriculture',      'Canola',                               1200000000, ARRAY['120510','151419','151411']),
('MB', 'Agriculture',      'Pork Products',                        1500000000, ARRAY['020311','020312','020321','021011']),
('MB', 'Agriculture',      'Sunflower Seeds & Oils',                400000000, ARRAY['120600','151211','151219']),
('MB', 'Manufactured',     'Bus & Motor Coaches',                   800000000, ARRAY['870210','870290']),
('MB', 'Mining',           'Nickel & Copper',                       500000000, ARRAY['750210','740200','740311']),
('MB', 'Food & Beverage',  'Processed Meat & Food',                 700000000, ARRAY['160100','160210','190590']),
('MB', 'Agriculture',      'Flaxseed',                              200000000, ARRAY['120400']),
('MB', 'Agriculture',      'Soybeans',                              400000000, ARRAY['120100','120190']),
('MB', 'Hydro',            'Electric Power Equipment',              300000000, ARRAY['850164','850423','850490']),

-- ── NEW BRUNSWICK ──────────────────────────────────────────────────────────────
('NB', 'Forestry',         'Softwood Lumber & Pulp',               1500000000, ARRAY['440710','470321','480100']),
('NB', 'Seafood',          'Lobster – Live & Processed',           1200000000, ARRAY['030622','030612','160510']),
('NB', 'Seafood',          'Snow Crab & Shrimp',                    400000000, ARRAY['030614','030617']),
('NB', 'Energy',           'Refined Petroleum',                     800000000, ARRAY['271012','271019']),
('NB', 'Agriculture',      'Potatoes & Potato Products',            500000000, ARRAY['070110','200411','110813']),
('NB', 'Food & Beverage',  'Blueberries & Fruit',                   200000000, ARRAY['081040','081060','200899']),
('NB', 'Mining',           'Zinc & Lead',                           400000000, ARRAY['790111','780110','260800']),
('NB', 'Manufactured',     'Manufactured Products',                 300000000, ARRAY['847989','848180','848390']),

-- ── NEWFOUNDLAND & LABRADOR ────────────────────────────────────────────────────
('NL', 'Energy',           'Crude Oil (Offshore)',                  5000000000, ARRAY['270900']),
('NL', 'Mining',           'Iron Ore',                             2500000000, ARRAY['260111','260112']),
('NL', 'Seafood',          'Shrimp & Cold-Water Prawns',            600000000, ARRAY['030617','030616','160520']),
('NL', 'Seafood',          'Snow Crab',                             800000000, ARRAY['030614','160510']),
('NL', 'Seafood',          'Groundfish & Cod',                      300000000, ARRAY['030369','030389','030410']),
('NL', 'Seafood',          'Capelin & Pelagic Fish',                200000000, ARRAY['030389','030290']),
('NL', 'Forestry',         'Newsprint',                             400000000, ARRAY['480100','480255']),
('NL', 'Minerals',         'Nickel & Copper',                       500000000, ARRAY['750210','740200']),

-- ── PRINCE EDWARD ISLAND ───────────────────────────────────────────────────────
('PE', 'Agriculture',      'Potatoes & Seed Potatoes',              500000000, ARRAY['070110','070190','200411','110813']),
('PE', 'Seafood',          'Lobster – Live',                        300000000, ARRAY['030622','030612']),
('PE', 'Seafood',          'Mussels & Oysters',                     100000000, ARRAY['030722','030714']),
('PE', 'Agriculture',      'Grain & Cereals',                       100000000, ARRAY['100199','100590']),
('PE', 'Food & Beverage',  'Processed Potato Products',             200000000, ARRAY['200411','110813','190520']),

-- ── NOVA SCOTIA (supplement — additional categories beyond 012 seed) ────────────
('NS', 'Forestry',         'Softwood Lumber & Pulp',                300000000, ARRAY['440710','470321']),
('NS', 'Agriculture',      'Apples & Tree Fruit',                    50000000, ARRAY['080810','080830']),
('NS', 'Manufacturing',    'Automotive Parts & Rubber',             200000000, ARRAY['401110','401120','870840'])

ON CONFLICT DO NOTHING;
