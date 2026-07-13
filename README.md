# Trade Agency Sandbox Portal (Mercorama Clone)

A full-stack advisory intelligence platform designed for Canadian export trade agencies. This portal enables trade advisors to manage a portfolio of Small and Medium-sized Enterprises (SMEs), assess their export readiness, calculate landed costs, and provide actionable intelligence on target markets—all in a premium, responsive workspace.

## ✨ Key Features

- **Portfolio Dashboard:** Track SME clients, aggregate readiness scores, and pending assessments in a clean, bento-grid layout.
- **Readiness Scorecard:** A 9-pillar assessment matrix that identifies critical gaps and assigns export readiness grades.
- **Interactive Risk Maps:** Built with `@visx/geo`, visualizing Export Development Canada (EDC) risk tiers with animated shipping lanes.
- **Landed Cost & Margin Validator:** A real-time solver using UN Comtrade and simulated freight/tariff APIs to model container costs, FX buffers, and target margins.
- **Trade Intelligence:** Market research dashboards with 5-year trends, competitor analysis, and import seasonality charts powered by `recharts`.
- **Advisor Roadmap:** Drag-and-drop 30/60/90-day export action plans using `@dnd-kit`.
- **PDF Generation:** One-click automated report generation using Puppeteer.
- **Premium Aesthetics:** Dark-first UI featuring smooth Framer Motion animations and custom CSS design tokens.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (used for package management)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Amith-S28/Mercorama-Clone.git
cd Mercorama-Clone
pnpm install
```

### 3. Environment Variables
To get the application fully functional, ensure you have a `.env.local` file configured. The app utilizes Supabase for the database layer alongside in-memory/CSV fallbacks.
Create a `.env.local` file in the root directory and add the necessary environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Other required keys...
```

### 4. Running the Development Server
Start the Next.js Turbopack development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
Navigate to `/sandbox/agency` to access the main dashboard.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom CSS variables
- **Database:** Supabase (PostgreSQL) + local CSV fallback stores
- **Visualizations:** `@visx/geo`, `recharts`, Framer Motion
- **Tooling:** Puppeteer (PDFs), Zod (Validation), dnd-kit (Drag & Drop)

## 📄 Documentation

For a deep dive into the application's components, technical decisions, and a visual walkthrough of all features, refer to the included feature report:
- [Trade Agency Feature Report (PDF)](./Trade_Agency_Feature_Report.pdf)
- [Application Features Breakdown (Markdown)](./app_features_report.md)
