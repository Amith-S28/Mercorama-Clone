const fs = require('fs');
const path = require('path');

const MASTER_CSV = path.join(__dirname, '..', 'data', 'ports_master.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'ports.json');

// Simple CSV parser for semicolon- or comma-separated files
function parseCSV(text, sep = ';') {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(sep).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj;
  });

  return { headers, rows };
}

function main() {
  console.log('[ports] Reading master from', MASTER_CSV);
  const text = fs.readFileSync(MASTER_CSV, 'utf8');

  // Your file is semicolon-separated
  const { headers, rows } = parseCSV(text, ';');

  const idKey          = 'id';
  const nameKey        = 'name';
  const displayNameKey = 'display_name';
  const countryKey     = 'country_code';
  const enabledKey     = 'enabled';
  const aliasesKey     = 'aliases';

  let ports = rows.filter(r => {
    const enabled = String(r[enabledKey] || '').toLowerCase();
    return enabled === 'true';
  }).map(r => {
    const id = r[idKey];
    const countryCode = String(r[countryKey] || '').toUpperCase();
    const displayName = (r[displayNameKey] || '').trim();
    const name = displayName || (r[nameKey] || '').trim();

    const port = {
      id,
      name,
      countryCode,
    };

    const aliasesRaw = (r[aliasesKey] || '').trim();
    if (aliasesRaw) {
      port.aliases = aliasesRaw
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
    }

    return port;
  });

  // De-duplicate by id if needed
  const seen = new Set();
  ports = ports.filter(p => {
    if (!p.id) return true;
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(ports, null, 2), 'utf8');
  console.log('[ports] Wrote', ports.length, 'ports to', OUTPUT_JSON);
}

main();

