import { roles, type Role } from "@/lib/permissions/roles"

export function getRoleFromSearchParam(value?: string): Role {
  if (value && roles.includes(value as Role)) {
    return value as Role
  }

  return "field_employee"
}
