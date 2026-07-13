import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = __dirname;
const OUT_PDF = path.join(path.dirname(SCRATCH), 'Trade_Agency_Feature_Report.pdf');

/** Convert an image file to a base64 data URI */
function toDataUri(filename) {
  const filePath = path.join(SCRATCH, filename);
  if (!fs.existsSync(filePath)) return '';
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// Pre-load all images as data URIs so the HTML is fully self-contained
const img = {
  portfolio:       toDataUri('01_portfolio_dashboard.png'),
  scorecardFull:   toDataUri('02_scorecard_full.png'),
  scoreGauge:      toDataUri('03_score_gauge_sanctions.png'),
  countryMap:      toDataUri('04_country_risk_map.png'),
  pillarsLanded:   toDataUri('05_pillars_landed_cost.png'),
  gapsMargin:      toDataUri('06_gaps_margin.png'),
  advisorRoadmap:  toDataUri('07_advisor_roadmap.png'),
  tradeIntelFull:  toDataUri('08_trade_intel_full.png'),
  tradeMetrics:    toDataUri('09_trade_intel_metrics.png'),
  tradePartners:   toDataUri('10_trade_intel_partners.png'),
  tradeSeason:     toDataUri('11_trade_intel_seasonality_map.png'),
  landedCostTab:   toDataUri('12_landed_cost_tab.png'),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trade Agency Sandbox Portal — Feature Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #0f1117;
    --bg-card: #161922;
    --bg-card-alt: #1c1f2b;
    --border: #2a2d3a;
    --text: #e8eaed;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --accent: #3b82f6;
    --accent-glow: rgba(59,130,246,0.15);
    --green: #22c55e;
    --amber: #f59e0b;
    --red: #ef4444;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    padding: 0;
  }

  .page { 
    max-width: 900px; 
    margin: 0 auto; 
    padding: 60px 48px; 
  }

  /* Cover Page */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
    padding: 80px 48px;
  }
  .cover-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 999px;
    padding: 6px 18px;
    margin-bottom: 32px;
  }
  .cover h1 {
    font-size: 42px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #e8eaed, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cover .subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    max-width: 500px;
    margin-bottom: 48px;
  }
  .cover-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    gap: 24px;
  }
  .cover-meta span { display: flex; align-items: center; gap: 6px; }
  .cover-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

  /* Section Headings */
  h2 {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 56px 0 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  h2:first-of-type { margin-top: 0; }
  h3 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 40px 0 8px;
    color: var(--accent);
  }
  h4 {
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin: 24px 0 8px;
  }

  p { margin: 8px 0; font-size: 14.5px; color: var(--text-secondary); }
  strong { color: var(--text); font-weight: 600; }

  /* Cards */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 32px;
    margin: 20px 0;
  }
  .card p { margin: 6px 0; }

  /* Screenshot */
  .screenshot {
    margin: 24px 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  .screenshot img {
    width: 100%;
    display: block;
  }
  .screenshot-caption {
    padding: 10px 16px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted);
    background: var(--bg-card-alt);
    border-top: 1px solid var(--border);
  }

  /* Lists */
  ul, ol { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; font-size: 14px; color: var(--text-secondary); }
  li strong { color: var(--text); }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  th {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid var(--border);
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
  }
  tr:last-child td { border-bottom: none; }

  /* Inline Code */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    background: var(--bg-card-alt);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent);
  }

  /* Divider */
  hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 48px 0;
  }

  /* Feature Tag */
  .feature-tag {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 999px;
    margin-right: 6px;
    margin-bottom: 4px;
  }
  .tag-lib { background: rgba(59,130,246,0.15); color: var(--accent); border: 1px solid rgba(59,130,246,0.3); }
  .tag-api { background: rgba(34,197,94,0.12); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .tag-ui  { background: rgba(245,158,11,0.12); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }

  /* Page break helper */
  .page-break { page-break-before: always; }

  @media print {
    body { background: #0f1117; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 40px 32px; }
    .cover { min-height: auto; padding: 120px 32px; }
    .screenshot { break-inside: avoid; }
    .card { break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ═══════════════════ COVER ═══════════════════ -->
<div class="cover">
  <div class="cover-badge">Feature Report</div>
  <h1>Trade Agency<br>Sandbox Portal</h1>
  <p class="subtitle">
    Comprehensive feature documentation with live screenshots captured from the running application.
  </p>
  <div class="cover-meta">
    <span><span class="cover-dot"></span> HolyGrail v0.1.0</span>
    <span>Next.js 15.5.20</span>
    <span>React 19</span>
    <span>July 2026</span>
  </div>
</div>

<!-- ═══════════════════ OVERVIEW ═══════════════════ -->
<div class="page">
  <h2>1. Overview</h2>
  <p>
    The <strong>Trade Agency Sandbox Portal</strong> is a full-stack advisory intelligence platform 
    built for Canadian export trade agencies. It enables trade advisors to manage a portfolio of 
    Small and Medium-sized Enterprises (SMEs), assess their export readiness across nine standardized 
    pillars, and provide actionable intelligence on target markets — all within a single, premium 
    dark-themed workspace.
  </p>

  <div class="card">
    <h4>Navigation Model</h4>
    <table>
      <tr><th>Route</th><th>Purpose</th></tr>
      <tr><td><code>/sandbox/agency</code></td><td>Portfolio dashboard — lists all SMEs, shows aggregate readiness</td></tr>
      <tr><td><code>/sandbox/agency/report?id=&lt;smeId&gt;</code></td><td>Deep-dive report workspace with tabbed sections</td></tr>
    </table>
  </div>

  <hr>

  <!-- ═══════════════════ PORTFOLIO ═══════════════════ -->
  <h2>2. Features</h2>

  <h3>2.1 Portfolio Dashboard</h3>
  <p>
    <span class="feature-tag tag-ui">Client Component</span>
    <span class="feature-tag tag-api">/api/sme + /api/assessment</span>
    <span class="feature-tag tag-lib">Framer Motion</span>
  </p>
  <p>
    Trade advisors manage multiple SME clients simultaneously. They need a single view to triage 
    which companies are export-ready, which have pending assessments, and the overall health of 
    their advisory portfolio.
  </p>
  <div class="card">
    <h4>Capabilities</h4>
    <ul>
      <li>Aggregate KPIs: <strong>Active Clients</strong> count and <strong>Avg. Readiness</strong> score with animated progress bar</li>
      <li>SME cards in a bento-grid layout showing company name, province, industry, target country, and readiness grade (A–F)</li>
      <li>"Open report" links for assessed SMEs; inline "Start questionnaire" for pending ones</li>
      <li>Real-time health status badge in sidebar footer (7/7 services healthy)</li>
      <li>Sidebar navigation with theme toggle</li>
    </ul>
    <h4>Technical</h4>
    <ul>
      <li>Component: <code>AgencyPortfolioClient.tsx</code> — fetches <code>/api/sme</code> and <code>/api/assessment</code> in parallel</li>
      <li>Staggered card entrance animation using <code>motion</code> with <code>snappy</code> spring preset</li>
      <li>Scoring engine: <code>gradeColor()</code> and <code>gradeLabel()</code> for grade visualization</li>
    </ul>
  </div>

  <div class="screenshot">
    <img src="${img.portfolio}" alt="Portfolio Dashboard">
    <div class="screenshot-caption">FIG 1 — Portfolio Dashboard showing 4 SMEs with readiness grades (A/A/B/C) and aggregate metrics</div>
  </div>

  <hr>

  <!-- ═══════════════════ SCORE GAUGE + SANCTIONS ═══════════════════ -->
  <h3>2.2 Readiness Score Gauge</h3>
  <p>
    <span class="feature-tag tag-ui">SVG Animation</span>
    <span class="feature-tag tag-lib">useCountUp Hook</span>
  </p>
  <p>
    Animated SVG circular gauge displaying readiness score (0–100) and letter grade. Color-coded 
    ring adapts to grade severity — green for A, blue for B, amber for C, red for D/F. The numeric 
    score uses a custom <code>useCountUp</code> hook for animated decimal counting.
  </p>
  <div class="card">
    <h4>Technical</h4>
    <ul>
      <li>Pure SVG with <code>motion.circle</code> animated <code>strokeDashoffset</code></li>
      <li>Constants: <code>SIZE=168</code>, <code>STROKE=10</code>, calculated circumference for arc math</li>
      <li>Critically-damped spring transition preset</li>
    </ul>
  </div>

  <h3>2.3 Sanctions & Compliance Screen</h3>
  <p>
    <span class="feature-tag tag-api">/api/sandbox/screen</span>
    <span class="feature-tag tag-lib">SEMA / CSL</span>
  </p>
  <p>
    Before proceeding with any export engagement, advisors must verify the SME isn't on any 
    sanctions or restricted entity lists. The screen pre-fills with the company name, normalizes 
    the query, and checks against SEMA / Consolidated Screening List data. Shows "Clear" (green shield) 
    or "Match Found" (red alert) with matched entries and data origin audit trail.
  </p>

  <div class="screenshot">
    <img src="${img.scoreGauge}" alt="Score Gauge and Sanctions Screen">
    <div class="screenshot-caption">FIG 2 — Readiness Score Gauge (B / 74.5) paired with Sanctions Compliance Screen</div>
  </div>

  <hr>

  <!-- ═══════════════════ MAP + PLAYBOOK ═══════════════════ -->
  <h3>2.4 EDC Country Risk Map & Country Playbook</h3>
  <p>
    <span class="feature-tag tag-lib">@visx/geo</span>
    <span class="feature-tag tag-lib">@visx/zoom</span>
    <span class="feature-tag tag-lib">topojson-client</span>
  </p>
  <p>
    Interactive Mercator world map colored by Export Development Canada risk tiers — 
    <strong style="color:#22c55e">Open</strong> (green), 
    <strong style="color:#f59e0b">Watch</strong> (amber), 
    <strong style="color:#ef4444">Restricted/Blocked</strong> (red). 
    Features an animated dashed shipping lane arc from Canada to the selected target country, 
    with zoom/pan controls.
  </p>
  <p>
    The <strong>Country Playbook</strong> side panel appears when a country is clicked, showing 
    FTA status (e.g., CPTPP), region, default tariff, freight cost per FEU, import volume, 
    YoY change, and sanctions clearance status.
  </p>
  <div class="card">
    <h4>Technical</h4>
    <ul>
      <li><code>@visx/geo</code> Mercator projection + <code>@visx/zoom</code> for pan/zoom</li>
      <li>World atlas topology (110m) loaded from CDN, parsed with <code>topojson-client</code></li>
      <li>28 EDC-tracked markets with ISO3 numeric mapping in <code>country-risk-data.ts</code></li>
      <li>Shipping lane: SVG quadratic Bézier curve between Canada and target centroids</li>
      <li>Fallback: <code>buildMinimalWorld()</code> generates polygons if CDN fails</li>
    </ul>
  </div>

  <div class="screenshot">
    <img src="${img.countryMap}" alt="Country Risk Map">
    <div class="screenshot-caption">FIG 3 — EDC Country Risk Map with shipping lane to Japan + Country Playbook (FTA: CPTPP, Tariff: 12.8%)</div>
  </div>

  <hr>

  <!-- ═══════════════════ PILLARS + LANDED COST ═══════════════════ -->
  <h3>2.5 Pillars Matrix & Critical Gap Analyzer</h3>
  <p>
    <span class="feature-tag tag-ui">Animated Bars</span>
    <span class="feature-tag tag-lib">scoring-engine.ts</span>
  </p>
  <p>
    Displays nine export readiness pillars as animated horizontal bar charts: Staff Knowledge, 
    Product Readiness, Operations, Trade Finance, Legal, Strategy, Cultural Readiness, Digital, 
    and Program & Funding. Color-coded by score threshold (≥70% green, ≥50% blue, ≥25% amber, 
    &lt;25% red).
  </p>
  <p>
    The <strong>Critical Gap Analyzer</strong> filters pillars below a configurable threshold 
    (default 50%) and lists them sorted by severity. When all pillars pass, a green 
    "No critical gaps" confirmation is shown.
  </p>

  <h3>2.6 Landed Cost Solver</h3>
  <p>
    <span class="feature-tag tag-api">/api/sandbox/freight</span>
    <span class="feature-tag tag-api">/api/sandbox/tariffs</span>
    <span class="feature-tag tag-api">/api/sandbox/rates</span>
    <span class="feature-tag tag-lib">landed-cost-calculator.ts</span>
  </p>
  <p>
    Interactive cost modeling tool with three sliders — container freight ($1,500–$12,000 CAD), 
    tariff rate (0–35%), and export quantity (500–50,000 units). Calculates landed cost per unit, 
    FX-adjusted margin with currency volatility buffer, and provides a detailed cost breakdown 
    (unit freight, tariff, broker fee, insurance).
  </p>
  <div class="card">
    <h4>Data Pipeline</h4>
    <ul>
      <li>Fetches live market inputs from 3 APIs in parallel (freight, tariffs, FX rates)</li>
      <li>Falls back to structured country data when APIs are unavailable</li>
      <li>FX Buffer calculated from 30-day or 90-day currency volatility</li>
      <li>Data origin indicator: <code>live</code>, <code>mock-fallback</code>, or <code>structured-fallback</code></li>
    </ul>
  </div>

  <div class="screenshot">
    <img src="${img.pillarsLanded}" alt="Pillars Matrix and Landed Cost Solver">
    <div class="screenshot-caption">FIG 4 — Pillar Matrix (9 pillars, all above 65%) and Landed Cost Solver (freight $2,551, tariff 12.8%, landed cost $144.56/unit)</div>
  </div>

  <hr>

  <!-- ═══════════════════ MARGIN VALIDATOR ═══════════════════ -->
  <h3>2.7 Margin Validator</h3>
  <p>
    <span class="feature-tag tag-ui">Pass/Fail Gate</span>
    <span class="feature-tag tag-lib">landed-cost-calculator.ts</span>
  </p>
  <p>
    Profitability gate with three validation checks: (1) unit price covers landed cost, 
    (2) meets target profit margin, (3) FX volatility buffer applied. Displays pass/fail 
    status per check and an aggregate badge.
  </p>

  <div class="screenshot">
    <img src="${img.gapsMargin}" alt="Critical Gaps and Margin Validator">
    <div class="screenshot-caption">FIG 5 — Critical Gap Analyzer ("No critical gaps") and Margin Validator (needs review — target 35% vs FX-adjusted 23.5%)</div>
  </div>

  <hr>

  <!-- ═══════════════════ ADVISOR NOTES + ROADMAP ═══════════════════ -->
  <h3>2.8 Advisor Notes Panel</h3>
  <p>
    <span class="feature-tag tag-api">/api/advisor-notes</span>
    <span class="feature-tag tag-ui">Auto-Save</span>
  </p>
  <p>
    Organized by nine pillar tabs, advisors can write free-form notes per pillar. Notes are 
    auto-saved with a 700ms debounce via <code>PUT /api/advisor-notes</code>, with a timestamp 
    confirmation display.
  </p>

  <h3>2.9 Export Roadmap Timeline (30/60/90)</h3>
  <p>
    <span class="feature-tag tag-lib">@dnd-kit/core</span>
    <span class="feature-tag tag-lib">@dnd-kit/sortable</span>
    <span class="feature-tag tag-api">/api/roadmap</span>
  </p>
  <p>
    Three-column Kanban board for 30-day, 60-day, and 90-day export readiness milestones. 
    Cards are drag-and-droppable between and within columns using <code>@dnd-kit</code> with 
    pointer sensor (6px activation). Reordering is persisted via batch <code>PATCH /api/roadmap</code>.
  </p>

  <div class="screenshot">
    <img src="${img.advisorRoadmap}" alt="Advisor Notes and Export Roadmap">
    <div class="screenshot-caption">FIG 6 — Advisor Notes panel (pillar tabs with auto-save) and Export Roadmap 30/60/90 timeline</div>
  </div>

  <hr>

  <!-- ═══════════════════ TRADE INTEL ═══════════════════ -->
  <h3 class="page-break">2.10 Trade Intelligence Dashboard</h3>
  <p>
    <span class="feature-tag tag-lib">recharts v3</span>
    <span class="feature-tag tag-api">/api/sandbox/comtrade</span>
  </p>
  <p>
    UN Comtrade-level trade data within the portal: hero metric showing Total Import Volume 
    with YoY change, a 5-Year Import Trend line chart (2015–2024), Bilateral Market Competitors 
    table (top 10 exporters by market share), and an Import Seasonality bar chart.
  </p>
  <div class="card">
    <h4>Technical</h4>
    <ul>
      <li>Charts: <code>recharts</code> v3 — <code>LineChart</code>, <code>BarChart</code>, <code>ResponsiveContainer</code></li>
      <li>Three parallel API calls: <code>type=summary</code>, <code>type=partners</code>, <code>type=trend</code></li>
      <li>Cache layer via <code>comtrade-cache.ts</code> to reduce API calls</li>
      <li>Auto-formatting: millions ($M) / billions ($B) based on magnitude</li>
    </ul>
  </div>

  <div class="screenshot">
    <img src="${img.tradeMetrics}" alt="Trade Intelligence Metrics">
    <div class="screenshot-caption">FIG 7 — Trade Intelligence: $1.53B total import volume (▼5.6% YoY) with 5-year trend line chart</div>
  </div>

  <div class="screenshot">
    <img src="${img.tradePartners}" alt="Bilateral Market Competitors">
    <div class="screenshot-caption">FIG 8 — Bilateral Market Competitors: Top 10 exporters of HS 4407 to Japan, ranked by market share</div>
  </div>

  <div class="screenshot">
    <img src="${img.tradeSeason}" alt="Import Seasonality and Map">
    <div class="screenshot-caption">FIG 9 — Import Seasonality bar chart and EDC Country Risk Map in the Trade Intel tab</div>
  </div>

  <hr>

  <!-- ═══════════════════ PDF GENERATOR ═══════════════════ -->
  <h3>2.11 PDF Brief Generator</h3>
  <p>
    <span class="feature-tag tag-lib">puppeteer v25</span>
    <span class="feature-tag tag-api">/api/report/pdf</span>
  </p>
  <p>
    One-click PDF generation via the "Download PDF Brief" button. Uses server-side headless 
    Chrome (Puppeteer) to render the report as a professional PDF. Downloads as 
    <code>export-readiness-&lt;id&gt;.pdf</code> with error handling and loading states.
  </p>

  <hr>

  <!-- ═══════════════════ LANDED COST TAB ═══════════════════ -->
  <h3>2.12 Landed Cost Tab (Dedicated View)</h3>
  <p>
    A focused tab layout pairing an expanded Landed Cost Solver (8-column span) with the 
    Margin Validator (4-column span), followed by the full Readiness Scorecard including 
    Score Gauge, Pillars Matrix, Critical Gaps, and AI Advisory Summary.
  </p>

  <div class="screenshot">
    <img src="${img.landedCostTab}" alt="Landed Cost Tab">
    <div class="screenshot-caption">FIG 10 — Dedicated Landed Cost tab with expanded solver, margin validator, scorecard, and AI advisory summary</div>
  </div>

  <hr>

  <!-- ═══════════════════ TECH STACK ═══════════════════ -->
  <h2>3. Tech Stack Summary</h2>

  <h3>Frontend</h3>
  <table>
    <tr><th>Layer</th><th>Technology</th><th>Version</th></tr>
    <tr><td>Framework</td><td>Next.js (App Router)</td><td>15.5.20</td></tr>
    <tr><td>Runtime</td><td>React</td><td>19.1.0</td></tr>
    <tr><td>Language</td><td>TypeScript</td><td>5.x</td></tr>
    <tr><td>Bundler</td><td>Turbopack</td><td>built-in</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS + custom CSS variables</td><td>3.4.17</td></tr>
    <tr><td>Typography</td><td>Outfit + JetBrains Mono (Google Fonts)</td><td>—</td></tr>
    <tr><td>Icons</td><td>Lucide React</td><td>1.24.0</td></tr>
  </table>

  <h3>Visualization & Interaction</h3>
  <table>
    <tr><th>Purpose</th><th>Library</th><th>Usage</th></tr>
    <tr><td>Charts</td><td><code>recharts</code> v3.9</td><td>Line charts, bar charts, tooltips</td></tr>
    <tr><td>Geo Map</td><td><code>@visx/geo</code> v4</td><td>Mercator world projection</td></tr>
    <tr><td>Map Zoom</td><td><code>@visx/zoom</code> v4</td><td>Pan/zoom/reset controls</td></tr>
    <tr><td>Topology</td><td><code>topojson-client</code> v3</td><td>TopoJSON → GeoJSON parsing</td></tr>
    <tr><td>Animation</td><td><code>motion</code> v12.42</td><td>Spring transitions, layout animations</td></tr>
    <tr><td>Drag & Drop</td><td><code>@dnd-kit</code> v6+v10</td><td>Roadmap kanban board</td></tr>
  </table>

  <h3>Backend & Data</h3>
  <table>
    <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
    <tr><td>Database</td><td>Supabase</td><td>SMEs, assessments, notes persistence</td></tr>
    <tr><td>AI</td><td>Google Generative AI (Gemini)</td><td>AI advisory summaries</td></tr>
    <tr><td>PDF</td><td>Puppeteer v25</td><td>Server-side PDF rendering</td></tr>
    <tr><td>Validation</td><td>Zod v4</td><td>Schema validation</td></tr>
    <tr><td>Fallback DB</td><td>CSV-DB / In-Memory Store</td><td>Offline data layer</td></tr>
  </table>

  <h3>External Data Sources</h3>
  <table>
    <tr><th>Source</th><th>Data</th></tr>
    <tr><td>UN Comtrade</td><td>Import volumes, bilateral partners, multi-year trends</td></tr>
    <tr><td>Tariff DB</td><td>HS code tariff rates by country</td></tr>
    <tr><td>Freight Rates</td><td>Container shipping rates by route</td></tr>
    <tr><td>FX Rates</td><td>Exchange rates + 30d/90d volatility</td></tr>
    <tr><td>SEMA / CSL</td><td>Sanctions entity screening</td></tr>
    <tr><td>EDC Risk</td><td>28 country risk classifications</td></tr>
  </table>

  <hr>

  <div class="card" style="text-align:center; margin-top:48px;">
    <p style="font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.08em; color:var(--text-muted);">
      GENERATED FROM LIVE APPLICATION · LOCALHOST:3000 · 12 SCREENSHOTS · JULY 2026
    </p>
  </div>

</div>
</body>
</html>`;

console.log('Launching Puppeteer...');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

await page.pdf({
  path: OUT_PDF,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
  displayHeaderFooter: false,
  preferCSSPageSize: false,
});

await browser.close();
console.log(`✓ PDF saved to: ${OUT_PDF}`);
