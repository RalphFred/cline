# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 0 complete.
- Phase 1 foundation started.

## Current Goal

- Establish the Next.js, Tailwind, shadcn/ui, and provider foundation before feature implementation.

## Completed

- Defined Cline as a spend authorization and disbursement platform for Nigerian SMEs.
- Locked final product name: Cline.
- Locked target market: SMEs/businesses.
- Locked first demo organization: Express Travels.
- Locked MVP roles:
  - Super Admin
  - Department Head
  - Field Employee
- Locked two MVP request types:
  - Vendor Invoice Payment
  - Field Cash Request
- Locked no-auto-approval rule.
- Locked Appwrite as backend-of-record.
- Locked stack:
  - Next.js
  - TypeScript
  - Tailwind
  - shadcn/ui
  - Appwrite
  - Squad
  - Gemini
  - Resend
- Locked Squad architecture:
  - virtual account for inbound master wallet funding
  - account lookup for recipient verification
  - transfer API for outbound payouts
  - webhook/requery for confirmation
- Locked deterministic rules-first AI architecture.
- Locked Gemini as LLM/extraction provider.
- Locked Frank as read-only AI CFO assistant.
- Locked Frank alert channels:
  - chat
  - dashboard badge/feed
  - email
- Locked monthly department budgets as planning signals, not hard limits.
- Locked vendor records with normal/watchlist/blocked statuses.
- Locked Appwrite Storage buckets:
  - invoices
  - proofs
  - org-documents
- Locked Resend for email.
- Locked UI direction:
  - light-only
  - simplified Squad-inspired palette
  - admin desktop-first responsive
  - Department Head and Field Employee mobile-only
- Added `context/domain-model.md`.
- Updated `AGENT.md` reading order to include domain model.
- Scaffolded the Next.js App Router project with TypeScript, Tailwind, and pnpm.
- Initialized shadcn/ui and added only baseline primitives needed for early setup.
- Added Lucide, Appwrite, Gemini SDK, Resend, Zod, React Hook Form, date-fns, Sonner, and utility dependencies.
- Wired Cline light theme tokens into `src/app/globals.css`.
- Added root app providers for Tooltip and Sonner.
- Added Appwrite web SDK client for project `cline`.
- Removed the temporary automatic Appwrite `client.ping()` check from app load.
- Added initial `/`, `/admin`, and `/mobile` scaffold pages.
- Added `.env.example`.
- Added initial domain code folders and boundary READMEs under `src/lib` and `src/components`.
- Updated UI/code workflow docs to require checking shadcn before implementing UI primitives.
- Verified TypeScript and ESLint pass.
- Verified production build passes outside sandbox.

## In Progress

- Package manager cleanup: `package.json` has removed unused shadcn/next-themes runtime entries, but `pnpm-lock.yaml` should be normalized by running `pnpm install` after resolving the local pnpm store mismatch.

## Next Up

1. Normalize pnpm lockfile with `pnpm install`.
2. Configure Appwrite client/server helpers and environment schema.
3. Implement auth/session shell.
4. Build organization onboarding.
5. Seed Express Travels demo organization and role-specific users.

## Open Questions

These are not blockers for scaffolding, but should be resolved before the affected phase:

1. Exact Appwrite project/database/collection IDs and whether they will be created manually or scripted.
2. Whether Squad sandbox credentials and Merchant ID are already available.
3. Whether Gemini API key is available and which Gemini model to use initially.
4. Whether Resend domain is configured or MVP email should use a sandbox sender.
5. Exact proof deadline default: recommended default is 24 hours.
6. Exact high-value threshold default: recommended demo default is ₦500,000.
7. Whether Appwrite Functions will be used later for scheduled jobs or all cron-like work will stay external for MVP.

## Architecture Decisions

### Backend of Record

Appwrite is the backend-of-record for auth, database, storage, and realtime. Next.js owns orchestration and all secret-bearing provider calls.

### Money Movement

Squad is the payment rail. Inbound funding uses virtual accounts. Outbound transfers use Transfer API. Cline keeps an internal append-only ledger that mirrors Squad activity.

### Approval

No request can be auto-approved. The Trust Score is informational and all submitted requests go to the Super Admin.

### AI

Gemini can extract, summarize, and answer via Frank. Gemini cannot approve, reject, change records, or initiate transfers. Scores are deterministic and explainable.

### UI

Light mode only. The design uses a stripped-down Squad-inspired fintech palette. Admin is desktop-first and responsive. Department Head and Field Employee are mobile-only for MVP.

## Session Notes

- The original repo was a placeholder context template.
- The product was refined through a 50-question grill session.
- A Claude share about RampX was inspected through the in-app browser and used as background context.
- Final product differs from the earlier RampX framing:
  - name is Cline
  - target is SMEs/businesses
  - no auto-approval
  - budgets are planning signals
  - Frank is included
  - Appwrite is backend-of-record
- The next agent should read all context files before scaffolding code.
