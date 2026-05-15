# Inventory Boundary

Inventory is intentionally lightweight in this phase.

Put the following here:

- inventory item types and status helpers
- stock movement schemas and validators
- deterministic stock-in, sale-out, and adjustment logic

Rules:

- only `inventory_sale` reduces stock
- stock movements are append-only records
- quantity checks must happen before stock is reduced
- all money values remain in kobo
