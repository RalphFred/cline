# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Context reset complete.
- Demo-scenario implementation planning active.

## Current Goal

- Align the repo with the new demo-first finance operating system scope before deeper feature implementation.

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
  - `department_head`
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

- Converting the implementation plan and codebase assumptions from the old spend-only shape to the new demo-driven finance OS shape.

## Next Up

1. Update seeded demo assumptions and route shells for the new role model.
2. Build inventory foundations.
3. Build sale creation flows.
4. Build the clean POS sale flow.
5. Build the inventory mismatch flow.
6. Build typed outgoing payment request flows.
7. Add Frank explanations and business Q&A.
8. Prepare lightweight ML training artifacts and integration path.

## Open Questions

1. Which exact demo company name should replace the older spend-demo framing if we want one canonical organization in code and copy.
2. Whether Squad POS flow will be fully live in sandbox or partly simulated in the demo.
3. Which of `XGBoost` or `LightGBM` should be the concrete second trained model.
4. Where trained model artifacts will live for app inference.
5. Whether business Q&A will be backed directly by Appwrite queries alone or by a small server-side analytics cache/helper layer.
6. How much of outgoing payout execution will be real versus simulated in the final demo run.

## Architecture Decisions

### Product Shape

Cline is currently a demo-first finance operating system with embedded transaction intelligence. The product story is broader than the implementation slice, but implementation must stay focused on the locked live demo flows.

### Money In

Expected money is created by `sale`. Actual money is recorded through Squad when available or manually by controlled flows. Inventory is a supporting validation layer for inventory-backed sales.

### Money Out

Outgoing money is modeled as typed `payment_request` records with mandatory human approval.

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

## Session Notes

- The product scope changed materially during the grill session.
- The old context described a spend authorization platform and is no longer the right source of truth.
- The new product direction was locked through a focused demo-scenario interview.
- The next implementation work should follow the rewritten context files before expanding code.
