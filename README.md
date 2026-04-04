<img src="frontend/public/favicon.svg" width="32" height="32" alt="Budgeteer icon" style="vertical-align:middle;margin-right:8px">

# Budgeteer

A full-stack personal budgeting application. Plan income and expenses in a hierarchical tree (categories → groups → items), auto-generate calendar-based tracking buckets, and record immutable transactions — all through a dark/light themeable, typography-first React UI backed by a TypeScript REST API.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)

## Table of Contents

- [Repository Structure](#repository-structure)
- [What Is Budgeteer?](#what-is-budgeteer)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [API Overview](#api-overview)
- [Screenshots](#screenshots)
- [Frontend Features](#frontend-features)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Repository Structure

```
budgeteerApp/
├── backend/    # Node.js · Express 5.1 · Prisma 6.19 · MongoDB Atlas · TypeScript 5
└── frontend/   # React 19 · Vite 8 · TanStack Router/Query · Tailwind CSS v4
```

Each sub-project has its own full README:

- [`backend/README.md`](./backend/README.md) — API reference, environment setup, architecture, learning notes
- [`frontend/README.md`](./frontend/README.md) — Pages & features, design system, component structure, learning notes
- [`PRD.md`](./PRD.md) — Full Product Requirements Document (features, acceptance criteria, technical and interface requirements)

---

## What Is Budgeteer?

Most budgeting tools are either too simple (income vs. expenses as flat lists) or too complex to maintain solo. Budgeteer sits in the middle:

- **Hierarchical structure** — categories contain groups, groups contain items
- **Calendar-aware buckets** — each item auto-generates one `ItemBucket` per calendar period based on its frequency (daily, weekly, monthly, quarterly, semiannually, annually, or one-time)
- **Planned vs. actual tracking** — transactions are allocated to the closest bucket, giving you period-by-period progress
- **Immutable transactions** — no deletes; the ledger is append-only

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Language | TypeScript 5 |
| API Framework | Express 5.1 |
| ORM / Database | Prisma 6.19 + MongoDB Atlas |
| Validation | Zod 4 |
| Auth | JWT + bcrypt |
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | TanStack Router v1 (file-based, type-safe) |
| Server State | TanStack Query v5 |
| Forms | React Hook Form v7 |
| Styling | Tailwind CSS v4 + CSS Modules |

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm run prisma:generate
npm run prisma:push
npm run dev                   # http://localhost:3000/api/v1
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `http://localhost:3000` — no additional environment variables needed for local development.

---

## API Documentation

### OpenAPI

With the backend running, interactive docs and the machine-readable spec are served alongside the API:

| Resource | URL |
|----------|-----|
| **Swagger UI** | `http://localhost:3000/api/v1/docs/` |
| **OpenAPI 3 YAML** | `http://localhost:3000/api/v1/docs/openapi.yaml` |

The same specification file lives in the repo at [`backend/docs/openapi.yaml`](./backend/docs/openapi.yaml). Replace the host/port when you deploy.

### Postman Collection

The **Budgeteer API v2** Postman collection includes all 24 endpoints organized into folders (Auth, Budget, Transactions), with documented descriptions, use cases, request/response examples, and error scenarios for every request. Import it into Postman from the workspace or regenerate it with:

```bash
cd backend
python3 scripts/build_postman_collection.py
```

The collection uses two variables: `baseUrl` (default `http://localhost:3000/api/v1`) and `token` (set after login/register). Collection-level Bearer auth propagates the token to all authenticated requests automatically.

---

## API Overview

Base URL: `http://localhost:3000/api/v1`

All `/budget` and `/transactions` routes require `Authorization: Bearer <token>`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` · `POST /auth/unsubscribe` |
| Budget | `POST /budget` · `GET /budget` · `GET/PATCH/DELETE /budget/:id` · `GET /budget/:id/transactions` |
| Categories | `POST/PATCH/DELETE /budget/:id/category` |
| Groups | `POST/PATCH/DELETE /budget/:id/group` |
| Items | `POST/PATCH/DELETE /budget/:id/item` |
| Transactions | `POST /transactions` · `GET /transactions` · `GET /transactions/q` · `GET /transactions/:id` |

See [`backend/README.md`](./backend/README.md) for narrative API reference, examples, and domain rules. For schemas and try-it-out requests, use the [OpenAPI docs](#api-documentation-openapi) above.

---

## Screenshots

| Login — Dark | Login — Light |
|---|---|
| ![Login dark](docs/screenshots/login-dark.png) | ![Login light](docs/screenshots/login-light.png) |

| Dashboard — Dark | Dashboard — Light |
|---|---|
| ![Dashboard dark](docs/screenshots/dashboard-dark.png) | ![Dashboard light](docs/screenshots/dashboard-light.png) |

### Budget creation — Full Tree Builder

![Full Tree Builder](docs/screenshots/budget-tree-dark.png)

### Budget creation — Step-by-Step Wizard

![Step-by-Step Wizard](docs/screenshots/budget-wizard-dark.png)

### Budget creation — Quick Start

![Quick Start](docs/screenshots/budget-quick-dark.png)

---

## Frontend Features

- **Auth** — register, login, JWT stored in localStorage with route guards
- **Budget creation** — three modes: Full Tree Builder (with drag-to-reorder), Step-by-Step Wizard (with occurrence-aware totals), Quick Start
- **Budget tree** — collapsible category → group → item tree with inline add/edit/delete
- **Transaction drawer** — record transactions with auto-populated item selector
- **Transaction panel** — filterable, paginated transaction list
- **Dashboard summary** — planned income, planned expenses, and balance computed from bucket totals
- **Profile page** — view account details and delete account

See [`frontend/README.md`](./frontend/README.md) for design system, component structure, and learning notes.

---

## Roadmap

- [x] User authentication (register, login, logout, unsubscribe)
- [x] Budget CRUD with hierarchical categories, groups, and items
- [x] Calendar-based auto-generated ItemBuckets (7 frequency types)
- [x] Transaction recording with automatic bucket allocation
- [x] Filtered transaction queries
- [x] React frontend (React 19 + Vite 8 + TanStack Router + TanStack Query)
- [x] Three budget creation modes (tree builder, wizard, quick start)
- [ ] Token revocation via Redis blocklist
- [ ] Test suite (backend unit + integration; frontend React Testing Library + Vitest)
- [ ] Insights page — spending analytics, planned vs. actual comparisons, best-practice recommendations
- [ ] Projections page — forward projections until budget end date based on historical transactions
- [ ] Reports page — export budget and transaction data to XLSX and PDF
- [x] Dark / light theme toggle (system default, persists to localStorage)
- [ ] Multi-budget support
- [ ] Budget export to CSV / PDF
- [ ] Multi-currency support with exchange rate lookup

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Start both servers (backend on 3000, frontend on 5173)
3. Type-check before committing: `npx tsc --noEmit` in each sub-project
4. Open a pull request against `main` with a clear description

Commit style: `type(scope): message` — e.g. `feat(buckets): add biweekly frequency`.

---

## License

Distributed under the MIT License.

---

## Author

**Gustavo Sanchez** — [gustavosanchez.dev](https://www.gustavosanchez.dev)

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/gusanchefullstack)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavosanchezgalarza/)
