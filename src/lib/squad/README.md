# Squad Boundary

Put Squad account lookup, virtual account, transfer, requery, and webhook helpers here.

Rules:

- Amounts sent to Squad are in kobo.
- Transfer references must be unique and include the Merchant ID.
- Webhook processing must be idempotent.
- Requery uncertain transfers before retrying.
