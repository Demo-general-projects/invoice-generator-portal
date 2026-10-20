# Ledgerline frontend

The Ledgerline invoice web app: **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4** and **shadcn/ui**. This is a self-contained project: it has no database or email code, and talks to the backend API only over HTTP, so it can be deployed independently.

## Run locally

Requirements: Node.js 20.9+ (`.nvmrc` pins 22) and npm. The backend must be running (see `backend/README.md`).

```bash
cp .env.example .env     # API_URL=http://localhost:4000
npm install
npm run dev              # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Calculation and form-validation tests |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `API_URL` | yes | Base URL of the backend, e.g. `http://localhost:4000` or `https://api.example.com` |

## How it talks to the backend

- **Pages:** the dashboard, new invoice and edit invoice pages load their data from the backend on each request ([`src/lib/api-client.ts`](src/lib/api-client.ts)).
- **Browser requests:** browser code calls `/api/*` on the frontend's own domain, and [`next.config.ts`](next.config.ts) forwards those calls to `API_URL`. The browser never calls the backend directly, so the two can be on different domains without CORS.
- **API down:** if the backend is unreachable, a friendly error page explains it.

## Project structure

```
src/
  app/              pages: invoices dashboard, new and edit invoice, error page
  components/
    dashboard/      sidebar shell and the searchable, sortable invoice table
    invoice/        editor, line items, custom fields, invoice document, email dialog
    ui/             base components (shadcn/ui on Base UI)
  lib/              money, totals, dates, validation, API types, API client, preview
```

`src/lib/` holds a copy of the backend's domain rules (`backend/src/domain/`). Here they power the live preview and instant form errors; the backend re-validates everything and is the source of truth. When changing a business rule, update both copies.

## Deploying

Any host that runs Next.js with server-side rendering works, such as Vercel, AWS Amplify, Netlify or Render.

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` (most hosts detect Next.js automatically) |
| Environment | `API_URL=https://<your-backend-url>` |

**Things to know before deploying:**
- **Rebuild after changing `API_URL`:** it's used in the `/api/*` forwarding, so rebuild whenever it changes.
- **AWS Amplify:** write `API_URL` to `.env.production` during the build (`env | grep -e API_URL >> .env.production`), so the server can read it at runtime.
- **Email links:** set the backend's `APP_URL` to this app's public URL, so links in emails point here.
