# Ledgerline: Customizable Invoice Generator

A browser-based invoice tool for small businesses: create and edit invoices with a live preview, add custom fields, print or save as PDF, store invoices in a database, and email them to customers.

All data in this project is fictional.

> **Branch `Dc-Node`: standalone Node.js backend, independent frontend and backend.**
> Compared with `main` (where the API runs inside Next.js), this branch:
> - moves the API to a standalone **Node.js + Express** server;
> - splits the repository into two self-contained projects, **`frontend/`** (Next.js) and **`backend/`** (Express + SQLite).
>
> Each project has its own `package.json`, lockfile, config, tests, `.env` and README, so each can be built, tested and deployed on its own, on any platform. They communicate only over HTTP. The features and the invoice design are the same as on `main`.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), React Hook Form + Zod |
| Backend | Node.js + Express 5 REST API (TypeScript), Zod validation on the server |
| Database | SQLite via Prisma 7 |
| Email | Nodemailer over SMTP (Resend used for the demo) |
| PDF | Browser Print / Save as PDF with print-specific CSS |
| Tests | Vitest (unit tests), Supertest (API tests), ESLint |

## Features

- **Invoice editor:** business and customer details, invoice number, issue and due dates, and notes.
- **Line items:** add, edit and remove lines with a description, quantity and unit price.
- **Totals in USD:** subtotal, fixed discount, percentage tax and grand total, calculated in integer cents.
- **Custom fields:** add, edit, show/hide and remove label/value pairs. Visible fields appear on the invoice; hidden fields are never shown or printed. Custom fields never affect the totals.
- **Live preview:** the invoice document updates as you type.
- **Print / Save as PDF:** prints only the invoice, with no app controls, notifications or hidden fields. The layout stays the same whichever margin setting Chrome uses, and long invoices continue onto extra pages.
- **Save and retrieve:** invoices are stored in the database and can be reopened after a reload.
- **Invoices dashboard:** search by invoice number or customer, filter by status (Draft / Sent), sort columns, and paginate.
- **Email:** sends the saved invoice to the customer as a formatted email.
- **Validation:**
  - Negative quantities, prices, discounts and tax rates are rejected, and the discount can't exceed the subtotal.
  - Errors appear next to the field.
  - The server re-validates every request.
- **Responsive and accessible:** works on desktop and mobile. Every field has a label, focus is visible, and controls work with the keyboard.

## Architecture

```
Browser ──► frontend/ (Next.js, port 3000) ──HTTP /api/*──► backend/ (Express, port 4000) ──► Prisma ──► SQLite
                                                                       └──► Nodemailer ──► SMTP (Resend)
```

```
invoice-generator/
├── frontend/    Next.js app: pages, UI, live preview, print. See frontend/README.md
├── backend/     Express API: routes, validation, SQLite via Prisma, email. See backend/README.md
└── .github/     CI: one workflow per app, triggered only by changes in its folder
```

- **Independent projects:** neither folder imports from the other, so they can live on different hosts.
- **Connection:** the frontend reaches the backend through `API_URL`. Its `/api/*` routes are forwarded to the backend on the server side, so the browser only talks to the frontend's own domain and no CORS setup is needed.
- **The backend is the source of truth:** it re-validates every request and calculates all totals.
- **Copied domain rules:** money, totals, dates, validation and API types are copied into each project (`backend/src/domain/`, `frontend/src/lib/`) rather than shared. The frontend copy only drives the live preview and instant form errors. Each copy has a "keep in sync" header, and both test suites check the same cases, including the $99.00 example.

**What happens on save and send:**

1. The editor validates the form in the browser and sends integer amounts to `POST /api/invoices` (or `PUT` to update).
2. The backend validates again, saves through Prisma and returns the invoice with server-calculated totals.
3. Send calls `POST /api/invoices/:id/email`. The backend loads the saved invoice, renders the email and sends it over SMTP, so the email always matches what was stored.

## Setup and run

Requirements: Node.js 20.9 or later, and npm. Run each app in its own terminal.

```bash
# Terminal 1: backend (http://localhost:4000)
cd backend
cp .env.example .env     # fill in the SMTP values (see Email setup)
npm install
npm run setup            # creates the SQLite database and adds one sample invoice
npm run dev
```

```bash
# Terminal 2: frontend (http://localhost:3000)
cd frontend
cp .env.example .env     # API_URL=http://localhost:4000
npm install
npm run dev
```

Open <http://localhost:3000>.

## Tests and CI

Run the checks inside each folder:

```bash
npm test             # backend: domain + API tests; frontend: calculation + form-validation tests
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks with one workflow per app (`.github/workflows/backend.yml`, `frontend.yml`). Each workflow runs only when files in its own folder change. CI only checks the code; it does not deploy.

## Storage

- Invoices are stored in **SQLite** (`backend/dev.db`) through **Prisma**. The database file is not committed.
- The schema is in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma): `Invoice`, `LineItem` and `CustomField`.
- Money is stored as integer cents, quantity in hundredths and tax in basis points, so no floating-point rounding errors can occur.
- Totals are always calculated from the line items, never stored separately.

### API (Express, `backend/src/routes/invoices.ts`)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/invoices` | List invoices |
| `GET` | `/api/invoices/defaults` | Suggested number, dates and sender details for a new invoice |
| `POST` | `/api/invoices` | Create an invoice |
| `GET` | `/api/invoices/:id` | Get one invoice |
| `PUT` | `/api/invoices/:id` | Update an invoice |
| `POST` | `/api/invoices/:id/email` | Email a saved invoice |

## Environment variables

Each app has its own `.env` (gitignored) and `.env.example`.

| App | Variable | Purpose |
|---|---|---|
| backend | `DATABASE_URL` | SQLite file: `file:./dev.db` locally, a persistent-disk path when hosted |
| backend | `PORT` / `API_PORT` | Port to listen on (hosts usually set `PORT`; `API_PORT` is the local default, 4000) |
| backend | `APP_URL` | Frontend's public URL, used for the "View invoice online" link in emails |
| backend | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Email sending; `EMAIL_FROM` must be `Name <address>` |
| frontend | `API_URL` | Base URL of the backend |

## Deployment

The two apps deploy separately; set each host's root directory to the app's folder.

| App | Suitable hosts | Build | Start | Key settings |
|---|---|---|---|---|
| `backend/` | Render (disk), Railway (volume), Fly.io (volume), any VM | `npm ci && npm run build` | `npm start` (applies migrations first) | `DATABASE_URL` on a persistent disk, `APP_URL`, SMTP values |
| `frontend/` | Vercel, AWS Amplify, Netlify, Render | `npm ci && npm run build` | `npm start` (or the host's Next.js runtime) | `API_URL` = the backend's public URL |

Because SQLite is a single file, the backend needs a persistent disk and must run as a single instance. Full steps are in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

## Email setup

Email is sent by the Express API over SMTP, so any provider works. Credentials stay on the server in `.env` and are never sent to the browser.

**Resend (used for the demo):**

1. Sign up at <https://resend.com> and verify your email address.
2. Create an API key with **Sending access**.
3. Add it to `backend/.env`:

```env
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="your-resend-api-key"
EMAIL_FROM="Acme Studio <onboarding@resend.dev>"
```

4. Restart the backend (`npm run dev` in `backend/`), open an invoice and click **Send**.

Without a verified domain, Resend only delivers to your own account email, which suits testing. Other SMTP providers, such as Gmail with an app password, work the same way.

## Calculation

```
line total = round(quantity × unit price)     each line rounded to cents
subtotal   = sum of line totals
taxable    = subtotal − discount               discount cannot exceed subtotal
tax        = round(taxable × tax rate)
total      = taxable + tax
```

Example from the brief: 2 × $50 − $10 discount + 10% tax = **$99.00**. This is covered by a unit test and is used as the sample invoice.

## Design decisions

- **Visual style:** a clean financial SaaS interface (Inter font, cool neutrals, one deep-teal accent) around a professional invoice document (serif headings, aligned figures, an "Amount due" summary).
- **Preview matches print:** the preview is the same Letter-size document that gets printed, so the PDF looks exactly like the screen.
- **Reliable printing:** the invoice includes its own page margins, so it prints correctly under Chrome's Default, None or Minimum margin settings.
- **Single form instead of tabs:** section links at the top jump through one scrolling form, so a validation error is never hidden on another tab.
- **Same validation in both apps:** the same rules run in the browser (for instant feedback) and on the server (as the final check). Each app keeps its own copy, so neither depends on the other.
- **Separate projects instead of one Next.js app:** the frontend and backend can be hosted, scaled and released independently, with the API reachable by any client.
- **Focused scope:** only features supported by real data were built. For example, Sent/Draft status comes from whether the invoice was emailed; there is no payment tracking.

## AI tools used

Built with **Claude Code** (Anthropic) as a pair programmer.

- **What it did:** scaffolded the project, drafted components and tests, and checked the result in a real browser, including desktop and mobile layouts, keyboard access and printed PDFs.
- **What I owned:** the requirements, design direction and key decisions, such as integer-cents money handling, the rounding order, shared validation and scope. I reviewed the code and can explain any part of it.

## Time spent

About 3 hours in total for the exercise, within the 3-hour limit. The standalone backend and the frontend/backend split on this branch were added afterwards as a follow-up.

## Unfinished work and limitations

- **No PDF attachment in emails:** the email contains the full invoice and a link to view it online. PDF export is done through the browser.
- **No authentication,** as the brief allows.
- **SQLite hosting needs a persistent disk:** the backend must run as a single instance on a host with persistent storage, such as Render with a disk, Railway with a volume, Fly.io or a VM. The frontend can run anywhere that supports Next.js. Both READMEs have the details.
- **No rate limiting** on the email endpoint.
- **Client-side dashboard filtering:** fine at this scale. Large datasets would need search and pagination on the server.
- **Not built:** deleting or duplicating invoices, bulk actions, logo upload, currencies other than USD, and dark mode.
- **Tests:** the backend covers domain logic and API routes (against a temporary SQLite database); the frontend covers its copy of the calculations and form validation. The UI was tested manually in the browser.
