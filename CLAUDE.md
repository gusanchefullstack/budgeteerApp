# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two top-level directories:
- `backend/` — Node.js + Express 5.1 REST API (TypeScript)
- `frontend/` — not yet implemented

The VS Code workspace (`budgeteer.code-workspace`) opens both as separate roots.

## Rules

- Always use `npm` (never pnpm or yarn)

## Backend Commands

All commands run from `backend/`:

```bash
npm run dev          # tsx watch — hot-reload dev server on port 3000
npm run build        # tsc → dist/
npm run start        # node dist/index.js
npm run prisma:generate   # regenerate Prisma client after schema changes
npm run prisma:push       # push schema to MongoDB Atlas (no migration files)
```

Type-check without emitting:
```bash
cd backend && npx tsc --noEmit
```

## Backend Architecture

**Stack:** Express 5.1 · Prisma 6.19 (MongoDB Atlas) · Zod 4 · JWT · bcrypt · TypeScript 5

**Layered architecture** (strict one-way dependency: routes → controllers → services → prisma):

```
src/
  config/env.ts          Zod-parsed env vars — imported by everything; fails fast on startup
  prisma/client.ts       Singleton PrismaClient (hot-reload safe via globalThis)
  middleware/
    AppError.ts          Custom error class (statusCode + optional details)
    validate.ts          Factory: validate(schema, 'body'|'query'|'params')
    authenticate.ts      Bearer JWT → req.user = { userId }
    errorHandler.ts      Global handler: AppError, Prisma P2002/P2025, fallback 500
  validators/            Zod schemas — imported by routes (via validate()) and controllers
  utils/
    password.ts          bcrypt hash/compare
    jwt.ts               signToken / verifyToken
    buckets.ts           generateBuckets() — pure function, no DB
  services/              All Prisma access lives here
  controllers/           Thin: call service, res.json or next(err)
  routes/                Wire validators + authenticate + controller handlers
  server.ts              Express app factory (no listen — testable)
  index.ts               app.listen only
```

## Key Domain Rules

- **One budget per user** — enforced in `budget.service.ts:createBudget` via count check (no DB-level constraint possible in MongoDB).
- **ItemBuckets are auto-generated** — never accepted from the client. `utils/buckets.ts:generateBuckets()` is called by `budget.service.ts` on every create/update that touches items or date range.
- **Transaction allocation** — `transaction.service.ts:allocateToItemBucket()` runs as fire-and-forget after transaction creation. It finds the closest bucket whose `plannedDate ≤ txdatetime` by `txitem` name and increments `currentAmount`. Reads the full Budget document, mutates in-memory, writes back.
- **Transactions are immutable** — no DELETE endpoint exists.
- **JWT logout is stateless** — the logout endpoint is a no-op; the client discards the token.

## Prisma / MongoDB Notes

- Schema is at `backend/prisma/schema.prisma`. The entire Budget hierarchy (BudgetCategory → BudgetGroup → BudgetItem → ItemBucket) is stored as **embedded composite types** inside the Budget document — no separate collections.
- Prisma MongoDB connector has **no enum support** — all enum-like fields are `String`; Zod validators enforce allowed values.
- Run `npm run prisma:generate` after any schema change.
- `prisma.config.ts` is a Prisma v7 artifact — it was left in place but Prisma v6.19 is in use (v7 lacks MongoDB adapter support).

## API Base URL

`/api/v1` — routes: `/auth`, `/budget`, `/transactions`

All `/budget` and `/transactions` routes require `Authorization: Bearer <token>`.

## Zod v4 Gotcha

`.partial()` cannot be called on a schema that already has `.refine()`. Always derive the partial from the **base** object schema, then add `.refine()` separately (see `budget.validators.ts`).
