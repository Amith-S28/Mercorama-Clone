const fs = require('fs');
const path = require('path');

const INPUT_CSV = path.join(__dirname, '..', 'data', 'mercorama-seaports.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'ports.json');

// ----- CONFIG -----
const MAX_PORTS = 500;

// Major export countries / key regions (ISO2 codes)
const MAJOR_EXPORT_COUNTRIES = new Set([
  // North America
  'US', // United States
  'CA', // Canada
  'MX', // Mexico

  // South & Central America
  'BR', // Brazil
  'AR', // Argentina
  'CL', // Chile
  'CO', // Colombia
  'PE', // Peru

  // Europe (core exporters)
  'DE', // Germany
  'NL', // Netherlands
  'IT', // Italy
  'FR', // France
  'BE', // Belgium
  'ES', // Spain
  'PL', // Poland
  'SE', // Sweden
  'NO', // Norway
  'DK', // Denmark
  'IE', // Ireland
  'PT', // Portugal
  'CZ', // Czechia
  'AT', // Austria
  'FI', // Finland
  'CH', // Switzerland
  'GB', // United Kingdom

  // Asia – giants + key exporters
  'CN', // China
  'JP', // Japan
  'KR', // South Korea
  'IN', // India
  'SG', // Singapore
  'TW', // Taiwan
  'VN', // Vietnam
  'TH', // Thailand
  'MY', // Malaysia
  'ID', // Indonesia
  'PH', // Philippines
  'BD', // Bangladesh
  'PK', // Pakistan
  'LK', // Sri Lanka

  // Middle East
  'AE', // United Arab Emirates
  'SA', // Saudi Arabia
  'QA', // Qatar
  'OM', // Oman
  'IL', // Israel
  'TR', // Türkiye

  // Africa
  'ZA', // South Africa
  'EG', // Egypt
  'MA', // Morocco
  'NG', // Nigeria
  'KE', // Kenya
  'DZ', // Algeria

  // Oceania
  'AU', // Australia
  'NZ', // New Zealand
]);

// Optional: manual critical ports that might be missing or badly named in the CSV
// You can fill this later if needed (e.g. Jawaharlal Nehru (Nhava Sheva), Santos, etc.)
const MANUAL_PORTS = [
  // Example (uncomment and adjust once you confirm what's missing in the CSV):
  // { name: 'Jawaharlal Nehru (Nhava Sheva)', countryCode: 'IN' },
  // { name: 'Santos', countryCode: 'BR' },
];

// CSV parser for semicolon-separated Upply file
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(';').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(';').map((c) => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj;
  });

  return { headers, rows };
}

function main() {
  console.log('[ports] Reading CSV from', INPUT_CSV);
  const csvText = fs.readFileSync(INPUT_CSV, 'utf8');
  const { headers, rows } = parseCSV(csvText);

  // Header row in Upply: code;name;latitude;longitude;country_code;zone_code
  const nameKey = headers.find((h) =>
    ['name', 'Name', 'PORT_NAME', 'Port_name', 'PortName', 'libelle_port'].includes(h)
  );
  const countryKey = headers.find((h) =>
    ['country_code', 'COUNTRY_CODE', 'country', 'Country', 'COUNTRY', 'iso2', 'code_pays'].includes(h)
  );

  if (!nameKey || !countryKey) {
    console.error('[ports] Could not detect name/country columns.');
    console.error('[ports] Headers:', headers);
    process.exit(1);
  }

  console.log('[ports] Using columns:', { nameKey, countryKey });

  let ports = rows
    .filter((r) => r[nameKey] && r[countryKey])
    .map((r) => ({
      name: r[nameKey],
      countryCode: String(r[countryKey]).toUpperCase(),
    }));

  // De-duplicate by name + country
  const seen = new Set();
  ports = ports.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.countryCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log('[ports] Total ports found in CSV before prioritization:', ports.length);

  // Prioritize ports from major export countries
  const majorPorts = ports.filter((p) => MAJOR_EXPORT_COUNTRIES.has(p.countryCode));
  const otherPorts = ports.filter((p) => !MAJOR_EXPORT_COUNTRIES.has(p.countryCode));

  console.log('[ports] Major-export country ports:', majorPorts.length);
  console.log('[ports] Other ports:', otherPorts.length);

  let finalPorts = [...majorPorts, ...otherPorts];

  // Add manual ports (if any), avoiding duplicates
  if (MANUAL_PORTS.length > 0) {
    const finalSeen = new Set(
      finalPorts.map((p) => `${p.name.toLowerCase()}|${p.countryCode}`)
    );
    for (const mp of MANUAL_PORTS) {
      const key = `${mp.name.toLowerCase()}|${mp.countryCode}`;
      if (!finalSeen.has(key)) {
        finalPorts.push(mp);
        finalSeen.add(key);
      }
    }
    console.log('[ports] After adding MANUAL_PORTS, total:', finalPorts.length);
  }

  if (finalPorts.length > MAX_PORTS) {
    console.log(
      '[ports] Total ports after prioritization:',
      finalPorts.length,
      '-> trimming to',
      MAX_PORTS
    );
    finalPorts = finalPorts.slice(0, MAX_PORTS);
  } else {
    console.log('[ports] Total ports after prioritization:', finalPorts.length);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(finalPorts, null, 2), 'utf8');
  console.log('[ports] Wrote JSON to', OUTPUT_JSON);
}

main();

