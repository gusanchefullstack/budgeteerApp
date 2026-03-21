# Budgeteer

A personal budgeting application with a structured hierarchy of categories, groups, and items — each with auto-generated time-based buckets that track planned versus actual spend.

![License](https://img.shields.io/badge/license-MIT-blue)

---

## Monorepo Structure

```
budgeteerApp/
├── backend/    # Node.js + Express REST API (TypeScript)  ← v1 complete
└── frontend/   # Coming soon (React 19 + Vite + TailwindCSS 4)
```

---

## Backend

A REST API built with Express 5.1, Prisma 6.19 (MongoDB Atlas), Zod 4, JWT, and TypeScript 5.

**Key features:**
- User authentication with JWT
- Budget management with hierarchical categories → groups → items
- Calendar-aware auto-generated ItemBuckets per frequency (`daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `annually`, `onetime`)
- Immutable transaction recording with automatic bucket allocation
- Filtered transaction queries

See [`backend/README.md`](./backend/README.md) for full documentation, API reference, environment setup, and architecture notes.

### Quick setup

```bash
cd backend
npm install
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm run prisma:generate
npm run prisma:push
npm run dev                   # hot-reload server on port 3000
```

### API overview

Base URL: `http://localhost:3000/api/v1`

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/register` · `/login` · `/logout` · `/unsubscribe` |
| Budget | `POST /budget` · `GET/PATCH/DELETE /budget/:id` |
| Categories | `POST/PATCH/DELETE /budget/:id/category` |
| Groups | `POST/PATCH/DELETE /budget/:id/group` |
| Items | `POST/PATCH/DELETE /budget/:id/item` |
| Transactions | `POST /transactions` · `GET /transactions` · `GET /transactions/q` · `GET /transactions/:id` |

---

## Frontend

Not yet implemented. Planned stack: React 19 · Vite · TailwindCSS 4.

---

## Author

**Gustavo Sanchez** — [gustavosanchez.dev](https://www.gustavosanchez.dev)

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/gusanchefullstack)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gustavosanchezgalarza/)

---

## License

Distributed under the MIT License.
