# AI Workflow Rules

## Approach

Build Cline from the current demo scenario outward. The context files define the locked product shape and should be treated as the source of truth unless they are intentionally revised.

Before implementation, read:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/domain-model.md`
4. `context/ui-context.md`
5. `context/code-standards.md`
6. `context/progress-tracker.md`

## Product Guardrails

- Cline is not a generic expense dashboard.
- Cline is not a retail POS app by itself.
- Cline is not a chatbot with charts attached.
- Cline is a finance operating system for Nigerian SMEs with embedded transaction intelligence.
- The key demo story is: sale created, payment confirmed or missing, mismatch explained, outgoing request reviewed, human decides.

## Non-Negotiables

1. `sale` is the center of expected money-in.
2. Inventory supports `inventory_sale`; inventory is not the whole product.
3. Branches are out of scope.
4. Departments remain only for money-out context.
5. No partial payments in this phase.
6. No auto-approval.
7. No AI-initiated payouts.
8. Squad must feel central to the workflow.
9. Frank must answer from structured data and controlled tools.
10. The trained models score risk only; they do not make final decisions.

## Scoping Rules

- Prioritize the six live demo flows over broader platform completeness.
- Build one verifiable product slice at a time.
- Prefer clarity over breadth.
- If a proposed feature does not strengthen the locked demo story, defer it.
- If a change alters role model, flow model, or data model, update the relevant context file before or with implementation.

## Locked Demo Flows

1. `clean_pos_sale_flow`
2. `inventory_mismatch_flow`
3. `vendor_payment_flow`
4. `staff_cash_request_flow`
5. `transaction_explanation_flow`
6. `business_qa_flow`

These are the primary build targets. Other flows may exist in the product model, but they should not distract implementation from the demo spine.

## Recommended Build Order

1. Role-aware app shell and seeded demo users.
2. Inventory catalog and stock movement.
3. Sale creation for all three sale types.
4. Clean POS sale flow with Squad-centered money-in recording.
5. Inventory mismatch flow and reconciliation.
6. Outgoing payment request creation flows.
7. Admin review and approval surfaces.
8. Deterministic risk/rule engine.
9. ML artifact integration for anomaly/risk scoring.
10. Frank explanation and business Q&A.
11. Alerts, summaries, and demo polish.

## When to Split Work

Split work if it mixes too many of these at once:

- inventory logic and payment rail integration
- model training and UI polish
- role/permissions work and anomaly scoring
- Frank chat behavior and payout execution
- money-in reconciliation and money-out workflow in one step

If a change cannot be verified quickly in the context of a demo flow, the unit is too broad.

## Handling AI Features

### Frank

Frank should do only these jobs:

- explain why something was flagged
- answer business questions about revenue, transactions, and activity
- summarize what changed
- surface anomalies and pending actions

Frank should appear as:

- chat
- inline explanations
- alerts/feed

### Trained Models

The project may speak about training, but that training story must stay honest.

Allowed training story:

- synthetic but realistic training data
- trained ahead of time in Colab or equivalent
- PaddleOCR for OCR on invoices, receipts, bills, and POS slips
- LayoutLMv3 for pretrained document understanding on semi-structured evidence
- all-MiniLM-L6-v2 for lightweight semantic transaction classification
- `Isolation Forest` for anomaly detection
- `XGBoost` or `LightGBM` for risk scoring
- artifacts loaded for inference in the app/demo
- Gemini may be used as a server-side document-extraction fallback while the PaddleOCR/LayoutLM service is not deployed

Disallowed claims:

- custom-trained LLM
- autonomous finance AI
- giant proprietary fraud dataset unless it actually exists
- live retraining as a demo dependency

### Rules and Scores

- deterministic rules remain first-class
- preserve both rule outputs and model outputs
- preserve OCR/document extraction outputs and Squad account lookup results when evidence is evaluated
- Frank explanations should combine:
  - structured facts
  - rule outcomes
  - model scores
- score labels should not imply machine approval

## Handling Payments

- start with Squad sandbox or explicitly simulated Squad-adjacent demo states
- keep provider interactions behind stable internal interfaces
- keep status transitions explicit
- webhook handlers must be idempotent
- requery uncertain provider states
- no automatic retry logic that hides ambiguity

## Handling Money In

- expected money comes from `sale`
- actual money comes from Squad when available
- `inventory_sale` must affect stock
- `service_sale` and `manual_sale` must not affect stock
- mismatches must become explicit records, not just vague UI warnings

Primary mismatch story:

- sale exists
- stock drops
- payment is missing or inconsistent
- Cline flags it
- Frank explains it

## Handling Money Out

- center all outgoing flows on `payment_request`
- preserve typed request categories
- require human approval for every outgoing flow
- allow optional supporting documents where the scope requires flexibility
- keep `super_admin` as final authority

## Handling UI

- admin is the main control room
- mobile role surfaces should stay narrow and operational
- do not build ornamental marketing UI
- do not add dark mode
- do not let Frank UI overshadow the finance workflow itself

## Protected Behavior

- do not revert to the old spend-only product framing
- do not reintroduce branches
- do not re-center the product on invoices
- do not make model training the center of the application architecture

## Verification Checklist Per Unit

Before moving on:

1. The unit strengthens a locked demo flow.
2. Role permissions are enforced server-side.
3. Audit and status transitions are explicit.
4. If scoring is involved, rule and/or model outputs are inspectable.
5. TypeScript passes.
6. `progress-tracker.md` is updated.
