# Budgeteer

Personal budget tracker — full-stack application (backend v1).

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (latest) |
| Framework | Express 5.1 |
| Database | MongoDB Atlas |
| ORM | Prisma 6.19 |
| Validation | Zod 4 |
| Auth | JWT (Bearer) + bcrypt |
| Language | TypeScript 5 |
| Frontend | React 19 + Vite + TailwindCSS 4 *(not yet implemented)* |

## Project Structure

```
budgeteerApp/
├── backend/          Node.js REST API
│   ├── prisma/       Prisma schema (MongoDB)
│   ├── src/
│   │   ├── config/   Zod-validated env vars
│   │   ├── controllers/
│   │   ├── middleware/  Validation, auth, error handling
│   │   ├── prisma/   PrismaClient singleton
│   │   ├── routes/
│   │   ├── services/ All business logic + DB access
│   │   ├── utils/    password, jwt, bucket generation
│   │   └── validators/  Zod schemas
│   └── specs/        Functional and API specifications
└── frontend/         *(not yet implemented)*
```

## Getting Started

### Prerequisites

- Node.js (latest stable)
- MongoDB Atlas cluster

### Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm run prisma:push     # push schema to MongoDB Atlas
npm run dev             # start hot-reload server on port 3000
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `PORT` | Server port (default: `3000`) |
| `NODE_ENV` | `development` \| `production` \| `test` |

## API

Base URL: `http://localhost:3000/api/v1`

All `/budget` and `/transactions` endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register and receive JWT |
| `POST` | `/auth/login` | Login and receive JWT |
| `POST` | `/auth/logout` | Stateless logout (client discards token) |
| `POST` | `/auth/unsubscribe` | Delete account + all data |

### Budget

| Method | Path | Description |
|---|---|---|
| `POST` | `/budget` | Create budget (1 per user) |
| `GET` | `/budget/:id` | Get budget details |
| `GET` | `/budget/:id/transactions` | Get all transactions for a budget |
| `PATCH` | `/budget/:id` | Update budget |
| `DELETE` | `/budget/:id` | Delete budget |
| `POST` | `/budget/:id/category` | Add a BudgetCategory |
| `PATCH` | `/budget/:id/category` | Update a BudgetCategory |
| `DELETE` | `/budget/:id/category` | Delete category + descendants + transactions |
| `POST` | `/budget/:id/group` | Add a BudgetGroup |
| `PATCH` | `/budget/:id/group` | Update a BudgetGroup |
| `DELETE` | `/budget/:id/group` | Delete group + descendants + transactions |
| `POST` | `/budget/:id/item` | Add a BudgetItem (auto-generates buckets) |
| `PATCH` | `/budget/:id/item` | Update a BudgetItem (regenerates buckets) |
| `DELETE` | `/budget/:id/item` | Delete item + buckets + transactions |

### Transactions

| Method | Path | Description |
|---|---|---|
| `POST` | `/transactions` | Create transaction (auto-allocates to ItemBucket) |
| `GET` | `/transactions` | Get all user transactions |
| `GET` | `/transactions/q?` | Filter transactions (startDate, endDate, txtype, txcategory, txgroup, txitem, txcurrency) |
| `GET` | `/transactions/:id` | Get single transaction |

## Data Model

The budget hierarchy is stored as **embedded composite types** inside a single MongoDB document:

```
Budget
  └── incomes / expenses: BudgetCategory[]
        └── budgetGroups: BudgetGroup[]
              └── budgetItems: BudgetItem[]
                    └── buckets: ItemBucket[]   ← auto-generated, never from client
```

**ItemBuckets** are automatically generated when a `BudgetItem` is created or updated, based on `frequency` and the budget's date range (e.g. a monthly item in a 12-month budget produces 12 buckets).

**Transaction allocation**: when a transaction is created, it is automatically allocated to the closest `ItemBucket` whose `plannedDate ≤ txdatetime`, incrementing `currentAmount`.

## Key Constraints

- One budget per user (v1)
- Transactions are immutable — no DELETE endpoint
- JWT logout is stateless (v1) — client discards the token
- All enum-like fields are stored as `String` in MongoDB (Prisma connector limitation); Zod enforces allowed values at the API boundary

## Commands

```bash
npm run dev              # hot-reload dev server
npm run build            # compile TypeScript → dist/
npm run start            # run compiled output
npm run prisma:generate  # regenerate Prisma client after schema changes
npm run prisma:push      # push schema to MongoDB Atlas
npx tsc --noEmit         # type-check without emitting
```
