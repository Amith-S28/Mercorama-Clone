/**
 * WITS & ITC Data Scraper
 * 
 * Downloads trade datasets from:
 * 1. GitHub (datasets/harmonized-system) - HS code classifications
 * 2. World Bank Open Data API (free, no key) - Country trade indicators
 * 
 * The WITS bulk download ZIPs have been retired from their server,
 * so we use the World Bank Indicators API v2 instead, which returns
 * the same underlying data (sourced from UN COMTRADE / World Bank WDI).
 * 
 * Outputs organized CSV files to src/data/
 * 
 * Usage: node scripts/scrape_wits_and_itc.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── URLs ───────────────────────────────────────────────────────────────────
const HS_CODES_URL = 'https://raw.githubusercontent.com/datasets/harmonized-system/master/data/harmonized-system.csv';

// World Bank Indicators API v2 (free, no key required)
const WB_API_BASE = 'https://api.worldbank.org/v2';

// Countries to download data for
const COUNTRIES = ['JPN', 'USA', 'DEU', 'GBR', 'BRA', 'IND', 'ZAF', 'CAN', 'CHN', 'KOR', 'MEX', 'VNM', 'THA', 'IDN', 'AUS', 'FRA', 'ITA', 'NLD', 'SGP', 'MYS'];
const YEAR_RANGE = '2015:2024';

// Indicators to download
const INDICATORS = {
  // Trade
  'NE.IMP.GNFS.CD': 'Imports of goods and services (current US$)',
  'NE.EXP.GNFS.CD': 'Exports of goods and services (current US$)',
  'TM.VAL.MRCH.CD.WT': 'Merchandise imports (current US$)',
  'TX.VAL.MRCH.CD.WT': 'Merchandise exports (current US$)',
  'NE.TRD.GNFS.ZS': 'Trade (% of GDP)',
  // Tariffs  
  'TM.TAX.MRCH.WM.AR.ZS': 'Tariff rate, applied, weighted mean, all products (%)',
  'TM.TAX.MRCH.SM.AR.ZS': 'Tariff rate, applied, simple mean, all products (%)',
  'TM.TAX.MANF.WM.AR.ZS': 'Tariff rate, applied, weighted mean, manufactured products (%)',
  'TM.TAX.TCOM.WM.AR.ZS': 'Tariff rate, applied, weighted mean, primary products (%)',
  // GDP
  'NY.GDP.MKTP.CD': 'GDP (current US$)',
  'NY.GDP.PCAP.CD': 'GDP per capita (current US$)',
  'NY.GNP.MKTP.CD': 'GNI (current US$)',
  // Trade balance & structure
  'BN.GSR.GNFS.CD': 'Net trade in goods and services (current US$)',
  'TM.VAL.FOOD.ZS.UN': 'Food imports (% of merchandise imports)',
  'TM.VAL.FUEL.ZS.UN': 'Fuel imports (% of merchandise imports)',
  'TM.VAL.MANF.ZS.UN': 'Manufactures imports (% of merchandise imports)',
  'TX.VAL.FOOD.ZS.UN': 'Food exports (% of merchandise exports)',
  'TX.VAL.FUEL.ZS.UN': 'Fuel exports (% of merchandise exports)',
  'TX.VAL.MANF.ZS.UN': 'Manufactures exports (% of merchandise exports)',
  // Market concentration
  'TM.VAL.MRCH.HI.ZS': 'Import concentration index (Herfindahl-Hirschman)',
  'TX.VAL.MRCH.HI.ZS': 'Export concentration index (Herfindahl-Hirschman)',
  // Exchange rate
  'PA.NUS.FCRF': 'Official exchange rate (LCU per US$, period average)',
  // Population
  'SP.POP.TOTL': 'Population, total',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function downloadText(url) {
  return new Promise((resolve, reject) => {
    console.log(`  GET: ${url.substring(0, 120)}...`);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadText(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

// ─── Step 1: HS Codes ──────────────────────────────────────────────────────

async function downloadHSCodes() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 1: Downloading HS Code Classifications');
  console.log('══════════════════════════════════════════════════════');

  const raw = await downloadText(HS_CODES_URL);
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

  // Parse and filter to 4-digit headings only
  const outputLines = ['code,description,section,parent'];
  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 5) continue;
    const [section, hscode, description, parent, level] = fields;
    if (level === '4') {
      outputLines.push(`${hscode},"${description.replace(/"/g, '""')}",${section},${parent}`);
      count++;
    }
  }

  const outPath = path.join(DATA_DIR, 'hs_codes.csv');
  fs.writeFileSync(outPath, outputLines.join('\n'), 'utf-8');
  console.log(`  ✓ Wrote ${count} 4-digit HS headings to hs_codes.csv`);

  // Also write the full classification (2, 4, 6 digit) as a reference file
  const fullOutputLines = ['code,description,section,parent,level'];
  let fullCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 5) continue;
    const [section, hscode, description, parent, level] = fields;
    fullOutputLines.push(`${hscode},"${description.replace(/"/g, '""')}",${section},${parent},${level}`);
    fullCount++;
  }
  const fullOutPath = path.join(DATA_DIR, 'hs_codes_full.csv');
  fs.writeFileSync(fullOutPath, fullOutputLines.join('\n'), 'utf-8');
  console.log(`  ✓ Wrote ${fullCount} total HS codes (all levels) to hs_codes_full.csv`);
}

// ─── Step 2: World Bank Country Indicators ─────────────────────────────────

async function downloadWorldBankIndicators() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 2: Downloading World Bank Country Indicators');
  console.log('══════════════════════════════════════════════════════');

  const countryCodes = COUNTRIES.join(';');
  const allRows = [];
  const indicatorEntries = Object.entries(INDICATORS);

  for (let idx = 0; idx < indicatorEntries.length; idx++) {
    const [indicatorCode, indicatorName] = indicatorEntries[idx];
    console.log(`  [${idx + 1}/${indicatorEntries.length}] Fetching: ${indicatorName}`);

    try {
      const url = `${WB_API_BASE}/country/${countryCodes}/indicator/${indicatorCode}?format=json&date=${YEAR_RANGE}&per_page=500`;
      const text = await downloadText(url);
      const json = JSON.parse(text);

      if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
        console.log(`    ⚠ No data returned for ${indicatorCode}`);
        continue;
      }

      const records = json[1];
      let recordCount = 0;

      for (const record of records) {
        if (record.value !== null && record.value !== undefined) {
          allRows.push({
            country_iso3: record.countryiso3code,
            country_name: record.country.value,
            year: record.date,
            indicator_code: indicatorCode,
            indicator_name: indicatorName,
            value: record.value,
          });
          recordCount++;
        }
      }

      // Check if there are more pages
      const metadata = json[0];
      if (metadata.pages > 1) {
        for (let page = 2; page <= metadata.pages; page++) {
          const pageUrl = `${WB_API_BASE}/country/${countryCodes}/indicator/${indicatorCode}?format=json&date=${YEAR_RANGE}&per_page=500&page=${page}`;
          const pageText = await downloadText(pageUrl);
          const pageJson = JSON.parse(pageText);
          if (Array.isArray(pageJson) && pageJson.length >= 2 && Array.isArray(pageJson[1])) {
            for (const record of pageJson[1]) {
              if (record.value !== null && record.value !== undefined) {
                allRows.push({
                  country_iso3: record.countryiso3code,
                  country_name: record.country.value,
                  year: record.date,
                  indicator_code: indicatorCode,
                  indicator_name: indicatorName,
                  value: record.value,
                });
                recordCount++;
              }
            }
          }
          await sleep(300);
        }
      }

      console.log(`    ✓ ${recordCount} records`);
    } catch (err) {
      console.log(`    ✗ Error: ${err.message}`);
    }

    // Rate limit: be polite to the API
    await sleep(500);
  }

  // Write the combined indicators CSV
  const header = 'country_iso3,country_name,year,indicator_code,indicator_name,value';
  const csvLines = [header];
  for (const row of allRows) {
    csvLines.push(`${row.country_iso3},"${row.country_name}",${row.year},${row.indicator_code},"${row.indicator_name}",${row.value}`);
  }

  const outPath = path.join(DATA_DIR, 'wits_country_indicators.csv');
  fs.writeFileSync(outPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n  ✓ Wrote ${allRows.length} total indicator records to wits_country_indicators.csv`);
}

// ─── Step 3: Generate Country Summaries CSV ────────────────────────────────

async function generateCountrySummaries() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  STEP 3: Generating Country Summaries');
  console.log('══════════════════════════════════════════════════════');

  const indicatorsPath = path.join(DATA_DIR, 'wits_country_indicators.csv');
  if (!fs.existsSync(indicatorsPath)) {
    console.log('  ⚠ wits_country_indicators.csv not found, skipping');
    return;
  }

  const raw = fs.readFileSync(indicatorsPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

  // Parse into records
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 6) continue;
    records.push({
      country_iso3: fields[0],
      country_name: fields[1],
      year: parseInt(fields[2]),
      indicator_code: fields[3],
      indicator_name: fields[4],
      value: parseFloat(fields[5]),
    });
  }

  // Group by country + year
  const grouped = {};
  for (const r of records) {
    const key = `${r.country_iso3}:${r.year}`;
    if (!grouped[key]) {
      grouped[key] = { country_iso3: r.country_iso3, country_name: r.country_name, year: r.year };
    }
    grouped[key][r.indicator_code] = r.value;
  }

  // Write pivoted summary CSV
  const summaryHeader = [
    'country_iso3', 'country_name', 'year',
    'gdp_usd', 'gdp_per_capita_usd', 'gni_usd', 'population',
    'total_imports_usd', 'total_exports_usd', 'merchandise_imports_usd', 'merchandise_exports_usd',
    'trade_pct_gdp', 'trade_balance_usd',
    'tariff_weighted_all', 'tariff_simple_all', 'tariff_weighted_manuf', 'tariff_weighted_primary',
    'food_imports_pct', 'fuel_imports_pct', 'manuf_imports_pct',
    'food_exports_pct', 'fuel_exports_pct', 'manuf_exports_pct',
    'import_concentration_hhi', 'export_concentration_hhi',
    'exchange_rate_lcu_per_usd',
  ].join(',');

  const summaryLines = [summaryHeader];
  const sortedKeys = Object.keys(grouped).sort();

  for (const key of sortedKeys) {
    const g = grouped[key];
    summaryLines.push([
      g.country_iso3,
      `"${g.country_name}"`,
      g.year,
      g['NY.GDP.MKTP.CD'] ?? '',
      g['NY.GDP.PCAP.CD'] ?? '',
      g['NY.GNP.MKTP.CD'] ?? '',
      g['SP.POP.TOTL'] ?? '',
      g['NE.IMP.GNFS.CD'] ?? '',
      g['NE.EXP.GNFS.CD'] ?? '',
      g['TM.VAL.MRCH.CD.WT'] ?? '',
      g['TX.VAL.MRCH.CD.WT'] ?? '',
      g['NE.TRD.GNFS.ZS'] ?? '',
      g['BN.GSR.GNFS.CD'] ?? '',
      g['TM.TAX.MRCH.WM.AR.ZS'] ?? '',
      g['TM.TAX.MRCH.SM.AR.ZS'] ?? '',
      g['TM.TAX.MANF.WM.AR.ZS'] ?? '',
      g['TM.TAX.TCOM.WM.AR.ZS'] ?? '',
      g['TM.VAL.FOOD.ZS.UN'] ?? '',
      g['TM.VAL.FUEL.ZS.UN'] ?? '',
      g['TM.VAL.MANF.ZS.UN'] ?? '',
      g['TX.VAL.FOOD.ZS.UN'] ?? '',
      g['TX.VAL.FUEL.ZS.UN'] ?? '',
      g['TX.VAL.MANF.ZS.UN'] ?? '',
      g['TM.VAL.MRCH.HI.ZS'] ?? '',
      g['TX.VAL.MRCH.HI.ZS'] ?? '',
      g['PA.NUS.FCRF'] ?? '',
    ].join(','));
  }

  const outPath = path.join(DATA_DIR, 'wits_country_summaries.csv');
  fs.writeFileSync(outPath, summaryLines.join('\n'), 'utf-8');
  console.log(`  ✓ Wrote ${summaryLines.length - 1} country-year summaries to wits_country_summaries.csv`);

  // Generate JSON formats for client-safe loading in frontend components
  const latestSummaries = {};
  const countryTrends = {};

  for (const key of sortedKeys) {
    const g = grouped[key];
    const iso = g.country_iso3;
    const year = g.year;
    const imports = g['TM.VAL.MRCH.CD.WT'] || g['NE.IMP.GNFS.CD'] || 0;
    const tariff = g['TM.TAX.MRCH.WM.AR.ZS'] || g['TM.TAX.MRCH.SM.AR.ZS'] || 0;
    const fx = g['PA.NUS.FCRF'] || 1;
    const name = g.country_name?.replace(/"/g, '') || iso;

    if (imports > 0) {
      if (!countryTrends[iso]) {
        countryTrends[iso] = [];
      }
      countryTrends[iso].push({ year, value: imports });
    }

    const existing = latestSummaries[iso];
    if (!existing || year > existing.year) {
      latestSummaries[iso] = {
        countryIso3: iso,
        countryName: name,
        year,
        totalImportsUsd: imports,
        tariffWeightedAll: tariff,
        exchangeRateLcuPerUsd: fx,
      };
    }
  }

  // Sort each trend by year
  for (const iso in countryTrends) {
    countryTrends[iso].sort((a, b) => a.year - b.year);
  }

  fs.writeFileSync(path.join(DATA_DIR, 'wits_country_summaries.json'), JSON.stringify(latestSummaries, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'wits_country_trends.json'), JSON.stringify(countryTrends, null, 2), 'utf-8');
  console.log(`  ✓ Wrote wits_country_summaries.json and wits_country_trends.json`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  WITS & ITC Trade Data Scraper                      ║');
  console.log('║  Downloads public datasets for offline fallback     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Output directory: ${DATA_DIR}`);
  console.log(`  Countries: ${COUNTRIES.join(', ')}`);
  console.log(`  Year range: ${YEAR_RANGE}\n`);

  try {
    await downloadHSCodes();
    await downloadWorldBankIndicators();
    await generateCountrySummaries();

    console.log('\n══════════════════════════════════════════════════════');
    console.log('  COMPLETE! Generated files:');
    console.log('══════════════════════════════════════════════════════');
    
    const dataFiles = [
      'hs_codes.csv',
      'hs_codes_full.csv',
      'wits_country_indicators.csv',
      'wits_country_summaries.csv',
      'wits_country_summaries.json',
      'wits_country_trends.json'
    ];
    for (const file of dataFiles) {
      const filePath = path.join(DATA_DIR, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        const lineCount = fs.readFileSync(filePath, 'utf-8').split('\n').length;
        console.log(`  📄 ${file} (${sizeKB} KB, ${lineCount} lines)`);
      }
    }
  } catch (err) {
    console.error('\n  ❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
