# Ledgerline: Customizable Invoice Generator

A browser-based invoice editor for small businesses. You can edit an invoice with a live preview, add custom fields, print it or save it as a PDF, store it in SQLite, and email it over SMTP.

Built for the full-stack interview exercise in about 3 hours. The data is fictional.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7%20%2B%20SQLite-2d3748)

## Features

- **Invoice editor:** business and customer details, invoice number, issue and due dates, and notes.
- **Line items:** add, edit and remove lines with a description, quantity (up to 2 decimals) and unit price. Each line's amount updates as you type.
- **USD totals:** subtotal, a fixed discount, a percentage tax and the grand total, calculated in integer cents (see [Calculations](#calculations)).
- **Custom fields:** add, edit, show/hide and remove label/value pairs. Visible fields appear in the invoice's details block. Hidden fields are saved but never shown or printed, and custom fields never change the totals.
- **Live preview:** the invoice is laid out as a Letter-size document and scaled to fit any screen.
- **Print / Save as PDF:** uses the browser's print dialog. Only the invoice document prints, with no app controls and no hidden fields.
- **Save and retrieve:** invoices are stored in SQLite. After saving, the URL changes to `/invoices/:id`, so reloading the page restores the invoice. `/invoices` lists all invoices with their totals and a Sent/Draft status.
- **Email:** sends the saved invoice as a styled HTML email with a plain-text alternative, over any SMTP provider.
- **Validation:** the same Zod rules run in the browser and on the server. Negative quantities, prices, discounts and tax rates are rejected, a discount larger than the subtotal is rejected, and the due date can't be before the issue date. Errors appear inline next to the field, and focus moves to the first invalid field.
- **Responsive and accessible:**
  - Two panes on desktop. On mobile, an Edit/Preview switch with a sticky bar showing the total.
  - Every input has a label, focus is always visible, and colors meet WCAG AA contrast.
  - Icon buttons have names such as "Remove item 2".
  - Animations are reduced when the system asks for reduced motion.

## Run it locally

Requirements: Node 20.9+ (tested on Node 22) and npm.

```bash
cp .env.example .env     # then fill in the SMTP values (see Email below)
npm install              # also generates the Prisma client
npm run setup            # creates dev.db, applies migrations, seeds one fictional invoice
npm run dev              # http://localhost:3000
```

Other scripts:

| Command | What it does |
|---|---|
| `npm test` | Unit tests (Vitest) for money parsing, totals and validation |
| `npm run build && npm start` | Production build |
| `npm run lint` | ESLint |

## Storage

- **Database:** SQLite through Prisma 7 and the `better-sqlite3` driver adapter. The database file is `dev.db` in the project root (from `DATABASE_URL`) and is gitignored.
- **Schema:** [`prisma/schema.prisma`](prisma/schema.prisma). An `Invoice` has many `LineItem`s and many `CustomField`s; both are ordered by `position` and deleted along with the invoice.
- **Number formats:**
  - Money is stored as integer cents.
  - Quantity is stored in hundredths (`1.5` → `150`).
  - Tax is stored in basis points (`8.25%` → `825`).
  - Dates are stored as `YYYY-MM-DD` strings, so they can't shift between timezones.
- **Totals are never stored.** They are recalculated from the line items every time, so there is a single source of truth.
- **Updates are atomic.** An update replaces the invoice and its children in one write.

### API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/invoices` | List with computed totals |
| `POST` | `/api/invoices` | Create → `201`. Returns `400` with field errors, or `409` if the invoice number is taken |
| `GET` | `/api/invoices/:id` | Returns `{ invoice, totals }` or `404` |
| `PUT` | `/api/invoices/:id` | Full update; same errors as `POST` |
| `POST` | `/api/invoices/:id/email` | `{ to, subject, message }`. Returns `502` if the provider fails, `503` if SMTP isn't configured |

Every error has the shape `{ error: { message, fieldErrors? } }`. The server re-validates every request and recalculates totals itself, so it never trusts numbers sent by the browser.

## Email

Email is sent with [Nodemailer](https://nodemailer.com) over SMTP, so any provider works. Credentials are read from `.env` on the server only, and none of them use the `NEXT_PUBLIC_` prefix, so they never reach the browser.

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"            # 465 = implicit TLS, 587 = STARTTLS
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="Invoices <invoices@example.com>"
APP_URL="http://localhost:3000"   # used for the "View invoice online" link
```

Example setups (the end-to-end send in this repo was verified with Ethereal):

- **Resend SMTP:** host `smtp.resend.com`, port `465`, user `resend`, password = your API key. With the shared `onboarding@resend.dev` sender, Resend only delivers to your own account email.
- **Gmail:** `smtp.gmail.com`, port `465`, with an [app password](https://support.google.com/accounts/answer/185833).
- **Ethereal** (a fake inbox for testing; nothing is delivered): create an account at <https://ethereal.email>, then use `smtp.ethereal.email`, port `587`. Sent messages appear in the Ethereal web inbox.

How sending works:

- **Only saved invoices are sent.** The send route loads the invoice from the database, so the email always matches what was stored. If there are unsaved edits, the editor saves first.
- **Recipient and message:** the recipient defaults to the customer's email, and you can change it along with the subject and an optional message.
- **Escaping:** every user-entered string is HTML-escaped in the email.
- **Errors:** if the provider fails or SMTP isn't configured, the dialog shows a clear error. A failed send is never reported as a success.
- **Status:** a successful send sets `lastSentAt`, which shows as "Sent" in the list.

## Calculations

The order follows the brief exactly:

```
line      = round(quantity × unitPrice)          // each line rounded to cents
subtotal  = Σ lines
taxable   = subtotal − discount                  // fixed discount, ≤ subtotal
tax       = round(taxable × taxRate)             // tax after the discount
total     = taxable + tax
```

- **Integers only.** Inputs are parsed from strings straight into integers ([`src/lib/money.ts`](src/lib/money.ts)), so `parseFloat` is never used on money.
- **Rounding:** half up, done in integer arithmetic.
- **Limits:** upper bounds keep every intermediate value well inside `Number.MAX_SAFE_INTEGER`.
- **Tested:** the brief's example, 2 × $50 − $10 discount + 10% tax, gives **$99.00**. This is a unit test, and it's also the seeded invoice.

## Design decisions

- **Look and feel:** "editorial finance". Warm neutral surfaces, one deep-teal accent, Geist for the interface, Instrument Serif for the document's headline and business name, and `tabular-nums` on every amount. The invoice reads as a printed business document, while the app around it stays quiet.
- **One source for preview and print.** The preview is the actual Letter-size document (816 px wide), scaled with CSS `zoom` to fit its column. Printing resets the zoom, so the PDF matches the preview exactly.
- **One scrolling form instead of tabs.** Section links at the top work like tabs, but every field stays reachable, so a validation error is never hidden on another tab.
- **Line items adapt to their container,** not just the viewport: a table-style grid when there's room, stacked cards when there isn't.
- **Forgiving preview.** It renders whatever has been typed so far. A number that isn't valid yet shows "—" instead of a misleading amount.
- **Small conveniences:**
  - New invoices suggest the next number and reuse your business details from the last invoice.
  - Custom fields offer quick suggestions (PO number, Project, Payment terms).
  - The browser warns before you leave with unsaved changes.
- **Primitives:** shadcn/ui (on Base UI) is used only for the dialog, switch and buttons, all restyled. Everything else is custom.
- **Next.js setting:** Cache Components is turned off. Every page reads data that changes per request, so caching would add complexity without benefit.

## Project structure

```
prisma/                       schema, migrations, fictional seed
src/app/
  invoices/                   list, new and edit pages (server components)
  api/invoices/               REST route handlers
src/components/invoice/       editor, line items, custom fields, document, email dialog
src/lib/
  money.ts / totals.ts        integer parsing and calculations (+ tests)
  invoice-schema.ts           shared Zod schemas for the form and the API (+ tests)
  preview.ts                  lenient amounts for the live preview
  invoices.ts                 data access (Prisma ↔ domain objects)
  email/                      SMTP mailer and HTML/text email rendering
```

## AI tools used

I built this with **Claude Code** (Anthropic, Claude Opus 5.5) as a pair programmer. It scaffolded the project, drafted components and tests, and checked the rendered UI in Chrome through DevTools automation (screenshots at desktop and mobile sizes, plus a headless print-to-PDF check).

I reviewed every decision: the integer-cents model, the rounding order, the shared validation, the API shape and the design direction. A design mock-up served as visual reference only. I can walk through any part of the code.

## Time spent

About **X h XX min** in total, inside the 3-hour cap. The git history has one commit per milestone:

1. Scaffold (Next.js 16, Tailwind 4, Prisma 7)
2. Money, totals and validation, with tests
3. Editor, live preview, persistence API
4. SMTP email
5. Invoice list, polish, README

## Unfinished work and known limitations

- **No PDF attachment in emails.** Attaching one would need server-side rendering (e.g. headless Chrome). Instead, the email contains the full invoice plus a link to it. Browser print covers PDF export.
- **Single user with no authentication,** as the brief allows. Anyone who can reach the server can read and edit invoices.
- **Runs locally only.** SQLite isn't a good fit for serverless hosting. Moving to Postgres means changing the Prisma `provider` and the driver adapter.
- **No rate limiting** on the email endpoint.
- **Not built:** deleting or duplicating invoices, reordering line items by drag and drop, a company logo upload, currencies other than USD, and dark mode.
- **No automated tests for the API routes or UI.** These were tested by hand and in the browser; the unit tests cover the money, totals and validation logic.
