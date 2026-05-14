# UI Context

## Theme

Cline uses a light-only operational fintech theme. The product should feel like a finance control room for a Nigerian SME, not a landing page and not a generic admin template.

The new product is centered on:

- money-in visibility
- inventory-backed reconciliation
- outgoing payment control
- Frank explanations and business Q&A

Dark mode remains out of scope.

## Visual Personality

- Professional and operational.
- Calm, dense, and credible.
- Data-forward rather than decorative.
- Slightly more dynamic than the old spend-only product because money-in, alerts, and inventory must feel alive.
- Nigerian business context should show through examples, transaction labels, and flows rather than visual cliches.

## Colors

All colors must come from tokens or CSS variables. Do not hardcode component hex values.

| Role | CSS Variable | Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#F5FAFF` |
| Surface | `--bg-surface` | `#FFFFFF` |
| Soft surface | `--bg-soft` | `#EAF5FF` |
| Raised surface | `--bg-raised` | `#FFFFFF` |
| Primary text | `--text-primary` | `#001E2D` |
| Muted text | `--text-muted` | `#5B6B76` |
| Inverse text | `--text-inverse` | `#E4F3FF` |
| Primary action | `--accent-primary` | `#0F6B8F` |
| Brand accent | `--accent-brand` | `#E0185B` |
| Secondary accent | `--accent-secondary` | `#3B637B` |
| Border | `--border-default` | `#D5E7F5` |
| Strong border | `--border-strong` | `#A4CCE7` |
| Success | `--state-success` | `#027A48` |
| Warning | `--state-warning` | `#B54708` |
| Error | `--state-error` | `#BA1A1A` |
| Critical | `--state-critical` | `#93000A` |

### Color Usage

- use `--accent-primary` for core actions
- use `--accent-brand` sparingly for Frank highlights and high-attention markers
- success indicates clean paid or confirmed states
- warning indicates review states, mismatches, or delayed action
- error/critical indicates serious inconsistency or failed operational outcomes

Money-in, mismatch, and approval states must be visually distinct without turning the interface loud.

## Typography

| Role | Font | Variable |
| --- | --- | --- |
| Headlines | Hanken Grotesk | `--font-heading` |
| Body/UI text | Inter | `--font-sans` |
| Data/labels | Geist | `--font-data` |

### Type Scale

| Role | Desktop | Mobile | Weight | Line Height |
| --- | --- | --- | --- | --- |
| Display | 48px | 36px | 700 | 1.15 |
| Page heading | 32px | 28px | 700 | 1.2 |
| Section heading | 24px | 22px | 600 | 1.25 |
| Card heading | 18px | 18px | 600 | 1.35 |
| Body | 16px | 16px | 400 | 1.5 |
| Small body | 14px | 14px | 400 | 1.45 |
| Label | 12px | 12px | 500 | 1.3 |

## Spacing

Base unit: 4px.

| Token | Value |
| --- | --- |
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 40px |
| `--space-2xl` | 64px |
| `--container-max` | 1280px |
| `--desktop-gutter` | 24px |
| `--mobile-margin` | 16px |

Admin surfaces should be information-rich without feeling cramped. Mobile flows should stay narrow, sequential, and fast to scan.

## Border Radius

| Context | Radius |
| --- | --- |
| Small controls | 6px |
| Buttons/inputs/cards | 8px |
| Large panels | 12px |
| Modals/sheets | 16px |
| Pills/status chips | 9999px |

## Component Library

Use shadcn/ui on top of Tailwind. Generated primitives live in `components/ui/`.

Preferred primitives:

- Button
- Input
- Textarea
- Select
- Checkbox
- Tabs
- Dialog
- Sheet
- Dropdown Menu
- Badge
- Table
- Card
- Tooltip
- Sonner

Do not bulk-install shadcn registry components. Add only what the current feature needs.

## Layout Patterns

### Super Admin Desktop

This is the main product surface.

Structure:

- persistent left sidebar
- top header with organization name, alert state, and user menu
- main dashboard area
- Frank panel or rail

Priority areas:

1. money-in health
2. flagged mismatches
3. outgoing request queue
4. recent activity
5. Frank intelligence

### Mobile Role Surfaces

The mobile experience should stay role-specific and limited.

`sales_operator`

- focused on sale creation and recent sales activity

`department_head`

- focused on submitting and tracking outgoing requests

`field_employee`

- focused on staff cash request and proof upload

If a mobile-only role is opened on desktop, render it in a constrained centered shell instead of trying full desktop parity.

## Core Screen Requirements

### Admin Dashboard

The dashboard should feel like a finance command center.

Must show:

- revenue snapshot
- money-in status
- mismatch alerts
- outgoing approval queue
- recent transactions/events
- Frank panel

Recommended dashboard modules:

- `Revenue This Month`
- `Pending Payment Reconciliation`
- `Flagged Transactions`
- `Outgoing Requests Awaiting Decision`
- `Recent Activity`
- `Ask Frank`

### Sales Flow Screens

Must support:

- create `inventory_sale`
- create `service_sale`
- create `manual_sale`
- show expected amount
- show payment method expectation
- show sale status

For `inventory_sale`, the UI must make stock linkage obvious.

### Inventory Views

Must show:

- product name
- SKU
- quantity on hand
- low-stock signal
- recent stock movement

Do not turn inventory into a full warehouse UI.

### Mismatch / Reconciliation View

Must show:

- sale summary
- expected amount
- actual payment status
- stock effect if inventory-backed
- why the record is flagged
- Frank explanation block

This is one of the most important demo surfaces.

### Outgoing Request Queue

Must show:

- request type
- submitter
- department
- amount
- status
- risk score
- top flag(s)
- time submitted

### Outgoing Request Detail

Must show:

- request summary
- amount and request type
- supporting evidence if present
- model/rule explanation
- decision timeline
- approve/reject actions for `super_admin`

### Frank

Frank should have three visible product shapes:

- chat panel
- inline explanation component
- alert/feed cards

The Frank chat UI should feel focused and work-oriented, not like a general-purpose assistant playground.

## Demo-Critical Screens

The UI should prioritize these scenes:

1. clean POS sale flow
2. inventory mismatch view
3. vendor payment request detail
4. staff cash request detail
5. Frank explaining a flagged record
6. Frank answering revenue last month

If a design decision helps those scenes, it is probably correct.

## Status and Risk UI

### Sale Status Labels

- `pending_payment`: Pending payment
- `paid`: Paid
- `mismatch_flagged`: Mismatch flagged

### Request Risk Labels

- `low`: Low risk
- `medium`: Needs review
- `high`: High risk

### Alert Tone

- informational alerts should stay compact
- important anomaly alerts should be visually strong
- avoid labels that imply the AI approved a transaction

## Data Display

- display money in Naira with separators, for example `₦950,000`
- store money in kobo
- use human-friendly dates in summary views
- use exact timestamps in audit/reconciliation views
- show IDs and references in data font
- tables should use open rows with light dividers, not heavy grids

## UI Anti-Goals

- no marketing homepage styling inside the app
- no decorative blob gradients
- no generic chatbot-first dashboard
- no branch-based UI
- no fake inventory complexity
