# Khatt-GPT — Collaborative Arabic Manuscript Transcription Platform

[![Production](https://img.shields.io/badge/Production-khattgpt.vercel.app-emerald.svg)](https://khattgpt.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1%20App%20Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20RLS-3ECF8E.svg)](https://supabase.com/)
[![TEI-XML](https://img.shields.io/badge/Standard-TEI--XML%20Export-purple.svg)](https://tei-c.org/)

**Live Application:** [https://khattgpt.vercel.app/](https://khattgpt.vercel.app/)

A fullstack collaborative web application designed for crowdsourcing, annotating, curating, and validating historical Arabic and Maghrebi manuscript transcriptions for digital humanities research.

The platform features an automated quality-control pipeline (consensus engine), user roles, interactive segmentation canvas, TEI-XML export, gamification hooks, and real-time database notifications to streamline dataset creation for HTR/OCR research.

---

## 🚀 Key Features

* **Live Digital Humanities Platform:**
  * **Interactive Line Transcription (`/transcribe`):** Segment-level image viewer with high-resolution pan/zoom (`react-medium-image-zoom`) and Arabic text input.
  * **Manuscript Catalog (`/corpus`):** Multi-collection browsing (BnF, Zaytouna, historical archives) with metadata and progress tracking.
  * **Academic Research & Paleography (`/research`):** Methodology documentation, codicology records, and paleographical guide.
  * **Public Proposals Workflow (`/propose`):** Open submission form allowing researchers and users to propose new unstudied manuscripts.

* **Data Quality & Algorithmic Consensus Engine:**
  * Normalized Arabic orthography filter (standardizing letterforms of Alef, removing tatweel and vowel noise).
  * Pairwise Levenshtein distance calculation across concurrent user transcriptions.
  * Automatic validation when consensus crosses threshold (>85%) and conflict flagging for expert review.

* **Standardized Digital Humanities Export (`/api/export`):**
  * Automated streaming of validated datasets into **TEI-XML (Text Encoding Initiative)** format with `<teiHeader>`, `<msDesc>`, and folio line coordinates.
  * Alternative exports to structured JSON and CSV formats for training Vision-Language Models (VLM) and OCR pipelines.

* **Relational Database & Enterprise Security:**
  * Powered by `PostgreSQL` and `Supabase` with strict Row-Level Security (RLS) policies.
  * Server Actions architecture with strict administrative authentication guardrails (`requireAdmin()`, `isAdminEmail()`).

* **Self-Hosted Sovereign Deployment:**
  * Production-ready Docker Compose stack documented for VPS deployment (2 TB storage) via **Coolify** (see [docs/DEPLOIEMENT_COOLIFY_VPS_2TB.md](docs/DEPLOIEMENT_COOLIFY_VPS_2TB.md)).

---

## 🛠️ System Architecture

```mermaid
graph TD
    subgraph Client Layer
        A[Next.js 16 App Router] --> B1[Public Portal: /corpus, /research, /propose]
        A --> B2[Contributor Studio: /transcribe, /dashboard]
        A --> B3[Admin Console: /admin/manuscripts, /admin/conflicts]
    end

    subgraph Data & Backend Layer
        B1 & B2 & B3 --> C[Server Actions & API Routes]
        C --> D[Supabase Client / SSR]
        D --> E[(PostgreSQL with RLS)]
        D --> F[Supabase Storage: Manuscript Images & Folios]
    end

    subgraph Research & Export Pipeline
        E --> G[Consensus Engine: Levenshtein Distance]
        G --> H[Validated Database]
        H --> I[TEI-XML Exporter: /api/export]
        H --> J[JSON / CSV Machine Learning Split]
    end
```

---

## 💻 Tech Stack

* **Frontend:** Next.js 16.1.6 (App Router), React 19.0.0, TypeScript 5, Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion, Zustand 5, Recharts.
* **Backend & Database:** Supabase (PostgreSQL 15), Supabase SSR, Row-Level Security policies, Server Actions.
* **Testing & Quality:** TypeScript Compiler (`tsc --noEmit`), ESLint, Playwright E2E testing.
* **Infrastructure:** Vercel (Cloud Production) and Coolify / Docker Compose (Self-Hosted VPS).

---

## ⚙️ Setup & Local Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:h-yassin-ai/waraka.git
   cd waraka
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file at the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ADMIN_EMAILS=admin@example.com
   ```

4. **Verify TypeScript & Linting:**
   ```bash
   npm run lint
   ```
   *(Expected output: 0 errors)*

5. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
