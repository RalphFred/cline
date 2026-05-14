# Cline Product Overview

## Overview

Cline is an AI-assisted finance operating system for Nigerian SMEs.

For the current build, Cline is scoped around a sharp demo story instead of a full platform rollout. The product should show how an SME can track money coming in, control money going out, detect mismatches, and investigate activity from one workspace.

The core promise for this build is:

> Every naira in is traceable. Every naira out is controlled.

Cline sits on top of Squad for payment rails and uses Appwrite as the backend-of-record. Frank is the intelligence layer over structured business data, trained risk outputs, and deterministic rules.

## Demo-First Product Thesis

The current product is not being built as a generic expense dashboard and not as a pure fraud chatbot. It is being built as a finance operating system with embedded transaction intelligence.

For this phase, the product is optimized for a 5-minute live demo that proves:

1. Cline can create expected revenue through sales.
2. Cline can confirm or question actual incoming money.
3. Cline can connect inventory movement to payment reconciliation.
4. Cline can score and explain suspicious records.
5. Cline can control outgoing payment requests through human approval.

## Locked Scope

### Money In

Expected incoming money is centered on `sale`.

Supported sale types:

- `inventory_sale`
- `service_sale`
- `manual_sale`

Supported incoming payment source types:

- `bank_transfer`
- `pos_payment`
- `cash`
- `manual_record`

Rules:

- `inventory_sale` reduces stock.
- `service_sale` does not affect stock.
- `manual_sale` does not affect stock.
- Inventory is a real lightweight stock layer, not just a visual mock.
- Sale reconciliation is simple for the demo:
  - `pending_payment`
  - `paid`
  - `mismatch_flagged`
- Partial payments are out of scope for this phase.

### Money Out

Outgoing money is centered on a general `payment_request` model.

Supported request types:

- `vendor_payment`
- `staff_cash_request`
- `airtime_data_request`
- `utility_payment`
- `manual_business_expense`

Rules:

- Every outgoing request requires human approval.
- No auto-approval.
- No AI-initiated disbursement.
- Missing proof or missing supporting files increases risk but does not have to block request creation in every case.

## Roles

The current demo role model is:

- `super_admin`
- `sales_operator`
- `department_head`
- `field_employee`

Role responsibilities:

- `super_admin`
  - sees the full organization
  - reviews money-in and money-out
  - approves or rejects outgoing requests
  - confirms manual incoming records
  - investigates mismatches
  - asks Frank business and anomaly questions
- `sales_operator`
  - creates `inventory_sale`
  - creates `service_sale`
  - creates `manual_sale`
  - drives the clean money-in flow
- `department_head`
  - creates higher-context business expense requests
  - especially `vendor_payment` and `manual_business_expense`
- `field_employee`
  - creates `staff_cash_request`
  - uploads proof after payout when the flow requires it

## Demo Company Shape

The product should demo well for a Nigerian retail/distribution-style SME because that shape naturally supports:

- inventory movement
- customer sales
- POS collections
- manual money-in edge cases
- vendor payments
- staff cash requests
- fraud/mismatch scenarios

The current scope removes branches entirely.

Departments remain in the product only for money-out accountability and reporting context. Money-in is organization-level for now.

## Core Demo Flows

### 1. Clean POS Sale Flow

1. `sales_operator` creates an `inventory_sale`.
2. Cline generates a POS payment request.
3. Squad confirms payment.
4. Sale is marked `paid`.
5. Audit trail is visible.

### 2. Inventory Mismatch Flow

1. `sales_operator` creates another `inventory_sale`.
2. Stock reduces.
3. No matching payment is recorded, or the record is manually inconsistent.
4. Sale is marked `mismatch_flagged`.
5. Frank explains why the transaction is suspicious.

### 3. Vendor Payment Flow

1. `department_head` creates a `vendor_payment`.
2. Optional supporting file may be attached.
3. Deterministic rules and trained risk outputs are computed.
4. `super_admin` approves or rejects.
5. Squad payout flow is executed or simulated for the demo.
6. Audit trail updates.

### 4. Staff Cash Request Flow

1. `field_employee` creates a `staff_cash_request`.
2. Risk is computed.
3. `super_admin` approves or rejects.
4. Payout is executed or simulated.
5. Proof can be uploaded later where relevant.

### 5. Frank Explanation Flow

1. User opens a flagged transaction or request.
2. Frank explains why it was flagged using rules, model outputs, and structured records.

### 6. Frank Business Q&A Flow

1. User asks a business question such as:
   - "Why was this transaction flagged?"
   - "What was our revenue last month?"
2. Cline query tools compute the facts.
3. Frank answers in natural language.

## Frank

Frank remains part of the product, but his role is disciplined.

Frank does four things in this phase:

- explains why a transaction or request was flagged
- answers business questions about revenue, transactions, and activity
- summarizes finance system activity
- surfaces anomalies, mismatches, and pending actions

Frank appears as:

- chat
- inline explanations
- alerts/feed

Frank is not:

- a final decision-maker
- a transfer initiator
- a replacement for structured workflow logic

## AI and Training Story

The product should speak credibly about model training without pretending the whole product is a trained model.

Locked AI story:

- Cline uses deterministic rules plus lightweight trained models.
- Training happens before the demo, not live.
- Training data is synthetic but realistic, generated from demo scenarios.
- The trained models are:
  - `Isolation Forest` for anomaly detection
  - `XGBoost` or `LightGBM` for risk scoring
- Model outputs are used for scoring only.
- Final decisions still depend on workflow state, rules, and human review.
- Frank consumes structured query outputs, rules, and model outputs to explain results.

## In Scope

- Appwrite-backed auth, data, storage, and realtime
- Squad-centered collection and payout flows
- lightweight inventory linked to sales
- sales-driven money-in tracking
- typed payment requests for money-out
- deterministic reconciliation and approval logic
- trained anomaly/risk scoring artifacts prepared beforehand
- Frank chat, alerts, and explanations
- demo-ready seeded scenarios

## Out of Scope

- branches
- partial payments
- full ERP behavior
- full accounting package behavior
- payroll
- tax
- deep inventory operations
- full invoice product workflow as a first-class money-in object
- training or fine-tuning an LLM
- autonomous AI approvals or transfers
- dark mode

## Success Criteria

The phase is successful when the product can clearly demo:

1. a clean sale-to-payment flow
2. a sale-to-stock-to-mismatch fraud signal
3. a vendor payment approval flow
4. a staff cash request flow
5. Frank explaining a flagged record
6. Frank answering a business question like revenue last month
