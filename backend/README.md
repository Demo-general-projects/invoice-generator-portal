# Ledgerline backend

The Ledgerline invoice API: **Node.js + Express 5**, **Prisma 7** with **SQLite**, and **Nodemailer** for email. This is a self-contained project: it doesn't depend on the frontend folder and can be deployed on its own.

## Run locally

Requirements: Node.js 20.9+ (`.nvmrc` pins 22) and npm.

```bash
cp .env.example .env     # fill in the SMTP values
npm install              # also generates the Prisma client
npm run setup            # creates dev.db, applies migrations, adds a sample invoice
npm run dev              # http://localhost:4000 (restarts on file changes)
```

| Script | Purpose |
|---|---|
| `npm run dev` | Run with auto-reload (tsx) |
| `npm run build` | Generate the Prisma client and bundle the server to `dist/index.js` (esbuild) |
| `npm start` | Apply pending migrations, then run `dist/index.js` |
| `npm test` | Domain and API tests (API tests use a temporary SQLite database and never send email) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:seed` | Add the sample invoice (skips it if it already exists) |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file, e.g. `file:./dev.db` locally or `file:/data/ledgerline.db` on a persistent disk |
| `PORT` | no | Port to listen on. Hosts usually set this; falls back to `API_PORT`, then `4000` |
| `APP_URL` | yes | Public URL of the frontend, used for the "View invoice online" link in emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | for email | SMTP login (Resend: `smtp.resend.com`, `465`, `resend`, API key) |
| `EMAIL_FROM` | for email | Sender as `Name <address>`; with Resend's sandbox use `Acme Studio <onboarding@resend.dev>` |

If SMTP isn't configured, everything works except sending, which returns a clear `503`.

## API

All responses are JSON. Errors use `{ "error": { "message", "fieldErrors"? } }`.

| Method | Path | Purpose | Errors |
|---|---|---|---|
| `GET` | `/api/health` | Health check (`{ "ok": true }`) | |
| `GET` | `/api/invoices` | List invoices with totals and Sent/Draft status | |
| `GET` | `/api/invoices/defaults` | Next invoice number, dates and last sender details | |
| `POST` | `/api/invoices` | Create | `400` validation, `409` duplicate number |
| `GET` | `/api/invoices/:id` | Get one, with totals | `404` |
| `PUT` | `/api/invoices/:id` | Replace an invoice | `400`, `404`, `409` |
| `POST` | `/api/invoices/:id/email` | Email the saved invoice (`{ to, subject, message }`) | `400`, `404`, `502` provider error, `503` not configured |

Every request body is validated with Zod, and totals are always calculated here, never trusted from the client.

## Project structure

```
src/
  index.ts              starts the server (PORT / API_PORT)
  app.ts                Express app: JSON parsing, routes, 404 and error handling
  routes/invoices.ts    /api/invoices endpoints
  invoices.ts, db.ts    data access with Prisma + SQLite
  email/                SMTP mailer and invoice email (HTML + text)
  domain/               money, totals, dates, validation, API types (the source of truth)
  app.test.ts           API tests
prisma/                 schema, migrations, sample data
```

`src/domain/` has a counterpart in `frontend/src/lib/`, which the frontend uses for the live preview. When changing a business rule, update both and run both test suites.

## Deploying (SQLite)

SQLite keeps all data in one file, so the host needs a **persistent disk**, and the API must run as a **single instance** (no autoscaling).

- **Suitable hosts:** Render (with a disk), Railway (with a volume), Fly.io (with a volume), or any VM (Lightsail, EC2, DigitalOcean).
- **Not suitable:** serverless or ephemeral hosts (Lambda, App Runner, Vercel functions, Heroku), where data is lost on restart.

Typical settings:

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` (applies migrations first) |
| Health check | `/api/health` |
| Persistent disk | mounted at e.g. `/data`, with `DATABASE_URL=file:/data/ledgerline.db` |

**Things to know before deploying:**
- **Base image:** use a standard Linux Node image such as `node:22-slim`, not Alpine. `better-sqlite3` ships prebuilt binaries for these.
- **Backups:** use disk snapshots from the host, or Litestream to stream the database to S3.
