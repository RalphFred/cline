export const requestCategories = [
  "Logistics",
  "Procurement",
  "Fuel",
  "Repairs",
  "Printing",
  "Office Supplies",
  "Travel",
  "Marketing",
  "Software",
  "Other",
] as const

export type RequestCategory = (typeof requestCategories)[number]
