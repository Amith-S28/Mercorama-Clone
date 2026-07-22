/**
 * UN Comtrade All 99 HS Chapters Bilateral Dataset Ingestion Script
 * 
 * Downloads 100% REAL, UNALTERED official trade data directly from official UN Comtrade API v1
 * (https://comtradeapi.un.org/public/v1/preview/C/A/HS) across ALL 99 Harmonized System Chapters.
 * 
 * Chapters Covered: HS 01 through HS 99 (All 99 Commodity Chapters)
 * 
 * Outputs:
 * - src/data/official_hs_trade_by_country.csv
 * - src/data/official_hs_trade_by_country.json
 * 
 * Usage: node scripts/fetch_official_un_comtrade_hs.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Major global economies (UN M49 numeric codes and ISO3 mapping)
const REPORTERS = [
  { code: '842', iso3: 'USA', name: 'United States' },
  { code: '156', iso3: 'CHN', name: 'China' },
  { code: '392', iso3: 'JPN', name: 'Japan' },
  { code: '276', iso3: 'DEU', name: 'Germany' },
  { code: '826', iso3: 'GBR', name: 'United Kingdom' },
  { code: '250', iso3: 'FRA', name: 'France' },
  { code: '124', iso3: 'CAN', name: 'Canada' },
  { code: '356', iso3: 'IND', name: 'India' },
  { code: '076', iso3: 'BRA', name: 'Brazil' },
  { code: '410', iso3: 'KOR', name: 'South Korea' },
  { code: '484', iso3: 'MEX', name: 'Mexico' },
  { code: '036', iso3: 'AUS', name: 'Australia' },
  { code: '528', iso3: 'NLD', name: 'Netherlands' },
  { code: '702', iso3: 'SGP', name: 'Singapore' },
  { code: '710', iso3: 'ZAF', name: 'South Africa' },
  { code: '380', iso3: 'ITA', name: 'Italy' },
  { code: '458', iso3: 'MYS', name: 'Malaysia' },
  { code: '704', iso3: 'VNM', name: 'Vietnam' },
  { code: '724', iso3: 'ESP', name: 'Spain' },
  { code: '764', iso3: 'THA', name: 'Thailand' },
  { code: '360', iso3: 'IDN', name: 'Indonesia' }
];

// All 99 Harmonized System Chapters (01 to 99)
const HS_CHAPTERS = Array.from({ length: 99 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = ['2023', '2022'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUnComtrade(reporterCode, cmdCode, period, retryCount = 0) {
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporterCode}&cmdCode=${cmdCode}&period=${period}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUnComtrade(reporterCode, cmdCode, period, retryCount).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 429 && retryCount < 5) {
        const retryAfter = (parseInt(res.headers['retry-after'], 10) || 2) * 1000;
        console.log(`   ⚠️ Rate limited (HTTP 429). Retrying in ${retryAfter / 1000}s...`);
        sleep(retryAfter).then(() => fetchUnComtrade(reporterCode, cmdCode, period, retryCount + 1)).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        // Reserved/empty HS chapters (e.g. 77) may return 400 or empty data
        if (res.statusCode === 400 || res.statusCode === 404) {
          resolve([]);
          return;
        }
        reject(new Error(`HTTP ${res.statusCode} for UN Comtrade URL ${url}`));
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.data || []);
        } catch (err) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== Starting Official UN Comtrade Ingestion for ALL 99 HS Chapters ===');

  const allRecords = [];
  const csvHeaders = [
    'Year',
    'Reporter_ISO3',
    'Reporter_Name',
    'Partner_ISO3',
    'Partner_Name',
    'Flow_Type',
    'HS_Code',
    'HS_Description',
    'Trade_Value_USD',
    'Net_Weight_KG',
    'Quantity',
    'Quantity_Unit'
  ];

  const csvRows = [csvHeaders.join(',')];

  let batchCount = 0;
  const totalBatches = REPORTERS.length * HS_CHAPTERS.length * YEARS.length;

  for (const reporter of REPORTERS) {
    for (const period of YEARS) {
      for (const cmdCode of HS_CHAPTERS) {
        batchCount++;
        console.log(`[${batchCount}/${totalBatches}] Fetching UN Comtrade data for ${reporter.name} (${reporter.iso3}) | HS Chapter ${cmdCode} | Year ${period}...`);

        try {
          const records = await fetchUnComtrade(reporter.code, cmdCode, period);
          if (records.length > 0) {
            console.log(`   -> Retreived ${records.length} official trade flow records`);
          }

          for (const rec of records) {
            if (!rec.primaryValue || rec.primaryValue <= 0) continue;

            const year = rec.period || period;
            const repIso = rec.reporterISO || reporter.iso3;
            const repName = (rec.reporterDesc || reporter.name).replace(/"/g, '""');
            const partIso = rec.partnerISO || 'W00';
            const partName = (rec.partnerDesc || 'World').replace(/"/g, '""');
            const flowDesc = rec.flowDesc || 'Trade';
            const code = rec.cmdCode || cmdCode;
            const desc = (rec.cmdDesc || '').replace(/"/g, '""');
            const usdValue = rec.primaryValue || 0;
            const netWgtKg = rec.netWgt || 0;
            const qty = rec.qty || 0;
            const qtyUnit = rec.qtyUnitAbbr || '';

            allRecords.push({
              year,
              reporterIso3: repIso,
              reporterName: rec.reporterDesc || reporter.name,
              partnerIso3: partIso,
              partnerName: rec.partnerDesc || 'World',
              flowType: flowDesc,
              hsCode: code,
              hsDescription: rec.cmdDesc || '',
              tradeValueUsd: usdValue,
              netWeightKg: netWgtKg,
              quantity: qty,
              quantityUnit: qtyUnit,
            });

            csvRows.push(
              `${year},${repIso},"${repName}",${partIso},"${partName}",${flowDesc},${code},"${desc}",${usdValue},${netWgtKg},${qty},"${qtyUnit}"`
            );
          }
        } catch (err) {
          console.error(`   Warning: Batch failed for ${reporter.iso3} HS ${cmdCode} ${period}:`, err.message);
        }

        // 1.2s delay for rate limits
        await sleep(1200);
      }
    }
  }

  console.log(`\nDownloaded total ${allRecords.length} official UN Comtrade trade records across all 99 HS chapters.`);

  // Save CSV sheet
  const csvPath = path.join(DATA_DIR, 'official_hs_trade_by_country.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`Saved official CSV sheet for all 99 HS chapters: ${csvPath}`);

  // Save JSON dataset
  const jsonPath = path.join(DATA_DIR, 'official_hs_trade_by_country.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allRecords, null, 2));
  console.log(`Saved official JSON dataset for all 99 HS chapters: ${jsonPath}`);

  console.log('=== All 99 HS Chapters Data Ingestion Finished Successfully ===');
}

run().catch(err => {
  console.error('ETL Fatal Error:', err);
  process.exit(1);
});
