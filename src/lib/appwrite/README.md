# Appwrite Boundary

Put Appwrite client creation, schema definitions, collection IDs, bucket IDs,
session helpers, and schema sync utilities here.

Current finance OS database contract:

- `schema.ts` holds the typed collection, attribute, relationship, and index registry.
- `ids.ts` resolves the runtime database, collection, and bucket IDs from env.
- `sync.ts` applies the schema registry to Appwrite through the server client.

Rules:

- Browser code may only use public Appwrite client configuration.
- Secret-bearing Appwrite operations stay in server routes/actions or explicit server-only admin utilities.
- Application role checks still happen server-side even when Appwrite permissions exist.
