# Budgeteer — Backend API

A personal budgeting REST API that lets users plan income and expense budgets with hierarchical categories, auto-generated time-based buckets for tracking planned vs. actual spend, and immutable transaction recording.

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Express](https://img.shields.io/badge/Express-5.1-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748)

---

## Table of Contents

- [Why Budgeteer?](#why-budgeteer)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Key Domain Rules](#key-domain-rules)
- [What I Learned](#what-i-learned)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)

---

## Why Budgeteer?

Most budgeting tools are either too simple (just income vs. expenses) or too complex for a solo developer to maintain. Budgeteer sits in the middle: it gives you a structured hierarchy (categories → groups → items) with calendar-aware buckets that automatically track planned versus actual amounts per time period — without requiring a spreadsheet or a commercial SaaS subscription.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Language | TypeScript 5 |
| Framework | Express 5.1 |
| ORM | Prisma 6.19 (MongoDB connector) |
| Database | MongoDB Atlas |
| Validation | Zod 4 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Dev server | tsx watch |

---

## Installation

### Prerequisites

- Node.js ≥ 18
- npm (never pnpm or yarn)
- A MongoDB Atlas cluster (free tier works)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/budgeteerApp.git
cd budgeteerApp/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Generate Prisma client
npm run prisma:generate

# 5. Push schema to MongoDB Atlas
npm run prisma:push

# 6. Start the dev server
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`.

---

## Quick Start

### Register and get a token

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","username":"janedoe","password":"secret123"}'
```

```json
{ "success": true, "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

### Create a budget

```bash
curl -X POST http://localhost:3000/api/v1/budget \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2025 Annual Budget",
    "beginningDate": "2025-01-01",
    "endingDate": "2025-12-31"
  }'
```

### Record a transaction

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "txdatetime": "2025-03-15T10:00:00Z",
    "txcurrency": "USD",
    "txamount": 1500.00,
    "txtype": "income",
    "txcategory": "Work",
    "txgroup": "Salary",
    "txitem": "Monthly Salary"
  }'
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MongoDB Atlas connection string | Yes | — |
| `JWT_SECRET` | Random string ≥ 32 characters for signing tokens | Yes | — |
| `PORT` | HTTP port the server listens on | No | `3000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | No | `development` |

> The app validates all variables at startup via Zod and exits immediately with a descriptive error if any required value is missing or malformed.

---

## API Reference

**Base URL:** `/api/v1`

All `/budget` and `/transactions` routes require `Authorization: Bearer <token>`.

---

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | ❌ | Create a new user account |
| `POST` | `/login` | ❌ | Authenticate and receive a JWT |
| `POST` | `/logout` | ✅ | Stateless no-op (client discards token) |
| `POST` | `/unsubscribe` | ✅ | Permanently delete the authenticated account |

**Register / Login request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "username": "janedoe",
  "password": "secret123"
}
```

**Validation rules:**
- `firstName`, `lastName`: 1–20 alphabetical characters
- `username`: 1–20 alphanumeric characters, must be unique
- `password`: 8–64 characters

---

### Budget — `/api/v1/budget`

#### Budget CRUD

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create a budget (one per user) |
| `GET` | `/` | Get the authenticated user's budget (returns `null` if none) |
| `GET` | `/:id` | Get budget by ID |
| `GET` | `/:id/transactions` | Get all transactions for this budget's user |
| `PATCH` | `/:id` | Update budget name or date range |
| `DELETE` | `/:id` | Delete budget |

**Create budget request body:**

```json
{
  "name": "2025 Annual Budget",
  "beginningDate": "2025-01-01",
  "endingDate": "2025-12-31",
  "incomes": [],
  "expenses": []
}
```

`endingDate` must be after `beginningDate`. ItemBuckets are auto-generated for every item on create/update — never sent by the client.

---

#### Categories — `/:id/category`

| Method | Path | Request body fields |
|--------|------|---------------------|
| `POST` | `/:id/category` | `section`, `name`, `budgetGroups?` |
| `PATCH` | `/:id/category` | `section`, `categoryName`, `name?` |
| `DELETE` | `/:id/category` | `section`, `categoryName` |

`section` must be `"incomes"` or `"expenses"`.

---

#### Groups — `/:id/group`

| Method | Path | Request body fields |
|--------|------|---------------------|
| `POST` | `/:id/group` | `section`, `categoryName`, `name`, `budgetItems?` |
| `PATCH` | `/:id/group` | `section`, `categoryName`, `groupName`, `name?` |
| `DELETE` | `/:id/group` | `section`, `categoryName`, `groupName` |

---

#### Items — `/:id/item`

| Method | Path | Request body fields |
|--------|------|---------------------|
| `POST` | `/:id/item` | `section`, `categoryName`, `groupName`, `name`, `plannedDate`, `plannedAmount`, `itemType`, `currency`, `frequency` |
| `PATCH` | `/:id/item` | `section`, `categoryName`, `groupName`, `itemName`, + any optional item fields |
| `DELETE` | `/:id/item` | `section`, `categoryName`, `groupName`, `itemName` |

**`frequency` values:** `daily` · `weekly` · `monthly` · `quarterly` · `semiannually` · `annually` · `onetime`

**`itemType` values:** `income` · `expense`

**`currency`:** ISO 4217 three-letter code (e.g. `"USD"`)

---

### Transactions — `/api/v1/transactions`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Record a transaction (immutable — no delete) |
| `GET` | `/` | Get all transactions for the authenticated user |
| `GET` | `/q` | Get filtered transactions (query params) |
| `GET` | `/:id` | Get a single transaction by ID |

**Create transaction request body:**

```json
{
  "txdatetime": "2025-03-15T10:00:00Z",
  "txcurrency": "USD",
  "txamount": 1500.00,
  "txtype": "income",
  "txcategory": "Work",
  "txgroup": "Salary",
  "txitem": "Monthly Salary"
}
```

**Query filters (GET `/q`):**

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO date | Filter from this date |
| `endDate` | ISO date | Filter up to this date |
| `txtype` | `income` \| `expense` | Filter by type |
| `txcategory` | string | Filter by category name |
| `txgroup` | string | Filter by group name |
| `txitem` | string | Filter by item name |
| `txcurrency` | string | Filter by currency code |

---

### Error Responses

All errors follow a consistent JSON shape:

```json
{ "success": false, "message": "Descriptive error message", "details": {} }
```

| Status | Cause |
|--------|-------|
| `400` | Validation failure (Zod) |
| `401` | Missing or invalid JWT |
| `403` | Accessing another user's resource |
| `404` | Resource not found (Prisma P2025) |
| `409` | Duplicate unique field (Prisma P2002) |
| `500` | Unexpected server error (internals not leaked) |

---

## Project Structure

```
src/
├── config/
│   └── env.ts           # Zod-parsed env vars — fails fast at startup
├── prisma/
│   └── client.ts        # Singleton PrismaClient (hot-reload safe)
├── middleware/
│   ├── AppError.ts      # Custom error class (statusCode + optional details)
│   ├── authenticate.ts  # Bearer JWT → req.user = { userId }
│   ├── validate.ts      # Zod validation factory (body | query | params)
│   └── errorHandler.ts  # Global handler: AppError, Prisma P2002/P2025, 500
├── validators/          # Zod schemas — used by routes and controllers
├── utils/
│   ├── buckets.ts       # generateBuckets() — pure, no DB
│   ├── jwt.ts           # signToken / verifyToken
│   └── password.ts      # bcrypt hash / compare
├── services/            # All Prisma access lives here
├── controllers/         # Thin: call service → res.json or next(err)
├── routes/              # Wire validators + authenticate + controller handlers
├── server.ts            # Express app factory (no listen — testable)
└── index.ts             # app.listen only
prisma/
└── schema.prisma        # Data model — Budget hierarchy as embedded types
```

---

## Key Domain Rules

1. **One budget per user** — enforced in `budget.service.ts` via a count check. MongoDB composite types prevent a DB-level unique constraint here.

2. **ItemBuckets are auto-generated** — `utils/buckets.ts:generateBuckets()` produces one bucket per calendar period based on the item's `frequency`. They are never accepted from the client and are fully regenerated on every item or date-range change.

3. **Transaction allocation** — after a transaction is created, `allocateToItemBucket()` runs as fire-and-forget. It finds the bucket whose `plannedDate` is closest to and ≤ `txdatetime` for the matching `txitem` name, then increments `currentAmount` and sets `currentDate` to `txdatetime`.

4. **Transactions are immutable** — no `DELETE` endpoint exists.

5. **Stateless JWT logout** — the `/logout` endpoint is a no-op; the client discards the token.

---

## What I Learned

### MongoDB embedded composite types with Prisma

Prisma's MongoDB connector stores the entire Budget hierarchy (Category → Group → Item → Bucket) as **embedded composite types** inside a single document. There are no separate collections for categories, groups, or items. This trades join flexibility for write simplicity and atomic updates, but it requires careful in-memory manipulation before writing back the whole document.

Key docs: [Prisma MongoDB composite types](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#defining-composite-types)

### Zod v4 `.partial()` and `.refine()` incompatibility

Calling `.partial()` on a schema that already has `.refine()` throws at runtime. The fix is to derive the partial from the **base** object schema and add `.refine()` separately afterward.

```ts
// ❌ breaks
const updateSchema = createSchema.partial(); // createSchema already has .refine()

// ✅ correct
const baseSchema = z.object({ ... });
const createSchema = baseSchema.refine(...);
const updateSchema = baseSchema.partial().refine(...);
```

### Express 5 async error propagation

Express 5 natively catches errors thrown (or returned as rejected promises) inside `async` route handlers without needing `express-async-errors` or manual `try/catch`. Errors flow straight to the global `errorHandler` middleware.

### Express 5 `req.query` is a read-only getter

In Express 5, `req.query` is defined as a **read-only getter** on the `IncomingMessage` prototype. Attempting to reassign it (e.g. `req.query = parsedValue`) throws a `TypeError` at runtime even if TypeScript is satisfied by a cast. The fix is to mutate the existing object in-place rather than replace the reference:

```ts
// ❌ throws TypeError in Express 5
(req as any).query = result.data;

// ✅ mutate in place
const q = req.query as Record<string, unknown>;
Object.keys(q).forEach(k => delete q[k]);
Object.assign(q, result.data);
```

This affects any `validate(schema, 'query')` middleware call. `req.body` and `req.params` are writable and unaffected.

### UTC-safe date arithmetic

JavaScript `Date` methods like `getMonth()` return local time, which causes bucket `plannedDate` values to drift when the server timezone differs from UTC. All bucket date arithmetic in `utils/buckets.ts` uses `Date.UTC()` and UTC getters (`getUTCFullYear()`, `getUTCMonth()`, etc.) to ensure consistent behavior regardless of server timezone.

### Singleton Prisma client with hot reload

`tsx watch` re-executes modules on file change, which would create multiple `PrismaClient` instances and exhaust the connection pool. The fix is to attach the client to `globalThis`:

```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Roadmap

- [x] User authentication (register, login, logout, unsubscribe)
- [x] Budget CRUD with hierarchical categories, groups, and items
- [x] Calendar-based auto-generated ItemBuckets (7 frequency types)
- [x] Transaction recording with automatic bucket allocation
- [x] Filtered transaction queries
- [x] Frontend (React 19 + Vite 8 + TanStack Router — see [`/frontend`](../frontend/README.md))
- [ ] Token revocation via Redis blocklist
- [ ] Test suite (unit + integration)
- [ ] Budget summary / analytics endpoint
- [ ] Multi-currency support with exchange rate lookup

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Run the dev server: `npm run dev`
3. Type-check before committing: `npx tsc --noEmit`
4. Open a pull request against `main` with a clear description of the change.

Commit style: `type(scope): message` — e.g. `fix(buckets): handle onetime frequency edge case`.

---

## License

Distributed under the MIT License.

---

## Author

**Gustavo Sanchez** — [gustavosanchez.dev](https://www.gustavosanchez.dev)

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/gusanchefullstack)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavosanchezgalarza/)
