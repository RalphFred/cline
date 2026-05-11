# Cline Product Overview

## Overview

Cline is a spend authorization and disbursement platform for Nigerian SMEs. It helps businesses stop money from leaving without evidence, human approval, payment confirmation, and an automatic audit trail. Department heads and field employees submit payment requests, Cline verifies the evidence with deterministic fraud and policy checks, the Super Admin makes the final decision, and Squad powers wallet funding plus outbound bank transfers.

The product is built around one promise: every payment becomes a verified transaction, not a blind transfer.

## Target Users

### Primary Market

- Nigerian SMEs and businesses with departments, vendors, field workers, and informal payment approval workflows.
- First demo organization: **Express Travels**, a fictional travel agency with Procurement, Logistics, Operations, and Finance departments.

### MVP Actors

1. **Super Admin**
   - CFO, owner, or finance lead.
   - Approves all payments.
   - Funds the master wallet.
   - Sets monthly department budget plans.
   - Configures spend policies.
   - Reviews trust scores, flags, vendors, transaction history, and audit trails.
   - Uses Frank, the AI CFO assistant.

2. **Department Head**
   - Belongs to one department.
   - Submits vendor invoice payments.
   - Can submit field cash requests on behalf of someone in their department.
   - Sees department request history and budget progress.
   - Responds to requests for more proof.
   - Mobile-only experience for MVP.

3. **Field Employee**
   - Belongs to one department.
   - Submits simple field cash requests.
   - Receives approved funds into their registered bank account.
   - Uploads proof after spending.
   - Sees only their own requests.
   - Mobile-only experience for MVP.

## Goals

1. Let an SME submit, verify, approve, and disburse a payment request end to end through Squad sandbox rails.
2. Produce explainable Trust Scores based on deterministic checks, not opaque AI decisions.
3. Give Super Admins a clear approval queue with evidence, risk flags, and audit history before transfer.
4. Support two Nigerian payment realities: vendor invoice payments and field cash requests.
5. Make Frank useful as a read-only finance assistant that answers questions and raises proactive alerts.
6. Keep the product focused enough for a hackathon while architecting it like a real audit-sensitive finance system.

## Core Principle

No auto-approval exists in MVP. Every payment request must be reviewed by the Super Admin before any Squad transfer is initiated. AI and rules only explain risk; they never move money or make the final decision.

## Core User Flows

### Flow A: Vendor Invoice Payment

Example: Express Travels wants to pay a car vendor or supplier.

1. An external vendor sends an invoice outside Cline by email, WhatsApp, PDF, or image.
2. A Department Head opens Cline and submits a Vendor Invoice Payment request.
3. They enter vendor name, bank, account number, amount, category, reason, and upload the invoice.
4. Cline stores the uploaded invoice in Appwrite Storage and records metadata plus file hash.
5. Cline runs Squad account lookup to resolve the recipient account name.
6. Gemini extracts structured invoice fields such as amount, date, vendor name, invoice number, and tax/company hints.
7. The deterministic rules engine calculates a Trust Score using account match, invoice match, duplicate detection, budget pressure, amount anomaly, and vendor history.
8. The request lands in the Super Admin approval queue with score, flags, invoice preview, extracted fields, and timeline.
9. Super Admin approves, rejects, or requests more proof.
10. On approval, Cline reserves funds in the internal ledger, creates a unique Squad transaction reference, and calls Squad Transfer API.
11. Squad response is stored; webhook or requery confirms final transfer status.
12. Cline finalizes ledger entries, auto-generates a receipt record, and logs the full audit trail.

### Flow B: Field Cash Request

Example: a driver needs fuel money for a Lagos-Ibadan route.

1. A Field Employee opens the mobile Cline UI and submits a Field Cash Request.
2. They enter amount, category, reason, and optional route/task note.
3. No invoice is required upfront.
4. Cline scores the request using employee history, amount normality, budget pressure, request frequency, and policy fit.
5. The request lands in the Super Admin approval queue with score and flags.
6. Super Admin approves, rejects, or requests more proof.
7. On approval, Squad Transfer API sends funds to the employee's registered bank account.
8. The request moves to proof required.
9. The employee uploads POS receipt, fuel receipt, bank screenshot, or product/delivery proof.
10. Gemini extracts proof details and the rules engine calculates a post-payment Reconciliation Score.
11. If proof matches, the transaction closes. If not, Cline flags it and Frank alerts the admin.

## Budget Model

- Super Admin sets a monthly budget plan per department.
- Budgets are planning signals, not hard limits.
- Admin can approve payments even if a department is over plan.
- Trust Score and Frank alerts use budget pace as context.
- End-of-month reporting compares budget vs actual spend by department.

## Spend Policies

MVP supports four configurable policies:

1. High-value threshold for stronger warnings.
2. Invoice requirement for vendor payments.
3. Proof deadline for field cash requests.
4. Allowed request categories.

No multi-level approval rules, no category-specific approvers, no auto-deny rules, and no policy language engine in MVP.

## Frank: AI CFO Assistant

Frank lives in the Super Admin dashboard. Frank is not an approver and cannot move money. Frank is a read-only intelligence layer over Cline's structured data.

### Reactive Capabilities

- "How much has Logistics spent this month?"
- "Has Chidi Prints ever been paid before?"
- "Show payments above ₦500k in the last 30 days."
- "What is our budget variance this month?"
- "Why was this request flagged?"

### Proactive Alerts

1. Duplicate invoice.
2. Budget pace warning.
3. Vendor identity mismatch.
4. Request burst.
5. High-value request.
6. Proof overdue or proof mismatch.

### Alert Channels

- Frank chat message.
- Dashboard badge/feed.
- Email through Resend.

Critical alerts send immediate email. Normal alerts go into a digest when that phase is implemented.

## Core Pages

1. **Onboarding**
   - Create organization.
   - Create departments and monthly budgets.
   - Configure spend policies.
   - Show Squad virtual account funding details.

2. **Submit Payment Request**
   - Shared route with role-specific defaults.
   - Department Head can submit vendor invoice and field cash requests.
   - Field Employee can submit field cash requests only.

3. **Admin Dashboard**
   - Pending approval queue.
   - Wallet balance and monthly spend metrics.
   - Frank chat and alert feed.
   - Budget pace indicators.
   - Recent transactions.

4. **Payment Request Detail**
   - Evidence preview.
   - Trust Score breakdown.
   - Flags and recommendation.
   - Squad lookup result.
   - Recipient details.
   - Vendor or employee history.
   - Budget context.
   - Audit timeline.
   - Approve, reject, or request more proof actions.

5. **Mobile Request Home**
   - Role-specific mobile home for Department Heads and Field Employees.
   - Submit, view requests, proof upload, and profile.

6. **Vendors**
   - Super Admin vendor list.
   - Vendor status: normal, watchlist, blocked.
   - Payment history and risk notes.

7. **Reports**
   - Monthly budget vs actual.
   - Exportable ledger CSV.
   - Transaction history filters.

## In Scope

- Appwrite-backed auth, database, storage, and realtime.
- Next.js App Router frontend and server routes/actions.
- Squad sandbox account lookup, virtual account funding flow, transfer, requery, and webhooks.
- Internal wallet ledger that mirrors Squad activity.
- Gemini-powered document/proof extraction and Frank responses.
- Deterministic Trust Score and Reconciliation Score.
- Vendor records, watchlist, and blocked status.
- Role-based UI and access control.
- Resend transactional email for alerts and proof requests.
- Seeded demo organization and users.

## Out of Scope

- Auto-approval.
- Multi-level approval chains.
- Vendor portal.
- Employee reimbursement from personal spend.
- Payroll.
- Corporate cards.
- Hard department budget blocking.
- Dark mode.
- Native mobile app.
- Full accounting/ERP integrations.
- Complex invite workflow.
- WhatsApp bot.
- Production live-money launch without explicit key and compliance review.

## Success Criteria

1. A Super Admin can onboard an organization, create departments, configure policies, and see wallet funding details.
2. A Department Head can submit a vendor invoice request with an uploaded file.
3. A Field Employee can submit a field cash request and upload proof after payout.
4. Cline can resolve recipient account names through Squad account lookup.
5. Cline can calculate and display an explainable Trust Score with weighted checks.
6. Super Admin can approve, reject, or request more proof from a detail page.
7. Approved requests create ledger reservations and initiate Squad sandbox transfer with unique references.
8. Transfer status can be updated by webhook or requery and reflected in the audit trail.
9. Frank can answer at least three finance questions using server-side structured query tools.
10. Frank can create at least two proactive alert types and display them in chat/feed.
11. The UI works as desktop-first for admin and mobile-only for Department Head and Field Employee flows.
