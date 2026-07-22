/**
 * Fast Master Global HS Bilateral Trade Dataset Ingestion Script (2019-2025)
 * 
 * Batches HS codes in groups of 10 per request to download 10x faster
 * with official UN Comtrade API Key authentication.
 * 
 * Specs:
 * - 50 Top Global Economies
 * - 99 HS Chapters (batched 10 per call)
 * - Timeline: 2019 to 2025 (7 years)
 * - Output: src/data/official_global_trade_2019_2025.csv
 * 
 * Usage: node scripts/fetch_official_master_global_hs_trade.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const COMTRADE_API_KEY = process.env.COMTRADE_API_KEY || '86d01441a2954e918ce91ac09308fffd';

// Top 50 Global Economies
const TOP_50_REPORTERS = [
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
  { code: '360', iso3: 'IDN', name: 'Indonesia' },
  { code: '756', iso3: 'CHE', name: 'Switzerland' },
  { code: '752', iso3: 'SWE', name: 'Sweden' },
  { code: '616', iso3: 'POL', name: 'Poland' },
  { code: '056', iso3: 'BEL', name: 'Belgium' },
  { code: '792', iso3: 'TUR', name: 'Türkiye' },
  { code: '682', iso3: 'SAU', name: 'Saudi Arabia' },
  { code: '784', iso3: 'ARE', name: 'United Arab Emirates' },
  { code: '158', iso3: 'TWN', name: 'Taiwan' },
  { code: '642', iso3: 'ROU', name: 'Romania' },
  { code: '040', iso3: 'AUT', name: 'Austria' },
  { code: '208', iso3: 'DNK', name: 'Denmark' },
  { code: '372', iso3: 'IRL', name: 'Ireland' },
  { code: '578', iso3: 'NOR', name: 'Norway' },
  { code: '203', iso3: 'CZE', name: 'Czech Republic' },
  { code: '348', iso3: 'HUN', name: 'Hungary' },
  { code: '620', iso3: 'PRT', name: 'Portugal' },
  { code: '300', iso3: 'GRC', name: 'Greece' },
  { code: '170', iso3: 'COL', name: 'Colombia' },
  { code: '152', iso3: 'CHL', name: 'Chile' },
  { code: '604', iso3: 'PER', name: 'Peru' },
  { code: '032', iso3: 'ARG', name: 'Argentina' },
  { code: '586', iso3: 'PAK', name: 'Pakistan' },
  { code: '504', iso3: 'MAR', name: 'Morocco' },
  { code: '566', iso3: 'NGA', name: 'Nigeria' },
  { code: '218', iso3: 'ECU', name: 'Ecuador' },
  { code: '818', iso3: 'EGY', name: 'Egypt' },
  { code: '398', iso3: 'KAZ', name: 'Kazakhstan' },
  { code: '608', iso3: 'PHL', name: 'Philippines' },
  { code: '554', iso3: 'NZL', name: 'New Zealand' }
];

// All 99 HS Chapters grouped in 10-chapter chunks
const HS_CHAPTERS = Array.from({ length: 99 }, (_, i) => String(i + 1).padStart(2, '0'));
const HS_GROUPS = [];
for (let i = 0; i < HS_CHAPTERS.length; i += 10) {
  HS_GROUPS.push(HS_CHAPTERS.slice(i, i + 10).join(','));
}

const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUnComtrade(reporterCode, hsGroup, period, retryCount = 0) {
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporterCode}&cmdCode=${hsGroup}&period=${period}`;
  const options = {
    headers: {
      'Ocp-Apim-Subscription-Key': COMTRADE_API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUnComtrade(reporterCode, hsGroup, period, retryCount).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 429 && retryCount < 5) {
        const retryAfter = (parseInt(res.headers['retry-after'], 10) || 2) * 1000;
        sleep(retryAfter).then(() => fetchUnComtrade(reporterCode, hsGroup, period, retryCount + 1)).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
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

function writeStatus(batchCount, totalBatches, currentReporter, currentHsGroup, currentYear, totalRecords) {
  const statusPath = path.join(DATA_DIR, 'download_status.json');
  const pct = ((batchCount / totalBatches) * 100).toFixed(1);
  const status = {
    batchCount,
    totalBatches,
    progressPct: parseFloat(pct),
    currentReporter,
    currentHsGroup,
    currentYear,
    totalRecords,
    lastUpdated: new Date().toISOString()
  };
  try {
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  } catch (err) {}
}

async function run() {
  console.log(`=== Starting Fast Authenticated UN Comtrade Master Ingestion ===`);
  console.log(`Top 50 Countries | 99 HS Chapters (Batched 10x) | Years 2019-2025`);

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
  let totalRecords = 0;
  let batchCount = 0;
  const totalBatches = TOP_50_REPORTERS.length * YEARS.length * HS_GROUPS.length; // 50 * 7 * 10 = 3,500 batches!

  for (const reporter of TOP_50_REPORTERS) {
    for (const period of YEARS) {
      for (const hsGroup of HS_GROUPS) {
        batchCount++;

        writeStatus(batchCount, totalBatches, reporter.name, hsGroup, period, totalRecords);

        if (batchCount % 10 === 0 || batchCount === 1) {
          console.log(`[${batchCount}/${totalBatches}] (${((batchCount/totalBatches)*100).toFixed(1)}%) | ${reporter.name} (${reporter.iso3}) | HS Group [${hsGroup}] | Year ${period} | Total Records: ${totalRecords}`);
        }

        try {
          const records = await fetchUnComtrade(reporter.code, hsGroup, period);
          for (const rec of records) {
            if (!rec.primaryValue || rec.primaryValue <= 0) continue;

            const year = rec.period || period;
            const repIso = rec.reporterISO || reporter.iso3;
            const repName = (rec.reporterDesc || reporter.name).replace(/"/g, '""');
            const partIso = rec.partnerISO || 'W00';
            const partName = (rec.partnerDesc || 'World').replace(/"/g, '""');
            const flowDesc = rec.flowDesc || 'Trade';
            const code = rec.cmdCode || '';
            const desc = (rec.cmdDesc || '').replace(/"/g, '""');
            const usdValue = rec.primaryValue || 0;
            const netWgtKg = rec.netWgt || 0;
            const qty = rec.qty || 0;
            const qtyUnit = rec.qtyUnitAbbr || '';

            totalRecords++;
            csvRows.push(
              `${year},${repIso},"${repName}",${partIso},"${partName}",${flowDesc},${code},"${desc}",${usdValue},${netWgtKg},${qty},"${qtyUnit}"`
            );
          }
        } catch (err) {
          console.error(`   Warning: Batch failed for ${reporter.iso3} HS [${hsGroup}] ${period}:`, err.message);
        }

        // 1.5s delay to satisfy UN Comtrade subscription key rate limit window
        await sleep(1500);
      }
    }
  }

  console.log(`\nSuccessfully downloaded total ${totalRecords} official UN Comtrade trade flow records!`);

  const masterCsvPath = path.join(DATA_DIR, 'official_global_trade_2019_2025.csv');
  fs.writeFileSync(masterCsvPath, csvRows.join('\n'));
  console.log(`Saved Official Master CSV: ${masterCsvPath}`);

  const hsCsvPath = path.join(DATA_DIR, 'official_hs_trade_by_country.csv');
  fs.writeFileSync(hsCsvPath, csvRows.join('\n'));

  writeStatus(totalBatches, totalBatches, 'COMPLETE', 'ALL', '2025', totalRecords);
  console.log('=== Fast Master Ingestion Completed Successfully ===');
}

run().catch(err => {
  console.error('ETL Fatal Error:', err);
  process.exit(1);
});
