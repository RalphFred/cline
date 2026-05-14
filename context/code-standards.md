# Code Standards

## General

- Build against the context files. Do not invent product behavior that contradicts them.
- Keep modules small and single-purpose.
- Prefer explicit domain language: sale, incoming payment, payment request, risk evaluation, ledger entry, alert, audit event.
- Fix root causes instead of layering workarounds.
- Do not mix unrelated concerns in one component, route, or server action.
- Use deterministic logic for money movement, scoring, permissions, and state transitions.
- Treat all external input as untrusted.

## TypeScript

- Strict mode is required.
- Avoid `any`. Use explicit interfaces, discriminated unions, or `unknown` with validation.
- Model request types and statuses as typed unions.
- Use kobo for stored money values.
- Use typed wrappers for external API responses.
- Validate all unknown data with Zod before using it.

## Next.js

- Use App Router.
- Prefer server components for read-heavy pages.
- Add `use client` only where browser interactivity requires it.
- Keep route handlers focused on one responsibility.
- Put secret-bearing operations in server routes/actions only.
- Do not call Squad, Gemini, Resend, or Appwrite admin APIs from client components.
- Co-locate feature UI where helpful, but keep shared domain logic in `lib/`.

## Appwrite

- Use Appwrite as backend-of-record for auth, database, storage, and realtime.
- Keep collection IDs and bucket IDs centralized.
- Enforce application authorization in server code, even when Appwrite permissions also exist.
- Store file bytes in Appwrite Storage and metadata in Appwrite Databases.
- Store immutable/audit-like records as append-only in application workflows.
- Use Appwrite Realtime only for high-value UI updates:
  - new request submitted
  - request status changed
  - Frank alert created
  - transfer status updated
  - proof uploaded

## Security

- Never expose provider secrets to the browser.
- Validate auth and role before every mutation.
- Validate organization ownership before every read that contains private data.
- Webhooks must be idempotent.
- Payment actions must be protected against duplicate submissions.
- File uploads must validate MIME type, size, ownership, and purpose.
- Do not trust file extensions.
- Do not log secrets, raw API keys, or private tokens.

## Payments and Ledger

- No transfer occurs without a Super Admin approval audit event.
- Every transfer must have a unique reference that includes Squad Merchant ID.
- Transfer amounts sent to Squad are in kobo.
- Do not retry a Squad transfer with the same reference.
- If transfer status is uncertain, requery before retry.
- Wallet balance is derived from ledger entries, never manually edited.
- Ledger entries are append-only.
- Insufficient wallet balance blocks approval/transfer.
- Failed transfers release reservations through ledger entries.

## AI and Verification

- Gemini can explain, summarize, and answer questions from structured data.
- Gemini cannot approve, reject, edit records, change budgets, modify vendor status, or initiate transfers.
- Risk scoring and reconciliation logic must remain inspectable and deterministic at the orchestration layer, even when model outputs are included.
- Store model outputs, rule outputs, and explanation inputs for every important evaluation.
- Validate any AI-generated structured content before persistence.
- Low-confidence AI output should become a flag, not a silent failure.
- Frank must use server-side query tools; do not dump the full database into prompts.

## API Routes and Server Actions

- Parse and validate request input before any business logic.
- Enforce auth and organization access before mutations.
- Return consistent response shapes.
- Create audit events for important state changes.
- Keep external provider clients isolated behind `lib/*` modules.
- Normalize provider errors into user-safe messages.
- Preserve raw provider payloads where audit needs them.

## Styling

- Use tokens from `ui-context.md`.
- No hardcoded hex values in components.
- Check shadcn before implementing any UI primitive.
- Use shadcn/ui primitives whenever an appropriate component exists.
- Add shadcn components one at a time as features need them; do not bulk-install the whole registry.
- Compose product-specific components from shadcn primitives plus Cline tokens.
- Use Lucide icons for common actions.
- Do not create dark mode in MVP.
- Avoid nested cards.
- Keep admin screens scan-friendly and mobile flows touch-friendly.

## Data and Storage

- Metadata belongs in Appwrite Databases.
- Large files belong in Appwrite Storage.
- Store money as integer kobo values.
- Store timestamps in ISO-compatible formats.
- Store provider references exactly as returned.
- Keep hash fields for duplicate file checks.
- Avoid deleting records that affect audit trails; prefer status changes.

## File Organization

- `app/(auth)/` — sign in/up and auth pages.
- `app/(admin)/` — Super Admin desktop-first surfaces.
- `app/(mobile)/` — Department Head and Field Employee mobile-first surfaces.
- `app/api/squad/*` — Squad webhook/requery routes.
- `app/api/frank/*` — Frank chat/query endpoints.
- `components/features/*` — feature-specific UI.
- `components/ui/*` — shadcn/ui primitives.
- `lib/appwrite/*` — Appwrite setup and helpers.
- `lib/squad/*` — Squad client and DTOs.
- `lib/gemini/*` — Gemini prompts and structured output helpers.
- `lib/verification/*` — deterministic rules, reconciliation checks, and score assembly.
- `lib/ml/*` — model loading, feature mapping, and inference helpers.
- `lib/ledger/*` — ledger and balance logic.
- `lib/audit/*` — audit helpers.
- `lib/permissions/*` — auth and role checks.
- `lib/email/*` — Resend helpers.

## Testing and Verification

- Add focused tests for scoring logic, ledger calculations, status transitions, and provider response parsing.
- Run typecheck before considering a phase complete.
- Run build before moving between major implementation phases.
- Verify critical UI flows in browser after frontend work.
- Seed data should support repeatable demo scenarios.
