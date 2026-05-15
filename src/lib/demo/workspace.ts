import type { Role } from "@/lib/permissions/roles"

export const demoWorkspace = {
  organizationName: "Crestview Distribution",
  organizationSubtitle: "Retail and distribution SME demo workspace",
  currency: "NGN",
  location: "Lagos, Nigeria",
  revenueThisMonth: "₦18.4m",
  pendingReconciliationCount: 4,
  flaggedTransactionsCount: 3,
  awaitingDecisionCount: 6,
} as const

export const demoSetupItems = [
  "Appwrite auth, database, storage, and schema sync are wired.",
  "Finance OS collections for sales, inventory, money-in, risk, and Frank are live.",
  "Role shells now map to Super Admin, Sales Operator, and Field Employee flows.",
  "Squad, Frank, and seeded demo scenarios can layer on this shared contract.",
] as const

export const demoFlows = [
  {
    slug: "clean-pos-sale-flow",
    title: "Clean POS Sale Flow",
    summary: "Create an inventory sale, collect through Squad, and close the loop as paid.",
  },
  {
    slug: "inventory-mismatch-flow",
    title: "Inventory Mismatch Flow",
    summary: "Reduce stock, miss the payment, and surface the flagged reconciliation story.",
  },
  {
    slug: "vendor-payment-flow",
    title: "Vendor Payment Flow",
    summary: "Review a typed vendor request with risk context before any payout moves.",
  },
  {
    slug: "staff-cash-request-flow",
    title: "Staff Cash Request Flow",
    summary: "Handle employee cash requests and proof follow-up from one mobile-friendly path.",
  },
  {
    slug: "transaction-explanation-flow",
    title: "Frank Explanation Flow",
    summary: "Explain exactly why a record was flagged with rules and model outputs.",
  },
  {
    slug: "business-qa-flow",
    title: "Frank Business Q&A Flow",
    summary: "Answer operating questions like revenue last month from structured finance data.",
  },
] as const

export const adminStats = [
  { label: "Revenue this month", value: "₦18.4m" },
  { label: "Pending reconciliation", value: "4" },
  { label: "Flagged transactions", value: "3" },
  { label: "Outgoing awaiting decision", value: "6" },
] as const

export const moneyInHealth = [
  {
    title: "POS collections matched",
    value: "₦12.8m",
    note: "11 clean matches landed through Squad this week.",
  },
  {
    title: "Manual and cash records pending review",
    value: "₦1.6m",
    note: "Super Admin confirmation is still needed on 4 entries.",
  },
  {
    title: "Inventory-backed sales under watch",
    value: "3 sales",
    note: "Each reduced stock without a settled incoming payment.",
  },
] as const

export const flaggedSales = [
  {
    title: "48 cartons of engine oil",
    customer: "Mainland Auto Parts",
    amount: "₦1,240,000",
    issue: "Stock reduced but no matching POS payment arrived.",
  },
  {
    title: "Bulk generator service package",
    customer: "Ikoyi Facilities Group",
    amount: "₦875,000",
    issue: "Transfer received is below the expected sale amount.",
  },
  {
    title: "Wholesale battery refill order",
    customer: "TradeFair Resellers",
    amount: "₦2,100,000",
    issue: "Incoming payment exists but is still unclassified against the sale.",
  },
] as const

export const outgoingQueue = [
  {
    title: "Diesel supplier settlement",
    department: "Operations",
    amount: "₦2,850,000",
    riskScore: "0.71",
    topFlag: "Supporting invoice missing",
  },
  {
    title: "Field recovery cash advance",
    department: "Collections",
    amount: "₦120,000",
    riskScore: "0.43",
    topFlag: "Repeat request within 48 hours",
  },
  {
    title: "Warehouse internet renewal",
    department: "Admin",
    amount: "₦85,000",
    riskScore: "0.18",
    topFlag: "Low concern",
  },
] as const

export const recentActivity = [
  "Sales Operator logged an inventory sale for Mainland Auto Parts.",
  "Squad confirmed a POS payment for ₦540,000 and marked the sale paid.",
  "Frank generated a mismatch explanation for the TradeFair Resellers order.",
  "Field Employee submitted a diesel supplier request with no invoice attached.",
] as const

export const frankHighlights = [
  "Three flagged records share the same pattern: stock moved before money was confirmed.",
  "Revenue is trending ahead of last month, but manual incoming records are still slowing certainty.",
  "The diesel supplier request needs human review because documentation is weaker than the amount suggests.",
] as const

export type MobileRoleConfig = {
  role: Role
  badge: string
  title: string
  description: string
  primaryAction: string
  taskTitle: string
  taskDescription: string
  recentTitle: string
  recentItems: string[]
}

export const mobileRoleConfigs: Record<Role, MobileRoleConfig> = {
  super_admin: {
    role: "super_admin",
    badge: "Super Admin",
    title: "Review the finance control room",
    description:
      "Use the desktop command center for approvals, mismatches, and Frank investigations.",
    primaryAction: "Open desktop command center",
    taskTitle: "Priority actions",
    taskDescription:
      "Desktop is the primary surface for Super Admin decisions in this demo phase.",
    recentTitle: "Today",
    recentItems: [
      "Approve or reject outgoing requests.",
      "Confirm manual incoming records.",
      "Investigate flagged stock-to-payment mismatches.",
    ],
  },
  sales_operator: {
    role: "sales_operator",
    badge: "Sales Operator",
    title: "Capture sales and watch payment status",
    description:
      "Create inventory, service, and manual sales while keeping the expected money-in story clean.",
    primaryAction: "Start new sale",
    taskTitle: "Sales queue",
    taskDescription:
      "Two inventory-backed sales are still waiting for payment confirmation.",
    recentTitle: "Recent sales",
    recentItems: [
      "Engine oil restock order is waiting on POS confirmation.",
      "Service package for Ikoyi Facilities Group is flagged for amount mismatch.",
      "Cash sale for a walk-in customer was recorded manually and needs admin confirmation.",
    ],
  },
  field_employee: {
    role: "field_employee",
    badge: "Field Employee",
    title: "Create outgoing requests and upload proof",
    description:
      "Submit vendor payments, staff cash, airtime/data, bills, and reimbursements from one employee flow.",
    primaryAction: "Create request",
    taskTitle: "Employee request lane",
    taskDescription:
      "Super Admin remains the only approver; employee status stays simple.",
    recentTitle: "Recent requests",
    recentItems: [
      "Recovery trip advance was approved this morning and needs proof.",
      "Airtime/data request was submitted for Super Admin approval.",
      "Upload receipt evidence for any reimbursement before submission.",
    ],
  },
}
