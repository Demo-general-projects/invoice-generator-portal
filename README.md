# Ledgerline: Customizable Invoice Generator

A browser-based invoice tool for small businesses: create and edit invoices with a live preview, add custom fields, print or save as PDF, store invoices in a database, and email them to customers.

All data in this project is fictional.

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
Browser ──► Next.js frontend (port 3000) ──/api/* proxy──► Express API (port 4000) ──► Prisma ──► SQLite (dev.db)
                                                                    └──► Nodemailer ──► SMTP (Resend)
```

- **`server/`**: the Node.js backend. Express routes, data access, and email sending. It is the only part that touches the database or SMTP credentials.
- **`src/`**: the Next.js frontend. Pages load data from the API, and the browser calls `/api/*`, which Next.js forwards to Express, so no CORS setup is needed.
- **`src/lib/`**: code shared by both sides, including money handling, totals, validation rules and API types, so the browser and server always apply the same rules.

## Setup and run

Requirements: Node.js 20.9 or later, and npm.

```bash
cp .env.example .env     # fill in the SMTP values (see Email setup)
npm install
npm run setup            # creates the SQLite database and adds one sample invoice
npm run dev              # starts the API (port 4000) and the web app (port 3000)
```

Open <http://localhost:3000>.

| Command | Purpose |
|---|---|
| `npm run dev` | Run API and frontend together (`dev:api` / `dev:web` run them separately) |
| `npm test` | Run unit and API tests |
| `npm run lint` | Lint the code |
| `npm run build && npm start` | Production build of the frontend, then start API and frontend |

## Storage

- Invoices are stored in **SQLite** (`dev.db` in the project root) through **Prisma**. The database file is not committed.
- The schema is in [`prisma/schema.prisma`](prisma/schema.prisma): `Invoice`, `LineItem` and `CustomField`.
- Money is stored as integer cents, quantity in hundredths and tax in basis points, so no floating-point rounding errors can occur.
- Totals are always calculated from the line items, never stored separately.

### API (Express, `server/routes/invoices.ts`)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/invoices` | List invoices |
| `GET` | `/api/invoices/defaults` | Suggested number, dates and sender details for a new invoice |
| `POST` | `/api/invoices` | Create an invoice |
| `GET` | `/api/invoices/:id` | Get one invoice |
| `PUT` | `/api/invoices/:id` | Update an invoice |
| `POST` | `/api/invoices/:id/email` | Email a saved invoice |

## Email setup

Email is sent by the Express API over SMTP, so any provider works. Credentials stay on the server in `.env` and are never sent to the browser.

**Resend (used for the demo):**

1. Sign up at <https://resend.com> and verify your email address.
2. Create an API key with **Sending access**.
3. Add it to `.env`:

```env
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"
SMTP_USER="resend"
SMTP_PASS="your-resend-api-key"
EMAIL_FROM="Acme Studio <onboarding@resend.dev>"
APP_URL="http://localhost:3000"
API_PORT="4000"                 # Express API port
API_URL="http://localhost:4000" # where the frontend sends /api/* requests
```

4. Restart `npm run dev`, open an invoice and click **Send**.

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
- **Shared validation:** the same rules run in the browser and on the server.
- **Focused scope:** only features supported by real data were built. For example, Sent/Draft status comes from whether the invoice was emailed; there is no payment tracking.

## AI tools used

Built with **Claude Code** (Anthropic) as a pair programmer.

- **What it did:** scaffolded the project, drafted components and tests, and checked the result in a real browser, including desktop and mobile layouts, keyboard access and printed PDFs.
- **What I owned:** the requirements, design direction and key decisions, such as integer-cents money handling, the rounding order, shared validation and scope. I reviewed the code and can explain any part of it.

## Time spent

About 3 hours in total, within the 3-hour limit.

## Unfinished work and limitations

- **No PDF attachment in emails:** the email contains the full invoice and a link to view it online. PDF export is done through the browser.
- **No authentication,** as the brief allows.
- **Runs locally:** SQLite suits local use. For hosting, the Express API would run on a Node host (e.g. Render or Railway), the frontend on Vercel with `API_URL` pointing at the API, and the database would move to Postgres (only a Prisma provider and adapter change).
- **No rate limiting** on the email endpoint.
- **Client-side dashboard filtering:** fine at this scale. Large datasets would need search and pagination on the server.
- **Not built:** deleting or duplicating invoices, bulk actions, logo upload, currencies other than USD, and dark mode.
- **Tests cover the money, totals and validation logic, plus the API routes** (run against a temporary SQLite database). The UI was tested manually in the browser.
