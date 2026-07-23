/**
 * Live Terminal Progress Monitor CLI for UN Comtrade Download
 * 
 * Usage: node scripts/show_progress.js
 */

const fs = require('fs');
const path = require('path');

const STATUS_PATH = path.join(__dirname, '..', 'src', 'data', 'download_status.json');

if (!fs.existsSync(STATUS_PATH)) {
  console.log('❌ Download status file not found. ETL script may not be running.');
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
  console.log('\n======================================================');
  console.log(' 🚀 UN COMTRADE MASTER DATASET INGESTION PROGRESS');
  console.log('======================================================');
  console.log(` Progress Bar : ${data.progressBar || '[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0.0%'}`);
  console.log(` Progress     : ${data.progressPct}% (${data.batchCount} / ${data.totalBatches} batches)`);
  console.log(` Countries    : ${data.countriesCompleted || 0} / ${data.totalCountries || 50} completed`);
  console.log(` Records      : ${(data.totalRecords || 0).toLocaleString()} entries extracted`);
  console.log(` Active Market: ${data.currentReporter || 'N/A'}`);
  console.log(` Commodity    : HS [${data.currentHsGroup || 'N/A'}] | Year: ${data.currentYear || 'N/A'}`);
  console.log(` Last Updated : ${data.lastUpdated || 'N/A'}`);
  console.log('======================================================\n');
} catch (err) {
  console.error('Error reading status:', err.message);
}
