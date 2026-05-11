# AI Workflow Rules

## Approach

Build Cline incrementally using a spec-driven workflow. The context files define what to build, how it behaves, what is out of scope, and what decisions are already locked.

Before implementation, read:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/domain-model.md`
4. `context/ui-context.md`
5. `context/code-standards.md`
6. `context/progress-tracker.md`

## Product Guardrails

- Cline is not a generic expense dashboard.
- Cline is not a Ramp clone.
- Cline is not a chatbot with payments attached.
- Cline is an AI-assisted spend authorization and disbursement product for Nigerian SMEs.
- The key demo story is: evidence enters, Cline verifies, admin decides, Squad moves money, audit trail closes.

## Non-Negotiables

1. No auto-approval in MVP.
2. No AI-initiated transfers.
3. No transfer without Super Admin approval.
4. Trust Scores must be explainable.
5. Squad integration must be meaningful.
6. Appwrite is backend-of-record.
7. Dark mode is out of scope.
8. Department Head and Field Employee are mobile-only experiences for MVP.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over broad speculative changes.
- Do not combine unrelated system boundaries in one implementation step.
- If a change touches payments, ledger, permissions, and UI at once, split it.
- If a requirement is missing, add it to `progress-tracker.md` before implementing.
- If the implementation changes architecture, update `architecture.md` or `domain-model.md`.
- If the implementation changes visual language, update `ui-context.md`.

## When to Split Work

Split an implementation step if it combines:

- UI and payment provider integration.
- AI extraction and transfer execution.
- Auth setup and scoring logic.
- Ledger calculations and dashboard polish.
- Webhook processing and Frank chat behavior.
- Multiple unrelated request types.

If a change cannot be verified end to end quickly, the scope is too broad.

## Recommended Build Order

1. Project scaffold and design tokens.
2. Appwrite auth/session foundation.
3. Organization onboarding and seeded demo data.
4. Role-specific shells and navigation.
5. Request submission without AI.
6. File upload and metadata.
7. Squad account lookup.
8. Gemini extraction.
9. Deterministic Trust Score.
10. Admin approval queue and detail page.
11. Internal ledger and wallet balance.
12. Squad transfer/requery/webhook.
13. Field proof upload and reconciliation.
14. Frank chat with query tools.
15. Proactive alerts and Resend email.
16. Reports/export and demo polish.

## Verification Checklist Per Unit

Before moving on:

1. The unit works for the intended role.
2. Server-side authorization exists for any private data or mutation.
3. Important state changes create audit events where applicable.
4. TypeScript passes.
5. The context files still match the implementation.
6. `progress-tracker.md` is updated.

## Handling AI Features

- Use Gemini structured outputs for extraction.
- Validate every structured output.
- Store confidence and raw extracted data.
- Let deterministic code calculate scores.
- Frank must answer from server-side tool results.
- AI uncertainty should be visible to the admin.

## Handling Payments

- Start with Squad sandbox.
- Build provider clients behind stable internal interfaces.
- Keep transfer state transitions explicit.
- Make webhook handlers idempotent.
- Requery uncertain transfers.
- Use manual retry only.

## Handling UI

- Admin desktop screens should be dense, calm, and operational.
- Department Head and Field Employee screens should be mobile-only and bottom-nav based.
- Before implementing a UI primitive, check whether shadcn has it.
- Add only the shadcn component required for the current feature.
- Do not add a landing page unless explicitly requested.
- Do not add dark mode.
- Do not add decorative gradients, blobs, or marketing hero sections.

## Protected Files

- Do not manually rewrite generated shadcn/ui primitives unless the change is necessary and documented.
- Do not edit provider SDK internals.
- Do not remove context decisions without updating `progress-tracker.md` session notes.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries.
- Data model decisions.
- Payment flow behavior.
- AI scoring behavior.
- Visual design tokens or navigation.
- Feature scope.

Always update `progress-tracker.md` after meaningful implementation changes.
