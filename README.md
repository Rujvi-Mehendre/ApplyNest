# ApplyNest 🐣

A manual-first graduate school application tracker with an AI-ready extraction architecture.
Built to work immediately with manual entry and designed to grow with real AI extraction later.

## AI Extraction Setup

To use the "Extract from text" feature, add these to your `.env.local`:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o          # gpt-4o, gpt-4-turbo, or any OpenAI-compatible model
OPENAI_BASE_URL=             # optional — set to use a different API endpoint
```

**How it works:** Open a saved program → Requirements or Essays tab → "Extract from text" → paste admissions text → AI extracts structured items → you review and save selected items. Nothing is saved automatically.

**Phase boundary:** This phase supports pasted text only. URL scraping and automatic program discovery are future work.

**Supported models:** Any OpenAI-compatible API endpoint (set `OPENAI_BASE_URL` to use Anthropic, Mistral, or a local model via a proxy).

---

## Quick Start

```bash
cd applynest
npm install
cp .env.local.example .env.local   # fill in your Supabase values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **anon/public key**
3. Paste into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. In the Supabase dashboard → **SQL Editor**, run migrations in order:
   - `supabase/migrations/001_initial_schema.sql` — tables, RLS, seed programs
   - `supabase/migrations/002_add_program_details.sql` — priority, delivery mode, app fee
   - `supabase/migrations/003_ai_architecture.sql` — extraction metadata, prompt_evidence table
   - `supabase/migrations/004_ai_extraction.sql` — AI extraction run logs and item staging
5. Enable **Email Auth** in Authentication → Providers → Email

---

## Features

| Feature | Status |
|---|---|
| Applicant Profile | ✅ |
| Add Programs (Reach / Target / Safer) | ✅ |
| Program Requirements tracking | ✅ |
| Essay Prompt tracking | ✅ |
| Add portal prompt (portal_entered source type) | ✅ |
| Upload prompt evidence (screenshot/PDF) | 🔜 Supabase bucket required |
| Source badges (5 types + confidence tiers) | ✅ |
| Extraction method badges | ✅ |
| Review Queue (low-confidence, missing, stale) | ✅ |
| Similar Prompts grouping (mock AI) | ✅ |
| Workload Planner (mock AI) | ✅ |
| Essay Status tracking (6 stages) | ✅ |
| Program Fit Score (mock AI) | ✅ |
| Global Essay / Requirements dashboards | ✅ |
| Application Dashboard with deadlines | ✅ |
| Export (CSV with source fields) | ✅ |
| Notes per program | ✅ |
| Real AI extraction | 🔜 Swap providers in `lib/providers/index.ts` |
| Email notifications | 🔜 |

---

## Project Structure

```
app/
  landing/            Marketing landing page
  login/ signup/      Supabase email auth
  dashboard/          Application overview + stats
  programs/           Programs list, add, edit
  programs/[id]/      Program detail — 5 tabs (Requirements, Essays, Fit, Notes)
  essays/             Global essay dashboard
  essays/similar/     Similar Prompts — grouped by theme for reuse
  requirements/       Global requirements dashboard
  review/             Review Queue — low-confidence, missing, stale items
  workload/           Workload Planner — stats, weekly plan, effort breakdown
  profile/            Applicant profile + resume parser
  settings/           Account settings

lib/
  supabase/           Client, server, types, cast helpers
  ai/mock-ai.ts       Mock AI (score, detect, workload) — delegate to providers when ready
  providers/
    interfaces.ts     6 provider interfaces (TypeScript contracts)
    types.ts          Shared result/input types
    index.ts          getProviders() factory — swap here to add real implementations
    mock/             6 mock implementations (realistic data, no API calls)

components/
  essays/
    PortalPromptDialog.tsx    Capture prompts from application portals
    SimilarPromptsClient.tsx  Card grid of prompt groups
  review/
    ReviewQueueClient.tsx     Collapsible review groups
    ReviewItemCard.tsx        Per-item inline edit (source URL, verify, mark N/A)
  shared/
    StatusChip.tsx            ConfidenceBadge (5 tiers), ExtractionMethodBadge, SourceBadge

supabase/
  migrations/         Full SQL schema + seed data
```

---

## Provider Architecture

All AI-backed features are behind provider interfaces. Mock implementations return realistic data immediately — no API calls needed.

```
lib/providers/interfaces.ts  — 6 TypeScript interfaces (the contracts)
lib/providers/index.ts       — getProviders() factory (the swap point)
lib/providers/mock/          — 6 mock classes (current implementations)
```

### 6 Providers

| Provider | Purpose |
|---|---|
| `ProgramDiscoveryProvider` | Search + rank programs by applicant profile |
| `RequirementExtractionProvider` | Extract requirements from official pages |
| `EssayExtractionProvider` | Extract essay prompts + classify type |
| `SourceVerificationProvider` | Score source trustworthiness |
| `FitScoringProvider` | GPA/research/experience fit scoring |
| `EssaySimilarityProvider` | Group similar prompts, suggest reusable drafts |

### Adding a Real Provider

1. Create `lib/providers/real/<name>.ts` implementing the interface from `interfaces.ts`
2. Import and swap in `lib/providers/index.ts`:
   ```typescript
   import { ClaudeFitScoringProvider } from "./real/fit-scoring"
   
   export function getProviders() {
     return {
       // ...other mocks...
       fitScoring: new ClaudeFitScoringProvider(process.env.ANTHROPIC_API_KEY!),
     }
   }
   ```
3. Set env vars

Recommended models: `claude-sonnet-4-6` for scoring/extraction, semantic embeddings for similarity grouping.

---

## Source Confidence Model

Every requirement and essay tracks source quality with these tiers:

| Score | Label | Meaning |
|---|---|---|
| 0.90–1.00 | Verified | Official admissions page, direct requirement |
| 0.75–0.89 | Official (indirect) | Official page, related but indirect |
| 0.50–0.74 | Unverified | Unofficial source or unclear wording |
| 0.25–0.49 | Inferred | Inferred, no direct source |
| < 0.25 | Unknown | No source |

Source types: `official` · `user_entered` · `portal_only` · `scraped` · `portal_entered` · `unknown`

Extraction methods: `manual` · `ai_extracted` · `url_scrape` · `portal_entered` · `imported`

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `cream` | `#EEE7E2` | Background |
| `sand` | `#D0B993` | Borders, muted |
| `copper` | `#BB8158` | Primary buttons |
| `sienna` | `#9B6B4A` | Hover, body text |
| `rust` | `#6D3932` | Headings, sidebar |
| `olive` | `#515035` | Success, verified |
# ApplyNest
