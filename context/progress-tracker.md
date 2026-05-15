# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Context reset complete.
- Database contract reset complete.
- Sales Operator live counter slice active.
- Field Employee outgoing request creation slice active.
- Super Admin outgoing approval workspace slice active.
- Super Admin admin workspace split into focused desktop pages.

## Current Goal

- Finish the live demo flows on top of the applied finance operating system Appwrite schema, with money-in creation/reconciliation and money-out request/approval/proof paths connected through real records.

## Completed

- Reframed Cline from a spend authorization product into a broader finance operating system for Nigerian SMEs.
- Locked the product around a demo-first scope instead of full platform breadth.
- Locked the product center for money-in as `sale`.
- Locked sale types:
  - `inventory_sale`
  - `service_sale`
  - `manual_sale`
- Moved invoice-first money-in out of the core phase scope.
- Locked incoming payment source types:
  - `bank_transfer`
  - `pos_payment`
  - `cash`
  - `manual_record`
- Locked inventory as a real lightweight stock layer.
- Locked inventory behavior:
  - only `inventory_sale` affects stock
  - `service_sale` does not affect stock
  - `manual_sale` does not affect stock
- Removed branches from scope.
- Kept departments only for money-out context.
- Replaced spend-request-first framing with typed `payment_request` for money-out.
- Locked outgoing request types:
  - `vendor_payment`
  - `staff_cash_request`
  - `airtime_data_request`
  - `utility_payment`
  - `manual_business_expense`
- Reconfirmed no auto-approval and human-in-the-loop final authority.
- Locked the demo roles:
  - `super_admin`
  - `sales_operator`
  - `field_employee`
- Locked `sales_operator` as able to create all three sale types.
- Locked simple sale statuses:
  - `pending_payment`
  - `paid`
  - `mismatch_flagged`
- Locked the main flagged money-in story:
  - sale exists
  - stock drops
  - no matching payment is recorded or payment is inconsistent
- Locked Frank as part of the product.
- Locked Frank responsibilities:
  - transaction explanation
  - business Q&A
  - system summary
  - anomaly surfacing
- Locked Frank UI presence:
  - chat
  - alerts/feed
  - inline explanations
- Locked Frank business Q&A as query-tool based.
- Locked the hero Frank question:
  - "Why was this transaction flagged?"
- Locked the secondary Frank question:
  - "What was our revenue last month?"
- Locked the AI/training story:
  - training happens beforehand
  - data is synthetic but realistic
  - trained artifacts are lightweight
  - model output is risk/anomaly scoring only
- Locked model families to mention and train:
  - `Isolation Forest`
  - `XGBoost` or `LightGBM`
- Locked the live demo flows:
  - `clean_pos_sale_flow`
  - `inventory_mismatch_flow`
  - `vendor_payment_flow`
  - `staff_cash_request_flow`
  - `transaction_explanation_flow`
  - `business_qa_flow`
- Rewrote the context set to reflect the new product scope:
  - `context/project-overview.md`
  - `context/domain-model.md`
  - `context/architecture.md`
  - `context/ai-workflow-rules.md`
  - `context/ui-context.md`
  - `context/progress-tracker.md`

## In Progress

- Converting the remaining implementation plan and codebase assumptions from the old spend-only shape to the new demo-driven finance OS shape.
- Extending the live sales flow into full mismatch investigation, Frank explanation, and outgoing-request demo paths.

## Newly Completed

- Replaced the old spend-era Appwrite collection ID contract with finance OS collection IDs for:
  - organizations
  - user profiles
  - org members
  - departments
  - vendors
  - inventory items
  - stock movements
  - sales
  - sale lines
  - incoming payments
  - reconciliation events
  - payment requests
  - request evidence
  - approval decisions
  - risk evaluations
  - model scores
  - rule results
  - transfers
  - ledger entries
  - webhook events
  - audit events
  - alerts
  - Frank threads
  - Frank messages
  - training dataset runs
- Replaced the old bucket assumptions with finance OS storage buckets for:
  - request evidence
  - organization documents
  - training artifacts
- Added a typed Appwrite schema registry in `src/lib/appwrite/schema.ts`.
- Added a server-side Appwrite schema sync utility in `src/lib/appwrite/sync.ts` that can create collections, attributes, relationships, and indexes from the schema registry.
- Executed the Appwrite schema sync successfully against the live `cline` database.
- Verified live finance OS collections now exist in Appwrite, including:
  - `inventory-items`
  - `stock-movements`
  - `sales`
  - `sale-lines`
  - `incoming-payments`
  - `reconciliation-events`
  - `risk-evaluations`
  - `model-scores`
  - `rule-results`
  - `training-dataset-runs`
- Added `sales_operator` to the application role union so the role model now matches the locked product scope.
- Added a shared seeded demo workspace module for finance OS shell data and role-specific mobile assumptions.
- Rewrote the home page to present the finance operating system story and the six locked demo flows.
- Reworked the Super Admin shell into a finance command center preview with:
  - revenue snapshot
  - money-in health
  - flagged transaction preview
  - outgoing request queue preview
  - recent activity
  - Frank insights
- Reworked the mobile shell into a role-aware preview driven by the `role` query parameter for:
  - `sales_operator`
  - `field_employee`
  - `super_admin`
- Updated sign-in and metadata copy so the app shell now reflects the finance OS positioning end to end.
- Added inventory foundation modules for:
  - typed inventory item and stock movement records
  - Zod-backed inventory and movement schemas
  - low-stock state evaluation
  - stock-in and adjustment movement builders
  - deterministic inventory sale stock reduction and validation helpers
- Added a sales domain layer for:
  - typed sale, payment-source, and sale-line contracts
  - Zod-backed sale creation validation
  - deterministic sale draft building across inventory, service, and manual sales
- Added a server-side demo workspace bootstrap that:
  - creates the canonical Crestview demo organization on demand
  - creates the signed-in user profile and active organization membership on demand
  - seeds demo inventory items when the workspace has none yet
- Added the first live sales creation screen for the Sales Operator flow that:
  - uses the sales domain layer for `inventory_sale`, `service_sale`, and `manual_sale` draft validation
  - currently presents an inventory-sale focused counter UI
  - shows seeded inventory posture and recent sales beside the form
  - creates Appwrite sale and sale-line records through a server action
  - reduces inventory stock and writes append-only stock movements for `inventory_sale`
- Linked the new sales flow from the Sales Operator mobile shell and the Super Admin command center.
- Fixed sign-in by replacing the broken Appwrite session URL construction with explicit `/v1` endpoint paths.
- Added a Super Admin demo sign-in action that creates a server-side Appwrite session for the seeded `cline-super-admin` user and stores the returned session secret in the app cookie.
- Added a visible `Continue as Super Admin` path on `/sign-in` so the live demo does not depend on guessed credentials.
- Replaced the one-role demo shortcut with role-specific sign-in buttons for:
  - `super_admin`
  - `sales_operator`
  - `field_employee`
- Added shared demo account metadata so each role button creates the matching Appwrite user session and redirects to the right demo surface.
- Preserved demo workspace membership roles when bootstrapping workspace records for non-admin demo users.
- Simplified the auth page into a focused modern sign-in panel with:
  - compact demo role buttons
  - the email/password form
  - minimal status and navigation text
- Trimmed demo role buttons to show only role names and icons.
- Improved sign-in control sizing and polish:
  - larger role buttons
  - taller email/password inputs
  - stronger primary continue button
  - cleaner sign-in card background and spacing
- Moved sign-in error and signed-out states from inline boxes to Sonner/shadcn toast feedback.
- Mounted the shared app toaster before page children so route-level toast effects are reliable throughout the app.
- Verified the schema-contract refactor with a passing `pnpm typecheck`.
- Verified the sale-creation slice with passing `pnpm typecheck` and `pnpm build`.
- Verified the demo sign-in path in the browser at `http://localhost:3000/sign-in`, including redirect to `/admin`.
- Verified the Sales Operator role button in the browser, including redirect to the sales flow.
- Verified the simplified auth page in the browser and checked the Field Employee button redirect to `/mobile?role=field_employee`.
- Verified sign-in error and signed-out URL states in the browser using toast notifications.
- Added Squad POS Remote Request support for the clean POS sale flow with:
  - server-only POS request creation
  - server-only POS requery
  - sandbox/demo simulation fallback when Squad credentials or terminal ID are not configured
  - typed parsing of Squad success, pending, failed, and expired responses
- Extended the `sales` schema and live Appwrite database with POS request metadata:
  - `posRequestReference`
  - `posTerminalId`
  - `posRequestStatus`
  - `posRequestedAt`
  - `posConfirmedAt`
- Updated sale creation so POS-expected sales automatically generate a POS payment request and audit event.
- Added sale flow actions for:
  - creating a missing POS request
  - confirming/requerying a POS payment
  - flagging missing POS payment
- Added reconciliation persistence for confirmed POS payments:
  - `incoming-payments`
  - `reconciliation-events`
  - `ledger-entries`
  - `audit-events`
  - mismatch `alerts` where amounts do not match
- Upgraded the sales counter recent-sales table with POS request state, confirm/flag controls, and paid/flagged status feedback.
- Upgraded `/admin` to read live Appwrite money-in state for expected revenue, matched POS collections, pending counts, flagged counts, flagged sale details, and audit activity.
- Re-ran Appwrite schema sync successfully after the POS metadata additions.
- Verified the clean POS sale implementation with passing `pnpm typecheck` and `pnpm build`.
- Cleaned the sales creation screen into a tighter cashier-style POS surface by removing redundant instructional copy, shortening labels, tightening cards, and keeping only the sale form, stock state, recent sales, and POS actions visible.
- Split the Sales Operator work into a dedicated `/sales` workspace with:
  - `/sales` overview for paid revenue, pending payments, low stock, recent completed sales, and quick actions
  - `/sales/checkout` for the cashier counter and payment reconciliation actions
  - `/sales/inventory` for sale-facing inventory management
  - `/sales/inventory/new` for adding products
  - `/sales/inventory/[itemId]/edit` for editing item details and restocking
- Updated the Sales Operator demo account destination and role shell links to land on `/sales`.
- Added a richer checkout form with:
  - inventory item search/selection
  - multi-line cart support
  - quantity and over-stock validation
  - customer label capture
  - cash, bank transfer, and Squad POS payment options
  - receipt-style total preview
  - toast feedback for sale creation and payment actions
- Added pending bank-transfer handling for sales with:
  - account-details dialog
  - exact transfer simulation
  - matched incoming payment persistence
  - reconciliation event persistence
  - ledger credit persistence
  - audit event persistence
  - receipt preview and downloadable HTML receipt
  - cancellation that restores inventory and records an adjustment movement before deleting the pending sale
- Added Sales Operator inventory management flows with:
  - item creation and generated item codes
  - item editing for name, description, price, stock threshold, quantity, and status
  - archive and restore actions
  - stock received and adjustment actions
  - low-stock/out-of-stock state display
  - inventory value summary
  - audit events for create, update, archive/restore, and stock adjustment
- Hydrated recent sales with latest incoming payment and reconciliation event data so checkout/admin surfaces can show actual amount, reconciliation outcome, and explanation input.
- Fully removed `department_head` from the intended demo role model and consolidated outgoing request creation under `field_employee`.
- Simplified payment request statuses to:
  - `submitted`
  - `approved`
  - `rejected`
- Reframed Field Employee as the unified employee request role for:
  - vendor payments
  - staff cash requests
  - airtime/data requests
  - utility payments
  - manual business expense reimbursements
- Built the real Appwrite-backed Field Employee outgoing request flow:
  - `field_employee` can create `payment_request` records through server actions.
  - Requests persist to Appwrite instead of local demo state.
  - Request evidence can be uploaded to the request-evidence bucket when files are attached.
  - Risk evaluations, model scores, rule results, alerts, and audit events are created for submitted requests.
  - Field Employee proof uploads update the same Appwrite-backed request and evidence trail.
- Reworked the Field Employee mobile experience into a clean request tool:
  - white-background mobile UI
  - top logout button
  - four-item bottom nav: Home, Request, Queue, Proof
  - no profile/Me tab
  - no employee-facing Frank panel
  - no employee-facing risk evaluation panel
  - no dashboard-only metrics such as next amount or active amount
- Converted Field Employee request creation into a type-first multi-step form:
  - Step 1 selects request type.
  - Step 2 shows only fields relevant to that type.
  - `vendor_payment`: vendor, amount, description, invoice photo.
  - `staff_cash_request`: amount and cash purpose.
  - `airtime_data_request`: phone number, recharge amount, reason.
  - `utility_payment`: meter/account number, amount, reason, optional bill photo.
  - `manual_business_expense`: amount spent, business justification, receipt photo.
- Removed generic employee-facing fields from request creation:
  - needed timing fields
  - location or recipient input
  - invoice/meter/address reference input
  - estimated risk display
- Enforced required evidence server-side for vendor invoice and reimbursement requests so bypassed browser validation cannot submit those flows without proof.
- Removed default text from Field Employee request inputs.
- Changed amount entry from `type="number"` to digit-sanitized text input to avoid browser increment/decrement controls.
- Verified the Field Employee request flow with:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - `pnpm build`
  - in-app browser checks at `http://localhost:3000/mobile?role=field_employee`
- Added a server-side Squad transfer boundary for money-out approvals with:
  - live `/payout/transfer` support when Squad credentials and beneficiary details are configured
  - merchant-prefixed transfer references
  - deterministic simulation fallback for demo payouts
  - transfer requery support through Squad `/payout/requery`
  - typed response parsing and normalized transfer statuses
- Reworked Super Admin approval actions so approval now calls the Squad transfer boundary, writes transfer records, writes ledger debits only for successful payouts, records audit events, and resolves related alerts.
- Added Super Admin transfer requery actions for uncertain Squad payout states.
- Added Super Admin proof review actions for accepting uploaded proof or flagging it for correction.
- Expanded payment request hydration with admin-only review context:
  - evidence list
  - risk score and band
  - rule results
  - model scores
  - transfer state
  - decision comments
  - audit timeline
- Rebuilt `/admin` outgoing review into a fuller approval workspace with:
  - submitted, approved, high-risk, and all-request tabs
  - request review panels
  - Frank/risk explanation blocks
  - evidence summaries
  - rule and model output visibility
  - Squad payout visibility and requery controls
  - proof acceptance/correction controls
  - all-request table for scan-heavy review
- Added `/api/squad/webhook` to capture Squad webhook events with HMAC SHA512 signature validation when a webhook secret or Squad secret is configured, idempotency checks, raw payload preservation, and Squad-compatible acknowledgement responses.
- Fixed optional payment-request field normalization so non-vendor request types no longer send `null` into optional Zod string fields.
- Verified the Super Admin approval workspace and Squad boundary changes with:
  - `pnpm exec tsc --noEmit`
  - `pnpm build`
  - in-app browser smoke test at `http://localhost:3000/admin`
  - creation of a real Field Employee `staff_cash_request` and confirmation that it appears in the Super Admin submitted review workspace with risk, model output, evidence, and decision controls.
- Cleaned the Super Admin command center into a desktop-only finance console with:
  - persistent left rail
  - compact command header
  - calmer KPI strip
  - focused money-in health panel
  - right-side attention queue, flagged money-in, and recent activity rail
  - simplified outgoing approval workspace without broken tab geometry
  - request review card with visible decision controls, risk context, evidence, timeline, and model output
- Verified the cleaned admin page visually in the in-app browser at `http://localhost:3000/admin` after the server restart.
- Simplified the Super Admin sidebar to navigation only by removing workspace balance and Frank watchlist cards.
- Locked the Super Admin page to a viewport-height desktop shell so the sidebar remains persistent while the right-side content scrolls independently.
- Split the Super Admin area into focused desktop routes with a shared persistent shell:
  - `/admin` finance overview
  - `/admin/money-in` reconciliation and flagged transaction workspace
  - `/admin/approvals` outgoing request review and payout/proof follow-up workspace
  - `/admin/activity` audit, Frank signals, and system checks
- Extracted reusable admin UI building blocks for the persistent shell, page headings, KPI tiles, empty states, finance formatting, risk/transfer badges, and request review cards.
- Updated Super Admin server actions so approval, transfer requery, and proof review changes revalidate the new admin routes.
- Verified the admin route split with passing `pnpm exec tsc --noEmit`.
- Added a server-only Squad static virtual-account boundary for the Super Admin organization account with:
  - `GET /virtual-account/{customer_identifier}` retrieval
  - `POST /virtual-account/business` creation when Squad credentials plus BVN/mobile configuration are present
  - deterministic demo fallback when live prerequisites are missing
  - normalized account display data for admin and sales transfer surfaces
- Replaced hardcoded sales transfer bank details with the shared Cline/Squad static virtual account.
- Hardened the Squad webhook route to accept virtual-account webhook identifiers and the `x-squad-signature` header while preserving idempotent event storage.

## Next Up

1. Build a dedicated inventory mismatch investigation view beyond manual missing-payment flagging.
2. Add Frank explanations over stored reconciliation events, alerts, audit events, sale/payment facts, and outgoing request facts.
3. Tighten admin request detail routing if the demo needs shareable request URLs in addition to the dashboard workspace.
4. Prepare lightweight ML training artifacts and integration path.
5. Add visual/browser verification coverage for the live demo paths.

## Open Questions

1. Which exact demo company name should replace the older spend-demo framing if we want one canonical organization in code and copy.
2. Whether final demo should provide live Squad POS credentials and terminal ID or keep the current simulation fallback.
3. Which of `XGBoost` or `LightGBM` should be the concrete second trained model.
4. Where trained model artifacts will live for app inference.
5. Whether business Q&A will be backed directly by Appwrite queries alone or by a small server-side analytics cache/helper layer.
6. How much of outgoing payout execution will be real versus simulated in the final demo run.
7. Whether the Sales Operator checkout UI should expose `service_sale` and `manual_sale` now, or keep the first demo counter focused on inventory-backed sales.
8. Whether the Field Employee `Proof` tab should remain a persistent nav item or become contextual only from approved request details.
9. Which outgoing request types must trigger mandatory post-payout proof versus optional supporting evidence before approval.
10. Whether vendor bank details should return for admin-side payout execution while staying hidden from the Field Employee first-pass invoice form.

## Architecture Decisions

### Product Shape

Cline is currently a demo-first finance operating system with embedded transaction intelligence. The product story is broader than the implementation slice, but implementation must stay focused on the locked live demo flows.

### Money In

Expected money is created by `sale`. Actual money is recorded through Squad when available or manually by controlled flows. Inventory is a supporting validation layer for inventory-backed sales.

### Money Out

Outgoing money is modeled as typed `payment_request` records with mandatory human approval.

Field Employee creates the request. Super Admin owns risk review, approval/rejection, payout visibility, proof review, and final money-out closure.

Employee-facing request creation should stay simple and type-specific. Admin-facing request review should carry the heavier finance context: evidence, risk, rules, model outputs, audit events, transfer/ledger state, and proof status.

### AI

Frank is a structured intelligence layer over data, query tools, deterministic rules, and lightweight trained models. Frank is not an autonomous decision engine and not a custom-trained LLM.

### Training

The AI training story for the demo is lightweight and credible:

- synthetic scenario-derived data
- training beforehand
- `Isolation Forest`
- `XGBoost` or `LightGBM`

### UI

The UI should present a finance control room, not a marketing site and not a chatbot shell.

Field Employee mobile UI should feel like a clean field tool, not a finance dashboard. Super Admin UI should feel like the finance control room.

## Session Notes

- The product scope changed materially during the grill session.
- The old context described a spend authorization platform and is no longer the right source of truth.
- The new product direction was locked through a focused demo-scenario interview.
- The Appwrite database contract has now been reset in code to match the new finance OS domain model.
- The Appwrite database contract has also been applied to the live target database through the schema sync utility.
- The sale creation slice now bootstraps its own demo workspace records so the next money-in flows can execute against real Appwrite documents instead of placeholder shell data.
- The Sales Operator flow is now the most complete live slice: auth, workspace bootstrap, inventory, sale creation, POS request/requery, transfer simulation, reconciliation, ledger, audit, alerts, and admin visibility are all connected through Appwrite-backed records.
- The Field Employee mobile flow now creates real Appwrite-backed outgoing requests and proof uploads. The next money-out priority is the Super Admin approval/review/payout/proof-closure side of that same flow.
