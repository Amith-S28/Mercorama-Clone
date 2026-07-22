const fs = require('fs');
const path = require('path');

// Parse .env file so PM2 passes all keys to the Next.js standalone process.
// Next.js standalone (server.js) does NOT auto-load .env at runtime.
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};

  const vars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    vars[key] = val;
  }
  return vars;
}

const envVars = loadEnvFile();

module.exports = {
  apps: [
    {
      name: 'mercorama',
      script: '.next/standalone/server.js',
      cwd: '/var/www/mercorama',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        ...envVars,
      },
    },
  ],
};
