# UI Context

## Theme

Cline uses a light-only Nigerian fintech operations theme. The interface should feel calm, trustworthy, and fast to scan. It borrows the cool blue surface language and confident typography of the Squad Architecture vibe, but strips the palette down for an approval-heavy finance product.

The product is not a marketing site. Authenticated screens should lead with work: pending approvals, request status, evidence, alerts, and transaction history.

Dark mode is out of scope for MVP.

## Visual Personality

- Professional and operational.
- High-contrast but not loud.
- Finance-grade clarity over decorative drama.
- Mobile-first for Department Head and Field Employee.
- Desktop-first and responsive for Super Admin.
- Nigerian SME context should show in examples, amounts, categories, and flows, not in visual gimmicks.

## Colors

All components must use CSS variables or Tailwind tokens derived from them. Do not hardcode hex values in components.

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

- Use `--accent-primary` for primary actions like submit, continue, view details, and save.
- Use `--accent-brand` sparingly for brand-defining moments, Frank highlights, and high-attention accents.
- Use status colors consistently:
  - success for paid, closed, verified
  - warning for needs review, proof overdue, budget pace warnings
  - error/critical for transfer failures, blocked vendors, critical concern
- Avoid one-note blue screens. White surfaces and clear status color should break up the cool background.

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

No viewport-width font scaling. Letter spacing should be zero except small labels, where `0.02em` to `0.04em` is allowed.

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

Admin screens should be dense enough for finance work. Mobile screens should favor clear single-column flows with large touch targets.

## Border Radius

| Context | Radius |
| --- | --- |
| Small controls | 6px |
| Buttons/inputs/cards | 8px |
| Large panels | 12px |
| Modals/sheets | 16px |
| Pills/status chips | 9999px |

Avoid nested cards. Page sections are layouts, not cards inside cards. Cards are for repeated items, panels, modals, and intentionally framed tools.

## Component Library

Use shadcn/ui on top of Tailwind. Generated primitives live in `components/ui/`.

Before implementing any UI control, check whether shadcn already provides an appropriate primitive. If it exists, add and use the shadcn component instead of building a custom version. Do not bulk-install the entire registry; add only the component needed for the current feature.

Custom components should compose shadcn primitives and Cline tokens. Only build a fully custom primitive when shadcn does not have the needed control or when the product behavior is genuinely domain-specific.

Preferred UI primitives:

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
- Card only for actual repeated items/panels
- Tooltip
- Toast/Sonner

Use Lucide React icons for common actions. Icon buttons need accessible labels and tooltips when meaning is not obvious.

## Layout Patterns

### Super Admin Desktop

- Persistent left sidebar.
- Top header with org switch/name, wallet balance, alert badge, and user menu.
- Main content constrained to 1280px where appropriate.
- Approval queue is the primary dashboard surface.
- Frank lives in a right panel or dedicated side column on dashboard.
- Detail pages use a two-column layout:
  - main evidence and report
  - right-side recipient, budget, and actions

### Super Admin Mobile

- Responsive emergency workflow, not full desktop parity.
- Bottom navigation or compact menu:
  - Dashboard
  - Approvals
  - Frank
  - More
- Approval detail actions remain available but require confirmation.

### Department Head Mobile

Mobile-only MVP experience. If opened on desktop, render a centered mobile-width layout.

Bottom nav:

- Home
- Submit
- Requests
- Profile

### Field Employee Mobile

Mobile-only MVP experience with fewer choices.

Bottom nav:

- Home
- New
- Proofs
- Profile

## Core Screen Requirements

### Admin Dashboard

Priority order:

1. Pending decisions.
2. Intelligence and alerts.
3. History and reports.

Must show:

- Wallet balance.
- Pending approvals total.
- Month-to-date spend.
- Departments over budget pace.
- Pending approval queue sorted by risk and time.
- Frank chat/alert panel.
- Recent transactions.

### Pending Approval Row/Card

Must show:

- Request title/reason.
- Request type.
- Department.
- Submitter.
- Amount in NGN.
- Vendor/employee recipient.
- Trust Score and concern level.
- Top two flags.
- Time submitted.
- Status.
- View details action.

Do not approve or reject directly from the row in MVP.

### Request Detail

Must show:

- Header summary: amount, type, department, status, Trust Score.
- Evidence preview.
- Submitted fields.
- Extracted fields.
- Squad account lookup result.
- Rule score breakdown.
- Flags and recommendation.
- Recipient details.
- Vendor or employee history.
- Budget context.
- Timeline/audit trail.
- Admin actions where authorized.

### Submit Request

Shared route with role-specific defaults:

- Department Head defaults to Vendor Invoice Payment and can choose Field Cash Request.
- Field Employee only sees Field Cash Request.
- Use a segmented control for request type where the role allows both.
- File upload must support mobile camera/gallery.

## Status and Risk UI

Trust Score is primary. Concern Level is secondary.

Labels:

- `low_concern`: Low concern
- `needs_review`: Needs review
- `high_concern`: High concern
- `critical_concern`: Critical concern

Do not use AI verdict labels that imply approval, such as "approved with caution."

## Data Display

- Amounts should display as Naira with separators: `₦750,000`.
- Store money in kobo; display in Naira.
- Dates should be human-friendly in UI and exact in detail/audit contexts.
- Transaction references and IDs use Geist.
- Tables use open rows with light dividers, not boxed cells.

## Interaction Rules

- Dangerous actions require confirmation or explicit reason:
  - approve
  - reject
  - retry transfer
  - unblock vendor
- Reject and request-more-proof flows require typed messages.
- Disabled approval due to insufficient balance must explain why and show fund-wallet action.
- Loading states should indicate what is happening, especially for verification and transfer.
- Error states must be specific and recoverable.

## Accessibility

- All interactive elements must be keyboard reachable.
- Color cannot be the only risk indicator.
- Use text labels with status colors.
- Form fields require labels and validation messages.
- Touch targets on mobile should be at least 44px high.
