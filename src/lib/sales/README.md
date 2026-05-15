# Sales Boundary

Sales are the expected money-in anchor for the product.

Put the following here:

- sale types, statuses, and line kinds
- sale creation validation
- deterministic sale draft building
- inventory-backed sale orchestration inputs

Rules:

- every sale has one expected amount in kobo
- `inventory_sale` is the only sale type that reduces stock
- `service_sale` and `manual_sale` must not touch inventory
- sale lines are append-only snapshots of the creation-time details
