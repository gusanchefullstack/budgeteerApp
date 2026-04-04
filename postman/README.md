# Budgeteer API — Postman

## Collection file

- **`Budgeteer-API-v2.postman_collection.json`** — Postman Collection v2.1 aligned with the Express API under `/api/v1`.

### Variables (collection)

| Variable | Default | Purpose |
|----------|---------|---------|
| `baseUrl` | `http://localhost:3000/api/v1` | All request paths are relative to this (e.g. `auth/register`, `budget`). |
| `authToken` | _(empty)_ | Set automatically by **Register** / **Login** test scripts. |
| `budgetId` | _(empty)_ | Set by **Get my budget** or **Create budget** when successful. |
| `transactionId` | _(empty)_ | Set by **Create transaction** when successful. |

Collection-level **Bearer** auth uses `{{authToken}}`. **Register**, **Login**, and **OpenAPI YAML** use per-request **no auth**.

### Import into Postman

1. **Postman** → **Import** → choose `Budgeteer-API-v2.postman_collection.json`.
2. If you already have a collection with the same name, choose **Replace** to overwrite.

### Regenerate from source

```bash
node postman/generate-collection.mjs
```

### Sync to Postman Cloud (API)

Postman’s **PUT collection** API expects every folder and request to include an `id`. To build a payload for automation or the Postman API:

```bash
node postman/attach-ids.mjs
```

That reads `Budgeteer-API-v2.postman_collection.json` and writes **`postman-put-payload.json`** (gitignored). Point your API client or script at that file; set `collectionId` inside `attach-ids.mjs` if your cloud collection UID differs.

The linked workspace collection for this project (when signed in as the repo owner) uses UID:

`10044652-e89b34f7-8b49-4c41-a24b-4ee87f0c2913`
