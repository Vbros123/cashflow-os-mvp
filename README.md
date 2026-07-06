# Cashflow OS MVP

Small-business cashflow dashboard with a FastAPI forecasting backend and a Next.js operator UI.

## What This MVP Does

- Simulates Plaid bank connection and transaction sync.
- Normalizes and categorizes transactions with simple keyword rules.
- Computes 30-day income, expenses, burn rate, runway, and projected balance.
- Raises low-liquidity, spending-spike, and overdue-receivable alerts.
- Shows the operating dashboard as the first screen.

## Stack

- `apps/web`: Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Recharts, lucide-react.
- `services/api`: FastAPI, Pydantic, Pandas forecasting.
- `docker-compose.yml`: optional Postgres container for the next persistence step.

## Run Locally

From this folder:

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
cp services/api/.env.example services/api/.env
```

Start the API:

```bash
pnpm dev:api
```

Start the web app in a second terminal:

```bash
pnpm dev:web
```

Open `http://localhost:3000`.

For deployed Vercel previews, the Next.js app serves demo-compatible `/v1/*` route handlers when `NEXT_PUBLIC_API_URL` is not configured. For local development, `.env.local` points the dashboard at the FastAPI backend.

## API Endpoints

- `GET /health`
- `GET /v1/dashboard`
- `GET /v1/accounts`
- `GET /v1/transactions`
- `POST /v1/plaid/link-token`
- `POST /v1/plaid/exchange-public-token`
- `POST /v1/sync`

## Real Plaid Path

The current adapter returns mock Plaid data unless `PLAID_CLIENT_ID` and `PLAID_SECRET` are set. The next production step is to replace the mock token exchange in `services/api/app/repository.py` with Plaid Link token creation, access-token exchange, and scheduled transaction sync.

## Next Build Steps

1. Persist accounts and transactions in Postgres with SQLAlchemy or SQLModel.
2. Add Clerk/Auth.js and tenant-scoped business records.
3. Store Plaid item/access tokens encrypted at rest.
4. Move sync into a background worker with Redis and RQ/Celery.
5. Add invoice creation, PDF rendering, and receivable reminders.
