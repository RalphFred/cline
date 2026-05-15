import type { Role } from "@/lib/permissions/roles"

export type DemoAccount = {
  role: Role
  label: string
  name: string
  email: string
  userId: string
  destination: string
  summary: string
}

export const demoAccounts = [
  {
    role: "super_admin",
    label: "Super Admin",
    name: "Cline Super Admin",
    email: "super.admin@cline.demo",
    userId: "cline-super-admin",
    destination: "/admin",
    summary: "Review mismatches, approvals, and Frank insights.",
  },
  {
    role: "sales_operator",
    label: "Sales Operator",
    name: "Cline Sales Operator",
    email: "sales.operator@cline.demo",
    userId: "cline-sales-operator",
    destination: "/sales",
    summary: "Create inventory, service, and manual sales.",
  },
  {
    role: "field_employee",
    label: "Field Employee",
    name: "Cline Field Employee",
    email: "field.employee@cline.demo",
    userId: "cline-field-employee",
    destination: "/mobile?role=field_employee",
    summary: "Create vendor, cash, bill, airtime, and reimbursement requests.",
  },
] as const satisfies readonly DemoAccount[]

export function getDemoAccountByRole(role: Role) {
  return demoAccounts.find((account) => account.role === role)
}

export function getDemoAccountByUserId(userId: string) {
  return demoAccounts.find((account) => account.userId === userId)
}
