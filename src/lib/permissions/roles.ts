export const roles = ["super_admin", "department_head", "field_employee"] as const

export type Role = (typeof roles)[number]

export function isAdmin(role: Role) {
  return role === "super_admin"
}

export function isMobileOnlyRole(role: Role) {
  return role === "department_head" || role === "field_employee"
}
