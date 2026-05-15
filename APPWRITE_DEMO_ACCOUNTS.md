# Appwrite Demo Accounts

Created through the Appwrite MCP for the Cline demo workspace.

## Workspace

- Appwrite endpoint: `https://fra.cloud.appwrite.io/v1`
- Database ID: `cline`
- Organization row ID: `crestview-distribution`
- Organization name: `Crestview Distribution`
- Shared password: `ClineDemo2026!`

## Accounts

| Role | Name | Email | User ID | Password |
| --- | --- | --- | --- | --- |
| `super_admin` | Cline Super Admin | `super.admin@cline.demo` | `cline-super-admin` | `ClineDemo2026!` |
| `sales_operator` | Cline Sales Operator | `sales.operator@cline.demo` | `cline-sales-operator` | `ClineDemo2026!` |
| `department_head` | Cline Department Head | `department.head@cline.demo` | `cline-department-head` | `ClineDemo2026!` |
| `field_employee` | Cline Field Employee | `field.employee@cline.demo` | `cline-field-employee` | `ClineDemo2026!` |

## Related Appwrite Rows

| Role | User Profile Row | Org Member Row | Department Row |
| --- | --- | --- | --- |
| `super_admin` | `profile-cline-super-admin` | `member-cline-super-admin` | none |
| `sales_operator` | `profile-cline-sales-operator` | `member-cline-sales-operator` | `dept-sales` |
| `department_head` | `profile-cline-department-head` | `member-cline-department-head` | `dept-operations` |
| `field_employee` | `profile-cline-field-employee` | `member-cline-field-employee` | `dept-field` |

## Notes

- The Appwrite `org-members.role` enum was updated through MCP to include `sales_operator`, matching `src/lib/permissions/roles.ts`.
- MCP verification after creation showed 4 user profile rows and 4 organization member rows.
