# Cline Product Vision, Scope, Architecture, and Backlog

**Document status:** Working product definition  
**Product:** Cline  
**Context:** Nigerian SME finance operating system powered by Squad rails  
**Last updated:** 14 May 2026  

---

## 1. Executive Summary

Cline is an **AI finance operating system for Nigerian SMEs**.

It helps a business understand and control money from the moment it enters the business to the moment it leaves the business. Cline connects sales, collections, POS payments, inventory or service revenue, expense approvals, vendor payments, staff cash requests, airtime/data requests, utility payments, internal ledgers, reconciliation, reports, and AI finance intelligence in one workspace.

The core promise is:

> **Every naira in is classified. Every naira out is controlled.**

Cline is not just a spend approval tool anymore. The product vision has expanded into a finance control layer for SMEs. It should help owners answer:

- What money entered the business?
- Where did it come from?
- Which branch, staff member, department, customer, sale, invoice, POS terminal, or service produced it?
- What money is expected but missing?
- What expenses are being requested?
- Who approved them?
- Was the vendor, staff request, bill, or payment account safe?
- What money left the business?
- What still needs proof, reconciliation, or investigation?

Cline uses Squad as the money movement and collection rail. Cline itself is the intelligence, workflow, ledger, approval, and reconciliation layer on top.

---

## 2. Product Positioning

### One-line Positioning

**Cline is an AI finance control room that helps Nigerian SMEs collect, classify, approve, pay, and reconcile business money from one place.**

### Short Pitch

Nigerian SMEs run finance through WhatsApp messages, manual transfers, POS receipts, screenshots, informal approvals, and scattered spreadsheets. Money enters without proper classification. Money leaves without enough evidence. Owners only discover leakage, fraud, missing sales, and budget pressure after the damage is done.

Cline fixes this by connecting revenue collection, sales records, inventory or services, expense requests, approvals, Squad payments, Squad transfers, bills, airtime/data, audit trails, and AI finance intelligence in one system.

### Strongest Product Line

> **Every naira in is classified. Every naira out is controlled.**

### What Cline Is

Cline is:

- A finance operating system for SMEs.
- A collections and reconciliation layer.
- A POS-linked sales tracking system.
- A lightweight inventory/service revenue layer.
- A spend approval and disbursement layer.
- A business ledger and audit trail system.
- An AI finance assistant over structured business data.

### What Cline Is Not

Cline is not initially:

- A full ERP.
- A full accounting package.
- A payroll engine.
- A tax filing platform.
- A bank.
- A replacement for Squad.
- A replacement for the business owner's final approval.
- A fully automated system that moves money without human review.

---

## 3. Core Product Thesis

The product thesis is that most Nigerian SMEs do not only have a payment problem. They have a **finance visibility and control problem**.

They may already use POS terminals, bank transfers, mobile banking, WhatsApp invoices, staff requests, paper receipts, and spreadsheets. The real problem is that these tools are disconnected.

Cline should become the layer that connects them.

### The Old Cline Thesis

> Before money leaves the company, Cline verifies the request.

### The New Cline Thesis

> Cline knows what money should enter, confirms what actually entered, classifies it, controls what leaves, and reconciles the full story.

This shift makes Cline larger, stronger, and more valuable.

---

## 4. Agreed Product Principles

### 4.1 Sales First, Not Inventory First

Inventory is useful, but Cline should not begin as a pure inventory product.

The better model is **sales-first**.

A sale is the universal object that represents expected revenue. Inventory is only one possible source of a sale.

For example:

| Business Type | What Creates Expected Revenue? |
|---|---|
| Retail store | Product sale / cart |
| Pharmacy | Product sale / prescription sale |
| Restaurant | Order / table / takeaway |
| Travel agency | Booking / ticket / service charge |
| Logistics business | Delivery job |
| School | Fee invoice |
| Salon / spa | Service appointment |
| Consulting firm | Client invoice |

So Cline should support:

- Product sales.
- Service sales.
- Manual sales.
- Invoice-based sales.
- Booking-based sales.
- Inventory-backed sales where needed.

Inventory should exist as a supporting layer, not the entire product.

### 4.2 Squad Handles Money Movement; Cline Handles Business Meaning

Squad processes the payment, collection, transfer, POS request, or VAS transaction.

Cline stores the business meaning:

- Which sale caused this payment?
- Which branch collected it?
- Which staff member handled it?
- Which POS terminal processed it?
- Which product, service, invoice, or booking created the expected amount?
- Which expense request caused the transfer?
- Which policy, approval, or risk flag applied?
- Which ledger entries should be created?

### 4.3 No Blind Money Movement

For outgoing money, Cline should never move money without a controlled workflow.

For MVP and early product versions:

- No auto-approval.
- No auto-disbursement for risky or human-facing expense requests.
- Every vendor payment, field cash request, airtime/data request, and utility request should be traceable.
- The system can score, flag, classify, and recommend, but the appropriate human user remains accountable for approval.

### 4.4 AI Must Sit on Structured Data

Frank and other AI features should not guess from vague text alone.

AI should operate over structured records:

- Sales.
- Payments.
- POS references.
- Inventory movements.
- Expense requests.
- Vendors.
- Departments.
- Branches.
- Ledger entries.
- Policy rules.
- Audit logs.
- Uploaded invoices and proofs.

This keeps the product serious and audit-sensitive.

### 4.5 Cline Should Produce an Audit Trail by Default

Every important finance action should leave an audit trail:

- Who created the sale?
- Who initiated the POS payment request?
- Who approved an expense?
- What did Squad return?
- What webhook came in?
- What requery was performed?
- What changed in the ledger?
- What file was uploaded?
- What did Gemini extract?
- What did the rules engine flag?
- What did Frank alert?

---

## 5. Target Users

### 5.1 Primary Users

Cline is for Nigerian SMEs that have:

- Daily sales or collections.
- Staff handling money.
- Branches, departments, outlets, or field teams.
- Vendor payments.
- Bills, airtime/data, electricity, or operational expenses.
- Poor visibility into what came in and what went out.
- Manual approval flows through WhatsApp, paper, calls, or verbal instructions.

### 5.2 Example SME Categories

Cline can serve:

- Retail stores.
- Supermarkets.
- Pharmacies.
- Restaurants.
- Travel agencies.
- Logistics businesses.
- Schools.
- Salons and spas.
- Small clinics.
- Printing businesses.
- Gadget stores.
- Service businesses.
- Multi-branch SMEs.

### 5.3 Main User Roles

#### Super Admin / Business Owner / CFO

The final finance authority.

Responsibilities:

- Set up business, branches, departments, staff, and policies.
- View money in, money out, pending approvals, and reconciliation issues.
- Approve or reject outgoing requests.
- Review Frank alerts.
- Review reports.
- Manage vendors, inventory/service catalog, and POS terminals.

#### Finance Manager

Operational finance user.

Responsibilities:

- Review sales and payments.
- Reconcile mismatches.
- Review expense requests.
- Export reports.
- Prepare records for accountant/tax review.

#### Branch Manager

Manages one business location.

Responsibilities:

- View branch sales.
- Track branch POS terminals.
- Monitor staff activity.
- Raise branch expense requests.
- Resolve branch-level mismatches.

#### Sales Staff / Cashier

Handles customer-facing sales.

Responsibilities:

- Create sales.
- Select products/services.
- Trigger POS collection or payment link.
- Confirm sale completion.
- Attach customer or note where necessary.

#### Department Head

Manages departmental spending.

Responsibilities:

- Submit vendor invoice payments.
- Submit staff/field requests for department operations.
- View department budget progress.
- Respond to requests for more proof.

#### Field Employee

Receives controlled operational money.

Responsibilities:

- Submit field cash requests.
- Request airtime/data if allowed.
- Upload proof after spending.
- View only their own requests.

#### Inventory Manager

Optional role for product-based businesses.

Responsibilities:

- Create and update products.
- Manage stock quantities.
- Review stock movements.
- Investigate stock/payment mismatches.

#### Accountant / Auditor

Read-heavy role.

Responsibilities:

- Export ledgers.
- Review transaction history.
- Review audit trails.
- Prepare accounting or compliance reports.

#### Frank

AI CFO assistant.

Responsibilities:

- Answer finance questions.
- Explain flags.
- Summarize money movement.
- Raise alerts.
- Help interpret revenue, spend, budget, and reconciliation data.

Frank is not an approver and cannot move money.

---

## 6. Core Product Modules

## 6.1 Business Setup

The business setup module creates the operating structure of the SME.

### Features

- Create business profile.
- Create branches or locations.
- Create departments.
- Invite/create staff.
- Assign roles.
- Assign staff to branches and/or departments.
- Configure expense categories.
- Configure revenue categories.
- Register POS terminals.
- Configure payment methods.
- Configure approval rules.
- Configure spend policies.
- Configure proof requirements.

### Key Setup Objects

- Business.
- Branch.
- Department.
- Staff user.
- Role.
- POS terminal.
- Revenue category.
- Expense category.
- Policy.

---

## 6.2 Sales and Collections

This is the money-in side of Cline.

A sale is created before or during collection. This gives Cline an expected amount before money arrives.

### Features

- Create sale.
- Add products or service items.
- Add customer details if needed.
- Select branch.
- Select staff member automatically from logged-in user.
- Select payment method.
- Generate expected amount.
- Collect payment through Squad-supported rails.
- Confirm payment through webhook, verification, or requery.
- Mark sale as paid, partially paid, failed, cancelled, or pending.
- Classify revenue.
- Link sale to ledger entry.

### Supported Collection Methods

- POS Remote Request.
- Payment link / checkout URL.
- Card.
- Bank.
- USSD.
- Transfer.
- Virtual account payment.

### Why This Matters

Without a sale record, Cline can only say:

> ₦180,000 entered.

With a sale record, Cline can say:

> ₦180,000 entered for Sale #SALE-001 at Lekki Branch, handled by Amaka, paid through POS terminal 2035AB01, matched expected amount, reduced inventory, and posted to Product Sales revenue.

That is the real product value.

---

## 6.3 POS Terminal Management

Cline must treat POS terminals as first-class finance objects.

### What a POS Terminal Means in Cline

A POS terminal is not just a payment device. It is a revenue source that must be mapped to business context.

Each terminal should be linked to:

- Business.
- Branch.
- Optional assigned staff member.
- Status.
- Provider.
- Squad terminal ID.
- Last transaction sync time.

### Example Terminal Record

```text
Terminal ID: 2035AB01
Provider: Squad
Business: Demo Retail Ltd
Branch: Lekki Branch
Assigned User: Amaka
Status: Active
```

### Product Rule

A POS payment should not remain an isolated payment event. It should be linked to:

- Sale.
- Branch.
- Staff.
- Payment transaction.
- Ledger entry.
- Reconciliation status.

---

## 6.4 POS Remote Request Flow

Squad's POS Remote Request lets an application remotely send a payment request to a POS terminal. The terminal receives the request and processes the card payment. Cline should model this as a **sale-first flow**.

### Flow

1. Staff creates a sale in Cline.
2. Cline calculates the expected amount.
3. Staff selects **Collect with POS**.
4. Cline calls Squad POS Remote Request with the terminal ID, amount, and account type.
5. Squad returns a `request_ref`.
6. Cline stores the `request_ref` against the sale and payment attempt.
7. The POS terminal processes the customer's card payment.
8. Cline requeries the POS request status using the `request_ref`.
9. If payment succeeds, Cline marks the sale as paid.
10. Cline creates the ledger entry.
11. Cline updates inventory if the sale has stock items.
12. Cline classifies the revenue.
13. Cline closes or flags the reconciliation status.

### Important Product Interpretation

This should not be described vaguely as “virtual POS” unless the team confirms the exact product naming. In Cline, the safer product language is:

> **POS Remote Request: Cline sends a payment request to a registered Squad POS terminal and reconciles the confirmed payment back to the sale.**

---

## 6.5 Payment Links and Checkout Payments

For non-POS collections, Cline should support payment links or checkout URLs.

### Flow

1. Staff or admin creates a sale or invoice.
2. Cline creates a unique transaction reference.
3. Cline calls Squad payment initiation.
4. Squad returns a checkout URL.
5. Customer pays through the available channel.
6. Cline receives webhook or verifies transaction status.
7. Cline links the payment to the sale or invoice.
8. Cline updates ledger and reconciliation status.

### Useful Use Cases

- Customer is remote.
- Customer wants to pay by card, bank, USSD, or transfer.
- Business wants to send a payment link by WhatsApp, SMS, or email.
- Invoice payment.
- Service booking payment.

---

## 6.6 Virtual Account Collections

Virtual accounts allow a business to receive transfers and identify the payer or context.

### Cline Use Cases

- Assign a virtual account to a customer.
- Assign a virtual account to an invoice.
- Assign a virtual account to a branch or payment context.
- Use the customer identifier to improve reconciliation.
- Receive webhook notifications for successful transfer payments.

### Product Rule

A virtual account payment should be auto-classified where possible. If Cline cannot confidently classify it, it should go to an **Unclassified Inflows** queue.

---

## 6.7 Inventory and Service Catalog

Inventory is needed, but only as part of the larger sales and finance system.

### Product Direction

Cline should support both:

1. **Product catalog** for businesses that sell physical goods.
2. **Service catalog** for businesses that sell services.

### Product Catalog Features

- Product name.
- SKU or simple product code.
- Category.
- Selling price.
- Cost price.
- Stock quantity.
- Branch stock quantity.
- Low stock threshold.
- Active/inactive status.
- Stock movement history.

### Service Catalog Features

- Service name.
- Service category.
- Price.
- Cost estimate, if needed.
- Active/inactive status.

### Inventory Movement Types

- Stock in.
- Sale deduction.
- Manual adjustment.
- Return.
- Damaged/lost stock.
- Transfer between branches, later.

### Why Inventory Matters

Inventory allows Cline to know expected revenue.

Example:

```text
Items sold:
- Bag x2 = ₦80,000
- Shoe x1 = ₦60,000
- Perfume x1 = ₦40,000
Expected total: ₦180,000
Received: ₦180,000
Variance: ₦0
```

If expected revenue and received payment do not match, Cline can flag it.

### MVP Inventory Scope

Build lightweight inventory only.

Do not build advanced warehouse management, barcode scanning, purchase orders, supplier stock cycles, batch tracking, expiry tracking, or full ERP inventory in the first version.

---

## 6.8 Money-In Classification

Cline must classify incoming money.

### Classification Dimensions

- Business.
- Branch.
- Department.
- Staff.
- Customer.
- Payment method.
- POS terminal.
- Sale.
- Invoice.
- Product/service category.
- Revenue category.
- Date/time.
- Transaction reference.

### Classification States

- Auto-classified.
- Manually classified.
- Needs review.
- Unmatched.
- Suspicious.
- Duplicate.
- Overpaid.
- Underpaid.

### Examples

```text
₦180,000 received through POS Terminal 2035AB01.
Classification: Lekki Branch > Product Sales > Sale #SALE-001.
Status: Matched.
```

```text
₦50,000 received through transfer.
Classification: Unknown.
Status: Needs review.
```

---

## 6.9 Expense Control and Disbursement

This is the money-out side of Cline.

### Supported Expense Request Types

- Vendor invoice payment.
- Field cash request.
- Staff airtime/data request.
- Utility/electricity request.
- Branch operational expense.
- Departmental expense.

### Core Rule

Money should only leave after the appropriate approval step.

### Vendor Payment Flow

1. Department Head or finance user submits a vendor payment request.
2. User enters vendor, bank, account number, amount, category, reason, and invoice/proof.
3. Cline stores uploaded evidence.
4. Cline resolves account name through Squad account lookup.
5. Gemini extracts invoice/proof fields.
6. Cline calculates Trust Score.
7. Super Admin reviews.
8. Super Admin approves, rejects, or requests more proof.
9. On approval, Cline initiates Squad transfer.
10. Cline stores transfer response.
11. Cline confirms final status by webhook or requery.
12. Cline posts ledger entries and audit log.

### Field Cash Request Flow

1. Field employee submits request.
2. Cline checks amount, policy, category, frequency, department, and history.
3. Super Admin approves, rejects, or requests more proof.
4. On approval, Cline sends transfer to employee bank account.
5. Request moves to proof-required state.
6. Employee uploads receipt/proof later.
7. Cline extracts proof and calculates Reconciliation Score.
8. Request is closed or flagged.

---

## 6.10 Airtime, Data, and Electricity Requests

Cline should support practical Nigerian SME finance use cases beyond normal bank transfers.

### Airtime/Data Use Cases

- Sales staff need airtime for customer calls.
- Field employees need data for maps, communication, and reporting.
- Department heads request airtime/data for team operations.

### Electricity Use Cases

- Branch electricity token purchase.
- Office meter recharge.
- Store/warehouse utility payment.

### Product Flow

1. Staff or manager submits airtime/data/electricity request.
2. Cline checks policy and budget context.
3. Approver reviews.
4. If approved, Cline calls the relevant Squad VAS endpoint.
5. Cline records the debit.
6. Cline posts ledger entry.
7. Cline attaches the transaction to branch/department/user.
8. Frank can summarize or flag unusual usage.

### Product Rule

Even if VAS feels small, it must still be part of finance control.

Airtime/data/electricity should not be invisible business leakage.

---

## 6.11 Internal Ledger

Cline needs its own internal ledger.

Squad tells Cline what happened on the payment rail. Cline must translate that into business finance records.

### Ledger Entry Types

- Sale payment received.
- POS payment received.
- Virtual account payment received.
- Payment link checkout received.
- Vendor transfer reserved.
- Vendor transfer completed.
- Field cash transfer completed.
- Airtime/data purchase.
- Electricity purchase.
- Reversal.
- Failed payment.
- Manual adjustment.

### Ledger Entry Fields

- Business ID.
- Branch ID.
- Department ID.
- User ID.
- Related sale ID.
- Related expense request ID.
- Related invoice ID.
- Direction: credit or debit.
- Amount.
- Currency.
- Channel.
- Squad reference.
- Internal reference.
- Status.
- Description.
- Created at.
- Confirmed at.

### Ledger Rule

The ledger should be append-only as much as possible.

Do not silently edit historical financial records. Use reversal or adjustment entries.

---

## 6.12 Reconciliation Engine

Reconciliation is one of the most important parts of Cline.

### What Cline Reconciles

- Expected sale amount vs actual payment received.
- Inventory sold vs payment collected.
- POS request vs POS payment status.
- Invoice amount vs customer payment.
- Approved expense vs transfer amount.
- Vendor invoice amount vs transfer amount.
- Field cash request vs uploaded proof.
- Electricity/airtime/data request vs actual VAS transaction.
- Squad transaction status vs internal ledger status.

### Reconciliation Statuses

- Matched.
- Partially matched.
- Overpaid.
- Underpaid.
- Pending confirmation.
- Failed.
- Reversed.
- Needs review.
- Suspicious.

### Example

```text
Sale expected: ₦200,000
Payment received: ₦180,000
Variance: -₦20,000
Status: Underpaid
Action: Send to reconciliation queue
```

---

## 6.13 Trust Score

Trust Score applies before money leaves the business.

### Purpose

Trust Score helps the approver understand risk before approving an outgoing payment.

It should be explainable, not opaque.

### Example Checks

- Recipient account name match.
- Vendor history.
- Duplicate invoice risk.
- Invoice amount match.
- Invoice date validity.
- Invoice number reuse.
- Department budget pressure.
- Amount anomaly.
- Employee request frequency.
- Vendor watchlist/blocked status.
- Category policy fit.
- Missing proof.

### Example Output

```text
Trust Score: 78/100
Recommendation: Review before approval
Flags:
- Account name partially matches vendor name
- Amount is 45% above department average
- Invoice number has not been seen before
Positive signals:
- Vendor has 4 successful previous payments
- Invoice amount matches request amount
```

### Rule

Trust Score does not approve or reject payments by itself.

---

## 6.14 Reconciliation Score

Reconciliation Score applies after money has been spent or after proof is uploaded.

### Purpose

It answers:

> Did the proof match the approved purpose and amount?

### Example Checks

- Proof amount matches approved amount.
- Proof date is reasonable.
- Proof vendor/location matches request purpose.
- Receipt category matches request category.
- Uploaded file is readable.
- Proof submitted before deadline.
- Employee has no repeated mismatch pattern.

### Example Output

```text
Reconciliation Score: 92/100
Status: Closed
Reason: Uploaded fuel receipt amount matches approved fuel request and was submitted within deadline.
```

---

## 6.15 Frank: AI CFO Assistant

Frank is the read-only finance intelligence layer inside Cline.

Frank should answer questions from structured data and explain system-generated flags.

### Frank Should Do

- Answer finance questions.
- Summarize business cash movement.
- Explain why a request was flagged.
- Surface unusual activity.
- Create alerts.
- Help owners understand revenue, spend, and reconciliation.

### Frank Should Not Do

- Approve payments.
- Move money.
- Edit ledger entries directly.
- Invent financial facts.
- Replace the business owner, accountant, or finance manager.

### Example Questions

- How much did Lekki Branch make today?
- How much has Logistics spent this month?
- Which POS terminal has the highest sales this week?
- Which staff submitted the most field cash requests?
- What money is unclassified?
- Show underpaid sales this week.
- Why was this vendor payment flagged?
- What bills did we pay this month?
- What expenses are still awaiting proof?

### Example Alerts

- Duplicate invoice detected.
- Budget pace warning.
- Vendor account mismatch.
- POS payment underpaid.
- Unclassified inflow.
- Suspicious request burst.
- Proof overdue.
- Inventory sold without matching payment.
- Branch revenue unusually low.

---

## 7. Squad API Usage Map

This section captures how Squad fits into Cline.

### 7.1 Payment Initiation / Checkout

Used for:

- Payment links.
- Customer checkout.
- Invoice payments.
- Remote customer payments.
- Card, bank, USSD, and transfer options.

Cline responsibility:

- Create sale/invoice first.
- Generate unique transaction reference.
- Attach metadata such as sale ID, invoice ID, branch ID, staff ID, and customer ID.
- Store checkout URL.
- Verify payment status through webhook or verification.
- Reconcile payment to sale/invoice.

### 7.2 POS Remote Request

Used for:

- In-store card payments.
- Branch sales.
- Cashier-driven checkout.

Cline responsibility:

- Register terminal.
- Map terminal to branch/staff.
- Create sale.
- Invoke terminal payment request.
- Store `request_ref`.
- Requery status.
- Mark sale paid/failed/pending.
- Reconcile transaction.

### 7.3 Virtual Accounts

Used for:

- Transfer-based collections.
- Customer-specific payment accounts.
- Invoice-specific payment accounts.
- Easier reconciliation.

Cline responsibility:

- Create or map virtual account to customer/payment context.
- Receive webhook.
- Classify payment.
- Link to invoice/sale where possible.
- Place unmatched payments in review queue.

### 7.4 Account Lookup

Used for:

- Confirming vendor bank account name.
- Confirming employee bank account name.
- Reducing wrong-account transfer risk.
- Feeding Trust Score.

Cline responsibility:

- Call lookup before transfer.
- Store returned account name.
- Compare account name against vendor/employee profile.
- Flag mismatch.

### 7.5 Transfers

Used for:

- Vendor payment.
- Field employee cash transfer.
- Approved operational payout.

Cline responsibility:

- Require approval before transfer.
- Generate unique internal and Squad transaction references.
- Create pending ledger reservation.
- Initiate transfer.
- Store response.
- Requery until final status where needed.
- Finalize ledger.

### 7.6 Transfer Requery

Used for:

- Confirming whether a transfer succeeded, failed, reversed, or remains pending.

Cline responsibility:

- Requery pending transfers.
- Update request and ledger status.
- Add audit trail entry.
- Alert admin if transfer fails or remains pending too long.

### 7.7 Webhooks

Used for:

- Receiving real-time notifications when payment events occur.
- Confirming successful collections.
- Triggering reconciliation.

Cline responsibility:

- Validate webhook payload/signature.
- Enforce idempotency.
- Check transaction reference before giving value.
- Store raw event.
- Match event to sale/payment/invoice.
- Update ledger and audit trail.

### 7.8 Ledger Balance

Used for:

- Showing available Squad wallet/ledger balance.
- Comparing Cline internal ledger state against Squad balance.

Cline responsibility:

- Fetch balance securely from server.
- Display to authorized finance users only.
- Use for wallet health and payout readiness.

### 7.9 Airtime and Data Vending

Used for:

- Staff airtime requests.
- Staff data requests.
- Department communication budgets.

Cline responsibility:

- Require request and approval.
- Call Squad VAS after approval.
- Record transaction.
- Attach to user/department/branch.
- Post ledger debit.

### 7.10 Electricity / Utility Vending

Used for:

- Office electricity payments.
- Branch meter token purchases.

Cline responsibility:

- Store meter/customer details where allowed.
- Require approval.
- Execute payment after approval.
- Store token/reference.
- Attach to branch/department.
- Post ledger debit.

### 7.11 Aggregator and Sub-Merchant Model

This is a strategic architecture option.

Possible modes:

1. **Each SME connects its own Squad merchant account.**
   - Cleaner ownership of funds.
   - More setup friction.
   - Better for real production compliance.

2. **Cline acts as aggregator and creates sub-merchants.**
   - More platform-like.
   - Cline can manage many businesses under one integration model.
   - Requires proper profiling, approval, compliance review, and production partnership.

For early product planning, keep both options open. For a real production launch, this decision must be made with Squad/compliance input.

---

## 8. Core User Flows

## 8.1 Business Onboarding Flow

1. Owner creates business.
2. Owner adds business details.
3. Owner creates branches.
4. Owner creates departments.
5. Owner invites or creates staff.
6. Owner assigns roles.
7. Owner registers POS terminals.
8. Owner creates revenue and expense categories.
9. Owner creates product/service catalog.
10. Owner configures policies.
11. Owner connects or configures Squad credentials.
12. Dashboard becomes active.

---

## 8.2 POS Sale Flow

1. Cashier logs into Cline.
2. Cashier creates a sale.
3. Cashier adds products or service item.
4. Cline calculates total.
5. Cashier selects POS terminal.
6. Cline sends POS Remote Request to Squad.
7. Customer pays on terminal.
8. Cline requeries status.
9. Cline marks sale as paid.
10. Inventory reduces.
11. Ledger records credit.
12. Revenue is classified.
13. Frank/dashboard updates.

---

## 8.3 Payment Link Sale Flow

1. Staff creates sale or invoice.
2. Cline generates payment link through Squad payment initiation.
3. Staff sends link to customer.
4. Customer pays.
5. Squad webhook hits Cline.
6. Cline validates webhook.
7. Cline matches transaction reference.
8. Cline marks sale/invoice paid.
9. Cline posts ledger credit.
10. Cline updates reports.

---

## 8.4 Virtual Account Collection Flow

1. Customer or invoice has virtual account/payment account context.
2. Customer transfers money.
3. Squad sends webhook.
4. Cline validates event.
5. Cline identifies customer or context.
6. Cline links payment to invoice/sale where possible.
7. If no match, payment enters Unclassified Inflows.
8. Finance user reviews unmatched inflow.
9. Ledger updates after classification.

---

## 8.5 Inventory-Backed Sale Flow

1. Staff selects products.
2. Cline checks available quantity.
3. Cline calculates total.
4. Customer pays.
5. Payment is confirmed.
6. Cline deducts stock.
7. Cline records stock movement.
8. Cline records revenue.
9. Reconciliation confirms expected amount equals received amount.

---

## 8.6 Vendor Invoice Payment Flow

1. Department Head creates vendor payment request.
2. Uploads invoice.
3. Enters vendor details and bank account.
4. Cline resolves account name through Squad.
5. Gemini extracts invoice fields.
6. Trust Score is calculated.
7. Super Admin reviews request.
8. Super Admin approves, rejects, or requests more proof.
9. On approval, Cline initiates transfer.
10. Cline requeries transfer status.
11. Ledger is finalized.
12. Audit trail is completed.

---

## 8.7 Field Cash Request Flow

1. Field employee submits request.
2. Cline checks policy, amount, frequency, and department context.
3. Super Admin reviews.
4. Super Admin approves or rejects.
5. Cline sends transfer to employee account.
6. Request becomes Proof Required.
7. Employee uploads receipt/proof.
8. Cline extracts proof.
9. Reconciliation Score is calculated.
10. Request is closed or flagged.

---

## 8.8 Airtime/Data Request Flow

1. Staff requests airtime or data.
2. Request includes phone number, network if needed, amount, reason, department, and branch.
3. Cline checks policy and usage pattern.
4. Approver reviews.
5. On approval, Cline calls Squad VAS.
6. Cline stores VAS reference.
7. Ledger records debit.
8. Frank can summarize usage.

---

## 8.9 Electricity Request Flow

1. Branch manager or staff requests electricity payment.
2. Request includes meter/customer details, disco/provider, amount, branch, and reason.
3. Cline checks policy.
4. Approver reviews.
5. On approval, Cline calls Squad utility/electricity flow.
6. Cline stores token/reference.
7. Ledger records debit.
8. Branch utility spend is updated.

---

## 9. Core Data Model

This is a high-level product data model. It is not the final database schema.

### Organization and Access

- `businesses`
- `branches`
- `departments`
- `users`
- `roles`
- `user_branch_assignments`
- `user_department_assignments`
- `permissions`

### Sales and Collections

- `sales`
- `sale_line_items`
- `customers`
- `payment_intents`
- `payment_transactions`
- `virtual_accounts`
- `pos_terminals`
- `inflow_classifications`
- `unclassified_inflows`

### Inventory and Services

- `products`
- `services`
- `inventory_locations`
- `inventory_balances`
- `inventory_movements`
- `stock_adjustments`

### Expenses and Outflows

- `expense_requests`
- `expense_categories`
- `vendors`
- `vendor_bank_accounts`
- `employee_bank_accounts`
- `approval_actions`
- `proof_uploads`
- `trust_scores`
- `reconciliation_scores`

### VAS and Bills

- `airtime_data_requests`
- `utility_requests`
- `vas_transactions`

### Ledger and Reconciliation

- `ledger_entries`
- `reconciliation_cases`
- `reconciliation_matches`
- `squad_events`
- `webhook_events`
- `transfer_requeries`

### Frank and Alerts

- `frank_messages`
- `frank_queries`
- `alerts`
- `alert_events`

### Roadmap Products

- `invoices`
- `invoice_line_items`
- `receivables`
- `tax_categories`
- `tax_summaries`
- `compliance_exports`

---

## 10. MVP Build Scope

This is the recommended first build scope.

### Must Build First

#### 1. Business Setup

- Business profile.
- Branches.
- Departments.
- Staff roles.
- POS terminal registry.
- Revenue/expense categories.

#### 2. Sales and Collections

- Create sale.
- Add product/service items.
- Calculate expected amount.
- Collect via payment link or POS Remote Request.
- Store transaction reference.
- Confirm/requery status.
- Mark sale paid/failed/pending.

#### 3. Lightweight Inventory / Service Catalog

- Product/service creation.
- Price.
- Stock quantity for product items.
- Simple stock deduction after successful sale.
- Stock movement history.

#### 4. Money-In Classification

- Classify by branch, staff, POS terminal, sale, and revenue category.
- Show matched and unmatched inflows.
- Create reconciliation case for mismatch.

#### 5. Expense Control

- Vendor payment request.
- Field cash request.
- Account lookup.
- Invoice/proof upload.
- Trust Score.
- Super Admin approve/reject/request proof.
- Transfer after approval.
- Requery status.

#### 6. Airtime/Data or Electricity

Build at least one VAS flow first.

Recommended first VAS:

- Airtime/data request.

Then add electricity.

#### 7. Internal Ledger

- Credits for inflows.
- Debits for transfers/VAS.
- Status-aware ledger entries.
- Reference linking.

#### 8. Reconciliation

- Expected vs received for sales.
- Approved vs transferred for expenses.
- Proof required and proof submitted for field cash.

#### 9. Frank v1

Frank should answer from structured data only.

Minimum questions:

- How much did we make today?
- Which branch made the most sales?
- How much did each department spend this month?
- What inflows are unclassified?
- Which requests are awaiting approval?
- Which payments are awaiting proof?

#### 10. Reports v1

- Daily sales.
- Branch revenue.
- Expenses by department.
- Ledger export.
- Pending reconciliation.

---

## 11. Selected Roadmap Products

The following products have been selected as roadmap extensions.

## 11.1 Invoice and Receivables Management

### Purpose

Help SMEs request, track, collect, and reconcile customer payments.

### Features

- Create customer invoice.
- Add invoice line items.
- Send payment link.
- Assign virtual account where useful.
- Track unpaid, paid, overdue, partially paid, and cancelled invoices.
- Auto-match incoming payment to invoice.
- Frank alerts owner about overdue invoices.
- Receivables dashboard.

### Why It Fits Cline

This strengthens the money-in side.

Cline should not only help businesses spend smarter. It should also help them get paid faster and know who owes them.

---

## 11.2 Tax and Compliance Assistant

### Purpose

Help SMEs keep cleaner records and generate accountant-ready summaries.

### Features

- Categorize taxable revenue.
- Categorize deductible expenses.
- Track VAT-relevant transactions where applicable.
- Track withholding tax-related vendor payments where applicable.
- Generate monthly compliance summary.
- Export accountant-ready CSV/PDF.
- Highlight missing vendor/customer records.
- Highlight transactions with weak evidence.

### Important Limitation

Cline should not claim to file taxes automatically in the early version.

The safer positioning is:

> Cline organizes records and generates compliance-ready summaries for business owners and accountants.

---

## 11.3 Payroll Management — Optional Later Roadmap

Payroll was discussed as an example roadmap product, but the currently selected roadmap focus is Invoice/Receivables and Tax/Compliance.

Payroll can come later if the product expands.

Potential payroll features:

- Staff salary records.
- Payroll schedule.
- Salary approval.
- Salary payout through Squad transfer.
- Payroll ledger entries.
- Payroll reports.

This should not be part of the first build.

---

## 12. Backlog

## 12.1 Foundation Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Auth and roles | Business users with role-based access | Planned |
| P0 | Business setup | Business, branches, departments | Planned |
| P0 | Appwrite database model | Collections for core entities | Planned |
| P0 | File storage | Invoice/proof uploads | Planned |
| P0 | Audit log | Track critical finance events | Planned |
| P0 | Squad server integration | Secure server-only Squad calls | Planned |
| P0 | Internal references | Unique references for sales, payments, transfers | Planned |
| P0 | Webhook idempotency | Prevent duplicate value-giving | Planned |

## 12.2 Money-In Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Create sale | Staff can create expected revenue record | Planned |
| P0 | Product/service line items | Add items to sale | Planned |
| P0 | POS terminal registry | Map terminal to branch/staff | Planned |
| P0 | POS Remote Request | Trigger terminal collection | Planned |
| P0 | POS requery | Confirm status via request reference | Planned |
| P0 | Payment link collection | Generate checkout URL | Planned |
| P0 | Payment webhook handling | Receive and process payment success | Planned |
| P1 | Virtual account mapping | Assign payment context/customer | Backlog |
| P1 | Unclassified inflows queue | Review unmatched money-in | Backlog |
| P1 | Revenue classification rules | Branch/staff/category classification | Backlog |

## 12.3 Inventory/Services Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Product catalog | Product name, price, stock | Planned |
| P0 | Service catalog | Service name and price | Planned |
| P0 | Stock deduction | Reduce stock after successful sale | Planned |
| P1 | Stock movement history | Track stock changes | Backlog |
| P1 | Low stock alert | Alert when stock is below threshold | Backlog |
| P2 | Branch stock transfer | Move stock between branches | Later |
| P2 | Barcode scanning | Scan product barcode | Later |
| P2 | Batch/expiry tracking | Useful for pharmacy/food | Later |

## 12.4 Money-Out Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Vendor payment request | Request payment with invoice | Planned |
| P0 | Field cash request | Staff request money for operations | Planned |
| P0 | Account lookup | Confirm recipient account name | Planned |
| P0 | Trust Score | Explain payment risk | Planned |
| P0 | Approval actions | Approve, reject, request proof | Planned |
| P0 | Squad transfer | Send approved funds | Planned |
| P0 | Transfer requery | Confirm final transfer status | Planned |
| P1 | Vendor watchlist/blocklist | Risk management for vendors | Backlog |
| P1 | Proof upload after cash request | Reconciliation for field spend | Backlog |
| P1 | Reconciliation Score | Score proof after payment | Backlog |

## 12.5 VAS Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P1 | Airtime request | Staff requests airtime | Backlog |
| P1 | Data request | Staff requests data | Backlog |
| P1 | VAS approval flow | Approver reviews before vending | Backlog |
| P1 | Airtime/data vending | Execute through Squad VAS | Backlog |
| P2 | Electricity request | Branch utility payment request | Later |
| P2 | Electricity vending | Execute utility purchase | Later |

## 12.6 Ledger and Reconciliation Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Ledger entries | Credit/debit entries | Planned |
| P0 | Link ledger to sale/expense | Trace every entry | Planned |
| P0 | Reconciliation statuses | Matched, pending, failed, etc. | Planned |
| P1 | Expected vs received matching | Detect under/over-payment | Backlog |
| P1 | POS mismatch queue | Investigate terminal mismatch | Backlog |
| P1 | Squad vs Cline balance check | Internal/external reconciliation | Backlog |
| P2 | Manual adjustment workflow | Controlled finance corrections | Later |

## 12.7 Frank Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P0 | Structured query tools | Frank reads database safely | Planned |
| P0 | Finance Q&A | Ask basic finance questions | Planned |
| P1 | Alert feed | Show generated alerts | Backlog |
| P1 | Explanation mode | Explain flags and scores | Backlog |
| P1 | Daily summary | Summarize money in/out | Backlog |
| P2 | Email alerts | Send important alerts through email | Later |

## 12.8 Invoice and Receivables Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P2 | Create invoice | Customer invoice | Roadmap |
| P2 | Invoice line items | Items/services billed | Roadmap |
| P2 | Payment link on invoice | Collect through Squad | Roadmap |
| P2 | Invoice status tracking | Paid/unpaid/overdue/partial | Roadmap |
| P2 | Receivables dashboard | Who owes the business | Roadmap |
| P2 | Frank overdue alerts | Alert owner on overdue invoices | Roadmap |

## 12.9 Tax and Compliance Backlog

| Priority | Item | Description | Status |
|---|---|---|---|
| P2 | Tax categories | Categorize relevant transactions | Roadmap |
| P2 | Monthly tax summary | Accountant-ready summary | Roadmap |
| P2 | Evidence completeness check | Flag weak records | Roadmap |
| P2 | Compliance export | CSV/PDF report | Roadmap |
| P3 | Accountant access | Read-only accountant role | Later |

---

## 13. Suggested Build Phases

## Phase 1: Product Foundation

Goal: Make Cline usable as a multi-role SME finance workspace.

Build:

- Auth.
- Business setup.
- Branches.
- Departments.
- Roles.
- Audit logs.
- Basic dashboard shell.

## Phase 2: Sales, POS, and Collections

Goal: Make money enter through Cline.

Build:

- Product/service catalog.
- Create sale.
- POS terminal registry.
- POS Remote Request.
- Payment link collection.
- Payment confirmation.
- Revenue classification.

## Phase 3: Expense Control

Goal: Make money leave through Cline.

Build:

- Vendor payment request.
- Field cash request.
- Account lookup.
- Trust Score.
- Approval workflow.
- Squad transfer.
- Transfer requery.

## Phase 4: Ledger and Reconciliation

Goal: Make Cline financially trustworthy.

Build:

- Internal ledger.
- Ledger linking.
- Reconciliation statuses.
- Expected vs received.
- Proof-required workflow.
- Audit timeline.

## Phase 5: VAS and Utility Requests

Goal: Add practical Nigerian SME finance use cases.

Build:

- Airtime request.
- Data request.
- Electricity request.
- Approval before vending.
- Ledger entries.

## Phase 6: Frank

Goal: Make the data useful to owners.

Build:

- Finance Q&A.
- Alerts.
- Daily summaries.
- Flag explanations.

## Phase 7: Roadmap Expansion

Goal: Expand Cline into a broader SME finance OS.

Build:

- Invoice and receivables.
- Tax and compliance assistant.
- Optional payroll later.

---

## 14. Recommended Technical Stack

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query where useful.
- Zustand where local app state is needed.
- React Hook Form + Zod for forms.

### Backend / BaaS

- Appwrite Auth.
- Appwrite Database.
- Appwrite Storage.
- Appwrite Realtime where needed.
- Server routes/actions for all secure operations.

### Payments and Finance Rails

- Squad APIs.
- Server-only secret key usage.
- Internal reference generation.
- Webhook handler.
- Requery jobs.
- Idempotency protection.

### AI

- Gemini for document/proof extraction.
- Gemini or another LLM for Frank responses.
- Structured query tools only for Frank.
- Deterministic scoring engine for Trust Score and Reconciliation Score.

### Email

- Resend for alerts, proof requests, and important notifications.

### Background/Async Jobs

Needed for:

- Transfer requery.
- POS request requery.
- Proof overdue checks.
- Daily summaries.
- Alert generation.

Implementation can use Appwrite Functions, cron jobs, or a server-side job runner depending on deployment constraints.

---

## 15. Security and Controls

### Required Controls

- Server-side Squad calls only.
- Never expose secret keys to frontend.
- Role-based access control.
- Business-level data isolation.
- Branch/department-level visibility.
- Webhook validation.
- Idempotency checks.
- Immutable audit logs for finance events.
- File hash for uploaded proof/invoices.
- Unique internal references.
- Unique Squad references.
- Approval required before outgoing transfers/VAS.
- Ledger entries should be append-only where possible.

### Sensitive Actions That Need Audit Logs

- Business setup changes.
- User role changes.
- POS terminal registration changes.
- Product price changes.
- Stock adjustments.
- Expense request creation.
- Approval/rejection/request proof.
- Transfer initiation.
- Webhook receipt.
- Ledger entry creation.
- Manual reconciliation.
- Vendor status changes.
- Policy changes.

---

## 16. Major Product Risks

### 16.1 Scope Creep

Cline can easily become too broad.

Mitigation:

- Build sales + collections + expense control + ledger first.
- Keep inventory lightweight.
- Push invoices, tax, payroll, advanced inventory, and accounting into roadmap.

### 16.2 Reconciliation Complexity

Reconciliation is difficult when payments arrive without context.

Mitigation:

- Create sale/invoice before payment where possible.
- Use metadata.
- Use unique references.
- Map terminals to branches.
- Keep unmatched inflows queue.

### 16.3 POS Access and Testing

Actual POS flows may require terminal access and merchant setup.

Mitigation:

- Build with Squad sandbox where possible.
- Abstract POS provider logic behind a service layer.
- Use mocked terminal status for local development if needed.

### 16.4 Real-Money Compliance

Production finance systems need compliance review.

Mitigation:

- Keep production launch behind explicit compliance review.
- Use sandbox for early demos.
- Decide merchant/sub-merchant model with Squad.

### 16.5 AI Hallucination

Frank must not invent financial facts.

Mitigation:

- Frank must call structured query tools.
- Every answer should be grounded in database results.
- Avoid free-form finance claims without data.

---

## 17. Open Product Questions

These still need discussion.

### Business Model and Market

1. Is the first customer profile retail, travel/logistics, pharmacy, restaurant, or general SME?
2. Should Cline be vertical-specific first or horizontal from day one?
3. Should pricing be per branch, per staff, per transaction, or monthly subscription?

### Squad Integration

1. Will each SME connect their own Squad merchant account?
2. Will Cline operate as an aggregator/sub-merchant platform later?
3. How much POS access will be available during early testing?
4. Which Squad APIs should be integrated first: POS, payment link, transfer, VAS, or virtual account?

### Inventory

1. How deep should inventory go in the first build?
2. Should we support only products and services, or also stock transfers and adjustments?
3. Should cost price and gross margin be included from v1?

### Approvals

1. Is Super Admin the only final approver at first?
2. Do branch managers approve small requests later?
3. Should different categories have different limits later?

### Tax and Compliance

1. Which compliance summaries matter most for Nigerian SMEs?
2. Should the product target accountants as users?
3. Should tax/compliance remain export-only at first?

---

## 18. Final Product Definition

Cline is an AI finance operating system for Nigerian SMEs. It connects how businesses receive money, classify revenue, manage sales, track inventory or service income, control expenses, pay vendors, fund staff operations, buy airtime/data/electricity, reconcile transactions, and understand business finance through Frank.

The product is built around one operating truth:

> **Every naira in is classified. Every naira out is controlled.**

Cline should not be built as a random collection of finance features. It should be built around a simple finance loop:

```text
Expected Revenue → Payment Collection → Classification → Ledger → Expense Request → Approval → Payment/Transfer/VAS → Reconciliation → Reports/Frank
```

That loop is the product.

---

## 19. Source Notes

This document assumes Squad API capabilities based on the official Squad documentation checked during planning:

- POS Remote Request and POS requery.
- Payment initiation and checkout URL.
- Payment channels including card, bank, USSD, and transfer.
- Payment metadata.
- Virtual accounts.
- Account lookup.
- Transfers and transfer requery.
- Webhooks.
- Airtime and data VAS.
- Aggregator/sub-merchant option.

Exact endpoint behavior, production requirements, terminal access, merchant profiling, and compliance constraints must be confirmed before any real-money launch.
