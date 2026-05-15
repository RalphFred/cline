export const roles = [
  "super_admin",
  "sales_operator",
  "field_employee",
] as const

export type Role = (typeof roles)[number]

export function isAdmin(role: Role) {
  return role === "super_admin"
}

export function isMobileOnlyRole(role: Role) {
  return role === "field_employee"
}
