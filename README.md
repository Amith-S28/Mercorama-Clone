<div align="center">
  <img src="./public/mercorama_logo_2026.png" alt="Mercorama Logo" width="250" />

  <br />

  [![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=22&pause=1000&color=10B981&center=true&vCenter=true&width=500&lines=Trade+Agency+Sandbox+Portal;Export+Intelligence+Platform;Built+with+Next.js+%26+React)](https://git.io/typing-svg)

  <p align="center">
    A full-stack advisory intelligence platform designed for Canadian export trade agencies. Manage SME portfolios, assess export readiness, and provide actionable intelligence on target markets.
  </p>

  <p align="center">
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-getting-started">Quick Start</a>
  </p>
</div>

---

## 🛠 Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

## ✨ Key Features

| Feature | Description |
| --- | --- |
| 📊 **Portfolio Dashboard** | Track SME clients, aggregate readiness scores, and pending assessments in a clean, bento-grid layout. |
| 🎯 **Readiness Scorecard** | A 9-pillar assessment matrix that identifies critical gaps and assigns export readiness grades. |
| 🌍 **Interactive Risk Maps** | Built with `@visx/geo`, visualizing Export Development Canada (EDC) risk tiers with animated shipping lanes. |
| 💰 **Landed Cost Validator** | A real-time solver using UN Comtrade and simulated APIs to model container costs and target margins. |
| 📈 **Trade Intelligence** | Market research dashboards with 5-year trends, competitor analysis, and import seasonality charts. |
| 🗺️ **Advisor Roadmap** | Drag-and-drop 30/60/90-day export action plans using `@dnd-kit`. |
| 📄 **PDF Generation** | One-click automated report generation using Puppeteer. |

<br />

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</div>

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (Package manager)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Amith-S28/Mercorama-Clone.git
cd Mercorama-Clone
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the necessary environment variables to connect to Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the App
Start the Next.js Turbopack development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser. Navigate to `/sandbox/agency` to access the main dashboard.

---

## 📄 Documentation

For a deep dive into the application's components, technical decisions, and a visual walkthrough of all features:
- [Trade Agency Feature Report (PDF)](./Trade_Agency_Feature_Report.pdf)
- [Application Features Breakdown (Markdown)](./app_features_report.md)

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
  <br/>
  <i>Built with ✨ premium aesthetics ✨ and smooth Framer Motion animations.</i>
</div>
