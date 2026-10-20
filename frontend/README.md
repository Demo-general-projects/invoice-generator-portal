# Ledgerline frontend

The Ledgerline invoice web app: **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4** and **shadcn/ui**. It builds to **plain static files** (HTML, CSS, JS) that the Laravel backend serves from `/app`. It has no database or email code and talks to the API only over HTTP.

## Run locally

Requirements: Node.js 20.9+ (`.nvmrc` pins 22) and npm. The Laravel backend must be running (see `backend/README.md`).

```bash
cp .env.example .env     # API_URL=http://localhost:8000
npm install
npm run dev              # http://localhost:3000/app/
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server; forwards `/api/*` to `API_URL` |
| `npm run build` | Static export to `out/` (Laravel's `php artisan frontend:build` runs this and copies the result) |
| `npm test` | Calculation and form-validation tests |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## Environment variables

| Variable | When | Purpose |
|---|---|---|
| `API_URL` | `npm run dev` | Where the dev server forwards `/api/*`, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | `npm run build` (optional) | An API on another domain, if this app is hosted separately. Leave unset when Laravel serves it |

## How it works with the backend

- **Static export:** `next build` writes every page as HTML to `out/`, under the base path `/app` (see [`next.config.ts`](next.config.ts)). No Node.js server is needed in production.
- **Data loads in the browser:** each page fetches from `/api/...` after it opens ([`src/lib/api-client.ts`](src/lib/api-client.ts)), showing a loading state and a friendly error with **Try again** if the API can't be reached.
- **Invoice addresses:** a static export can't have a page per invoice, so invoices open at `/app/invoices/edit/?id=…` ([`src/lib/routes.ts`](src/lib/routes.ts)). `&action=print` or `&action=email` opens the print dialog or the email dialog.
- **Same domain:** in production Laravel serves both these files and the API, so requests to `/api` need no CORS. In development, `npm run dev` forwards `/api/*` to Laravel.

## Project structure

```
src/
  app/              pages: start page, invoices dashboard, new invoice, edit invoice, error page
  components/
    dashboard/      sidebar shell, dashboard page and the searchable, sortable invoice table
    invoice/        editor, new/edit page loaders, line items, custom fields, invoice document, email dialog
    ui/             base components (shadcn/ui on Base UI)
    load-state.tsx  loading, error and not-found screens
  lib/              money, totals, dates, validation, API types, API client, routes, preview
```

`src/lib/` repeats the backend's business rules (`backend/app/Domain/`, `backend/app/Http/Requests/InvoiceRequest.php`). Here they power the live preview and instant form errors; the backend re-validates everything and is the source of truth. When changing a business rule, update both.

## Deploying

Normally you don't deploy this folder on its own: `php artisan frontend:build` in `backend/` builds it into Laravel's `public/app`.

To host it separately on a static host (Netlify, S3 + CloudFront, Vercel, Amplify):

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Output directory | `out` (served under `/app`) |
| Environment | `NEXT_PUBLIC_API_URL=https://<your-laravel-domain>` |

Laravel's default CORS settings already accept `/api/*` requests from any origin. To limit them to this site, run `php artisan config:publish cors` in `backend/` and set `allowed_origins`.
