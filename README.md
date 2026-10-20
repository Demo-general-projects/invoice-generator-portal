# Ledgerline: Customizable Invoice Generator

A browser-based invoice tool for small businesses. You can create and edit invoices with a live preview, add custom fields, print them or save them as a PDF, store them in SQLite, and email them over SMTP.

Built for the full-stack interview exercise within the 3-hour cap. All data is fictional.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7%20%2B%20SQLite-2d3748)

## Features

- **Invoices dashboard** (`/invoices`)
  - Lists every saved invoice with its number, customer, amount, Sent/Draft status, item count and due date.
  - Search by invoice number or customer, filter by status (All / Draft / Sent) and sort by any column. Pages of 10, 25 or 50.
  - Each row's actions menu offers Edit, Print / Save PDF and Send by email.
- **Invoice editor:** business and customer details, invoice number, issue and due dates, and notes.
- **Line items:** add, edit and remove lines with a description, quantity (up to 2 decimals) and unit price. Each line's amount updates as you type.
- **USD totals:** subtotal, a fixed discount, a percentage tax and the grand total, calculated in integer cents (see [Calculations](#calculations)).
- **Custom fields:**
  - Add, edit, show/hide and remove label/value pairs.
  - Visible fields appear in the invoice's Details block; hidden fields are saved but never shown or printed.
  - Custom fields never change the totals.
- **Live preview:** the actual Letter-size invoice document, scaled to fit any screen.
- **Print / Save as PDF:** uses the browser's print dialog.
  - Only the invoice prints: no app controls, notifications or hidden fields.
  - The layout is the same whichever Margins option is chosen in Chrome.
  - Long invoices flow onto extra pages, with the table header repeated.
  - "Save as PDF" suggests a file name like `INV-0001 · Acme Studio`.
- **Save and retrieve:** invoices are stored in SQLite. After saving, the URL changes to `/invoices/:id`, so reloading the page restores the invoice.
- **Email:** sends the saved invoice as a styled HTML email with a plain-text alternative, over any SMTP provider.
- **Validation:**
  - The same Zod rules run in the browser and on the server.
  - Negative quantities, prices, discounts and tax rates are rejected.
  - A discount larger than the subtotal is rejected, and the due date can't be before the issue date.
  - Errors appear inline next to the field, and focus moves to the first invalid field.
- **Responsive and accessible:**
  - **Layout:** a sidebar dashboard and a two-pane editor on desktop. On mobile, invoice cards, an Edit/Preview switch and a sticky bar showing the total.
  - **Labels and focus:** every input has a label, focus is always visible, and colors meet WCAG AA contrast.
  - **Screen readers:** icon buttons have names such as "Remove item 2", and sortable columns announce their sort order.
  - **Motion:** animations are reduced when the system asks for reduced motion.

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
- **Status:** "Sent" means the invoice has been emailed at least once (`lastSentAt`). Payment status isn't tracked.

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
EMAIL_FROM="Invoices <invoices@example.com>"   # must be "Name <address>" or a bare address
APP_URL="http://localhost:3000"                # used for the "View invoice online" link
```

### Setting up Resend (used for the demo)

1. Sign up at <https://resend.com> and verify your email address.
2. Under **API Keys**, create a key with **Sending access**.
3. Fill in `.env`:

   ```env
   SMTP_HOST="smtp.resend.com"
   SMTP_PORT="465"
   SMTP_USER="resend"
   SMTP_PASS="re_…"                                  # your API key
   EMAIL_FROM="Acme Studio <onboarding@resend.dev>"
   ```

4. Restart `npm run dev`, open an invoice, click **Send**, and send it to the address you signed up with.

Without a verified domain, Resend only delivers to your own account email. That suits this exercise, since tests should only go to an address you control.

Other providers work the same way. For Gmail, use `smtp.gmail.com`, port `465` and an [app password](https://support.google.com/accounts/answer/185833). Ethereal (`smtp.ethereal.email`, port `587`) captures messages in a web inbox without delivering them.

### How sending works

- **Only saved invoices are sent.** The send route loads the invoice from the database, so the email always matches what was stored. If there are unsaved edits, the editor saves first.
- **Recipient and message:** the recipient defaults to the customer's email, and you can change it along with the subject and an optional message.
- **Escaping:** every user-entered string is HTML-escaped in the email.
- **Errors:** the dialog shows a clear error and never reports a failed send as a success. This covers a provider failure, missing SMTP settings, and an `EMAIL_FROM` without an address.
- **Status:** a successful send sets `lastSentAt`, which shows as "Sent" on the dashboard.

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

- **Visual direction: a calm financial SaaS around an editorial document.**
  - **Interface:** Inter, cool neutral surfaces and a single deep-teal accent.
  - **Invoice document:** Instrument Serif for its headline and business name, and `tabular-nums` on every amount so figures line up.
- **Dashboard modelled on a reference SaaS invoice list.** It has a fixed sidebar, a slim header, a toolbar and a dense table with sortable columns, status badges and a row actions menu.
  - Every control works.
  - Elements with nothing behind them were left out: unrelated navigation, bulk-select checkboxes, CSV export and payment statuses.
- **Invoice layout:** a summary band (Billed to · Details · Amount due) answers "who, when, how much" before the line items. A footer repeats the sender and invoice number.
- **One source for preview and print.** The preview is the actual Letter-size document (816 px wide), scaled with CSS `zoom` to fit its column. Printing resets the zoom, so the PDF matches the preview.
- **Print that doesn't depend on browser settings.**
  - The page margin is `0` and the document's own padding acts as the margin, repeated on every page with `box-decoration-break: clone`.
  - So "Default", "None" and "Minimum" all produce the same result, and Chrome adds no URL/date header.
  - The toast library's styles are unlayered and override Tailwind's `print:hidden`, so an unlayered print rule hides toasts instead.
- **One scrolling form instead of tabs.** Section links at the top work like tabs, but every field stays reachable, so a validation error is never hidden on another tab.
- **Line items adapt to their container,** not just the viewport: a table-style grid when there's room, stacked cards when there isn't.
- **Forgiving preview.** It renders whatever has been typed so far. A number that isn't valid yet shows "—" instead of a misleading amount.
- **Small conveniences:**
  - New invoices suggest the next number and reuse your business details from the last invoice.
  - Custom fields offer quick suggestions (PO number, Project, Payment terms).
  - The browser warns before you leave with unsaved changes.
  - Press `/` on the dashboard to jump to search.
- **Primitives:** shadcn/ui (on Base UI) is used only for the dialog, switch, dropdown menu and buttons, all restyled. Everything else is custom.
- **Next.js setting:** Cache Components is turned off. Every page reads data that changes per request, so caching would add complexity without benefit.

## Project structure

```
prisma/                       schema, migrations, fictional seed
src/app/
  invoices/                   dashboard, new and edit pages (server components)
  api/invoices/               REST route handlers
src/components/dashboard/     sidebar shell and the searchable, sortable invoice table
src/components/invoice/       editor, line items, custom fields, invoice document, email dialog
src/lib/
  money.ts / totals.ts        integer parsing and calculations (+ tests)
  invoice-schema.ts           shared Zod schemas for the form and the API (+ tests)
  preview.ts                  lenient amounts for the live preview
  invoices.ts                 data access (Prisma ↔ domain objects)
  email/                      SMTP mailer and HTML/text email rendering
```

## AI tools used

Built with **Claude Code** (Anthropic, Claude Opus 5.5) as a pair programmer.

- **What it did:** scaffolded the project, drafted the components and tests, and checked its own work in a real browser through Chrome DevTools automation. That meant screenshots at desktop and mobile sizes, keyboard and focus checks, and PDFs printed with Chrome's print engine, including a 40-line invoice and several margin settings.
- **How it found the print bugs:** by checking real output rather than assuming. One check showed toasts appearing in the PDF; another showed the page being clipped with Margins set to "None".
- **What I owned:** the requirements, the direction and every decision. That covers the integer-cents model, the rounding order, the shared validation, the API shape, the scope cuts and the visual direction, which was guided by reference screenshots. I reviewed the code and can walk through any part of it.

## Time spent

About **X h XX min** in total, inside the 3-hour cap (started 18:26). Commit times show the progression:

| Time | Milestone |
|---|---|
| 18:32 | Scaffold: Next.js 16, Tailwind 4, Prisma 7 + SQLite |
| 18:33 | Integer-cents money, totals and shared validation, with tests |
| 18:40 | Invoice editor, live preview, persistence API, seed |
| 18:43 | SMTP email |
| 18:46 | Invoice list and first README |
| 19:14–19:20 | UI/UX audit of the running app; found the toast-in-print bug |
| 19:32–19:46 | Dashboard redesign: sidebar, search, status filter, sorting, pagination, row actions |
| 19:57 | Invoice document redesign; print independent of margin settings |
| 20:21 | Real email delivery verified via Resend; `EMAIL_FROM` validation |

## Unfinished work and known limitations

- **No PDF attachment in emails.** Attaching one would need server-side rendering (e.g. headless Chrome). Instead, the email contains the full invoice plus a link to it. Browser print covers PDF export.
- **Single user with no authentication,** as the brief allows. Anyone who can reach the server can read and edit invoices.
- **Runs locally only.** SQLite isn't a good fit for serverless hosting. Moving to Postgres means changing the Prisma `provider` and the driver adapter.
- **No rate limiting** on the email endpoint.
- **Dashboard filtering runs in the browser.** That's fine at this scale; with thousands of invoices, search, sorting and pagination should move to the API.
- **Editor polish not done:**
  - The Send dialog doesn't summarise the invoice being sent.
  - Hidden custom-field rows look faded rather than clearly marked.
  - The live preview's small text is about 9 px on a 1440 px screen.
- **Not built:** deleting or duplicating invoices, bulk actions, reordering line items by drag and drop, a company logo upload, currencies other than USD, and dark mode.
- **No automated tests for the API routes or UI.** These were tested by hand and in the browser; the unit tests cover the money, totals and validation logic.
