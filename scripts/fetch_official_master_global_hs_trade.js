/**
 * Reliable Master Official Global HS Trade Pipeline with Live Progress Bar
 * & Dynamic API Key / Anonymous Public Preview Fallback
 * 
 * Output Master CSV: src/data/official_global_trade_2019_2025.csv
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let COMTRADE_API_KEY = process.env.COMTRADE_API_KEY || '86d01441a2954e918ce91ac09308fffd';
let useApiKey = true;

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

const HS_CHAPTERS = Array.from({ length: 99 }, (_, i) => String(i + 1).padStart(2, '0'));
const HS_GROUPS = [];
for (let i = 0; i < HS_CHAPTERS.length; i += 5) {
  HS_GROUPS.push(HS_CHAPTERS.slice(i, i + 5).join(','));
}

const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeProgressBar(current, total, barLength = 25) {
  const fraction = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(fraction * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const pct = (fraction * 100).toFixed(1);
  return `[${bar}] ${pct}%`;
}

async function fetchUnComtradeWithRetry(reporterCode, hsGroup, period) {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const records = await new Promise((resolve, reject) => {
        const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporterCode}&cmdCode=${hsGroup}&period=${period}`;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        };
        if (useApiKey && COMTRADE_API_KEY) {
          headers['Ocp-Apim-Subscription-Key'] = COMTRADE_API_KEY;
        }

        const req = https.get(url, { headers }, (res) => {
          if (res.statusCode === 403) {
            useApiKey = false;
            reject({ isQuotaExhausted: true, statusCode: 403 });
            return;
          }
          if (res.statusCode === 429) {
            reject({ isRateLimit: true, statusCode: 429 });
            return;
          }
          if (res.statusCode !== 200) {
            if (res.statusCode === 400 || res.statusCode === 404) {
              resolve([]);
              return;
            }
            reject(new Error(`HTTP ${res.statusCode}`));
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
        });
        req.on('error', (err) => reject(err));
      });
      return records;
    } catch (err) {
      if (err && err.isQuotaExhausted) {
        console.log(`   💡 Subscription Key quota reached (HTTP 403). Dynamically switched to public preview mode.`);
        await sleep(1000);
      } else if (err && err.isRateLimit) {
        const waitTime = Math.min(2500 * Math.pow(1.3, attempt), 12000);
        console.log(`   ⚠️ Rate limit 429 on ${reporterCode} HS [${hsGroup}] ${period}. Retrying in ${(waitTime/1000).toFixed(1)}s (Attempt ${attempt})...`);
        await sleep(waitTime);
      } else {
        console.log(`   ⚠️ Connection error (${err.message}). Retrying in 3s...`);
        await sleep(3000);
      }
    }
  }
}

function writeStatus(batchCount, totalBatches, currentReporter, currentHsGroup, currentYear, totalRecords, countriesCompleted, totalCountries) {
  const statusPath = path.join(DATA_DIR, 'download_status.json');
  const pct = ((batchCount / totalBatches) * 100).toFixed(1);
  const progressBar = makeProgressBar(batchCount, totalBatches, 30);
  const status = {
    batchCount,
    totalBatches,
    progressPct: parseFloat(pct),
    progressBar,
    currentReporter,
    currentHsGroup,
    currentYear,
    totalRecords,
    countriesCompleted,
    totalCountries,
    mode: useApiKey ? 'Authenticated Key' : 'Public Preview',
    lastUpdated: new Date().toISOString()
  };
  try {
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  } catch (err) {}
}

async function run() {
  console.log(`=== Reliable UN Comtrade Master Pipeline with Dynamic Public Preview Fallback ===`);

  const masterCsvPath = path.join(DATA_DIR, 'official_global_trade_2019_2025.csv');
  const hsCsvPath = path.join(DATA_DIR, 'official_hs_trade_by_country.csv');

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

  let csvRows = [csvHeaders.join(',')];
  let totalRecords = 0;
  let batchCount = 0;
  let countriesCompleted = 0;
  const totalCountries = TOP_50_REPORTERS.length;
  const totalBatches = totalCountries * YEARS.length * HS_GROUPS.length;

  for (const reporter of TOP_50_REPORTERS) {
    console.log(`\n🌍 Country ${countriesCompleted + 1}/${totalCountries}: ${reporter.name} (${reporter.iso3})`);

    for (const period of YEARS) {
      for (const hsGroup of HS_GROUPS) {
        batchCount++;

        writeStatus(batchCount, totalBatches, reporter.name, hsGroup, period, totalRecords, countriesCompleted, totalCountries);

        const bar = makeProgressBar(batchCount, totalBatches, 25);
        console.log(`${bar} | Batches: ${batchCount}/${totalBatches} | Records: ${totalRecords.toLocaleString()} | ${reporter.name} | HS [${hsGroup}] | ${period}`);

        const records = await fetchUnComtradeWithRetry(reporter.code, hsGroup, period);
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

        // 2.2s pause between requests
        await sleep(2200);
      }
    }

    countriesCompleted++;
    fs.writeFileSync(masterCsvPath, csvRows.join('\n'));
    fs.writeFileSync(hsCsvPath, csvRows.join('\n'));
    console.log(`✅ Saved ${reporter.name} data. Total entries in CSV: ${csvRows.length.toLocaleString()}`);
  }

  writeStatus(totalBatches, totalBatches, 'COMPLETE', 'ALL', '2025', totalRecords, totalCountries, totalCountries);
  console.log('\n=== Master Pipeline Completed Successfully ===');
}

run().catch(err => {
  console.error('ETL Fatal Error:', err);
  process.exit(1);
});
