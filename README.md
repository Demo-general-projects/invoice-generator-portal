# Ledgerline: Customizable Invoice Generator

A browser-based invoice tool for small businesses: create and edit invoices with a live preview, add custom fields, print or save as PDF, store invoices in a database, and email them to customers.

All data in this project is fictional.

> **Branch `Dc-Laravel`.** The app runs as one **Laravel 13 (PHP 8.3)** application with **SQLite**. Laravel provides the API and serves the **Next.js** frontend, built as static files, from `backend/public/app`, so everything runs on one domain.
> `frontend/` and `backend/` are separate projects, each with its own dependencies, tests and README.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), React Hook Form + Zod |
| Backend | Laravel 13 REST API (PHP 8.3), Form Request validation, Eloquent |
| Database | SQLite |
| Email | Laravel Mail over SMTP (Resend used for the demo) |
| PDF | Browser Print / Save as PDF with print-specific CSS |
| Tests | PHPUnit (backend unit and API tests), Vitest (frontend), Laravel Pint and ESLint |

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
Browser ──► Laravel (backend/, one domain)
              ├── /app/*   the frontend: static HTML, CSS and JS in public/app
              ├── /api/*   JSON API (routes/api.php) ──► Eloquent ──► SQLite
              │                                   └──► Laravel Mail ──► SMTP (Resend)
              └── /        redirects to /app/invoices/
```

```
invoice-generator/
├── frontend/    Next.js app: pages, UI, live preview, print. Builds to static files. See frontend/README.md
├── backend/     Laravel app: API, validation, SQLite, email, and hosting of the built frontend. See backend/README.md
└── .github/     CI: one workflow per app, triggered only by changes in its folder
```

- **One app to host:** `php artisan frontend:build` builds the frontend and copies it into `backend/public/app`. Laravel then serves the pages and the API from the same domain, so no CORS or proxy is needed.
- **Separate projects:** neither folder imports code from the other. The frontend calls the API only over HTTP and could also be hosted on its own (see [`frontend/README.md`](frontend/README.md)).
- **The backend is the source of truth:** it re-validates every request and calculates all totals.
- **Rules in both apps:** money, totals and validation rules exist in PHP (`backend/app/Domain/`, `backend/app/Http/Requests/`) and in TypeScript (`frontend/src/lib/`). The frontend copy only drives the live preview and instant form errors. Both test suites check the same cases, including the $99.00 example.
- **Pages load data in the browser:** the frontend is a static export, so each page fetches its data from `/api` after it opens. An invoice opens at `/app/invoices/edit/?id=…`.

**What happens on save and send:**

1. The editor validates the form in the browser and sends integer amounts to `POST /api/invoices` (or `PUT` to update).
2. Laravel validates again, saves the invoice, its line items and custom fields in one transaction, and returns the invoice with server-calculated totals.
3. Send calls `POST /api/invoices/{id}/email`. Laravel loads the saved invoice, renders the email and sends it over SMTP, so the email always matches what was stored.

## Run on localhost

### Requirements

- **PHP 8.3 or later** with the `pdo_sqlite` extension, and **Composer**. Check with `php -v` and `composer -V`.
- **Node.js 20.9 or later** and **npm**, to build the frontend. Check with `node -v`.
- **Git**, to clone the repository.
- **SMTP login (optional):** only needed to send emails. Everything else works without it.

### 1. Get the code

```bash
git clone https://github.com/Demo-general-projects/invoice-generator.git
cd invoice-generator
git checkout Dc-Laravel
```

### 2. Set up the backend (once)

```bash
cd backend
composer install            # downloads Laravel's packages into backend/vendor
composer setup              # creates .env, an app key, the SQLite database and a sample invoice (INV-0001)
```

To send emails, add your SMTP details to `backend/.env` (see [Email setup](#email-setup)).

### 3. Build the frontend into Laravel (once, and after frontend changes)

```bash
php artisan frontend:build  # runs npm ci and npm run build in ../frontend, then copies the result to public/app
```

### 4. Start the app

```bash
php artisan serve           # http://localhost:8000
```

Open <http://localhost:8000>. The invoices dashboard opens and shows the sample invoice INV-0001 ($99.00). Click **New invoice** to create one. To check the API alone, open <http://localhost:8000/api/health>, which returns `{"ok":true}`.

Press `Ctrl + C` to stop. Invoices stay in `backend/database/database.sqlite` between runs. Next time, only step 4 is needed.

### Working on the frontend (optional)

To see frontend changes instantly instead of rebuilding, run the Next.js dev server next to Laravel:

```bash
# Terminal 1
cd backend && php artisan serve          # API on http://localhost:8000

# Terminal 2
cd frontend
cp .env.example .env                     # API_URL=http://localhost:8000
npm install
npm run dev                              # app on http://localhost:3000/app/
```

The dev server forwards `/api/*` to Laravel. When you're done, run `php artisan frontend:build` again so Laravel serves the latest version.

### Troubleshooting

- **The page says "The frontend has not been built yet":** run `php artisan frontend:build` in `backend/`.
- **The app says it can't reach the API:** the backend isn't running. Start it with `php artisan serve`, then reload the page.
- **"Port already in use":** another process is using port 8000. Run `php artisan serve --port=8001` and set `APP_URL=http://localhost:8001` in `backend/.env`.
- **Sending email returns "not configured":** set `MAIL_MAILER=smtp` and the other `MAIL_*` values in `backend/.env`, then restart `php artisan serve`.
- **Start again with an empty database:** run `php artisan migrate:fresh --seed` in `backend/`.

## Tests and CI

```bash
cd backend
php artisan test       # PHPUnit: totals and money rules, plus every API endpoint against an in-memory SQLite database
composer lint          # Laravel Pint code style check

cd ../frontend
npm test               # Vitest: calculations and form validation
npm run lint
npm run typecheck
npm run build          # static export to frontend/out
```

GitHub Actions runs these checks with one workflow per app (`.github/workflows/backend.yml`, `frontend.yml`). Each workflow runs only when files in its own folder change. CI only checks the code; it does not deploy.

## Storage

- Invoices are stored in **SQLite** (`backend/database/database.sqlite`) through **Eloquent**. The database file is not committed.
- The schema is in [`backend/database/migrations/`](backend/database/migrations/): `invoices`, `line_items` and `custom_fields`.
- Money is stored as integer cents, quantity in hundredths and tax in basis points, so no floating-point rounding errors can occur.
- Totals are always calculated from the line items ([`backend/app/Domain/Totals.php`](backend/app/Domain/Totals.php)), never stored.

### API (Laravel, `backend/routes/api.php`)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/invoices` | List invoices |
| `GET` | `/api/invoices/defaults` | Suggested number, dates and sender details for a new invoice |
| `POST` | `/api/invoices` | Create an invoice |
| `GET` | `/api/invoices/{id}` | Get one invoice |
| `PUT` | `/api/invoices/{id}` | Update an invoice |
| `POST` | `/api/invoices/{id}/email` | Email a saved invoice |

Errors always use `{ "error": { "message", "fieldErrors"? } }`. Details are in [`backend/README.md`](backend/README.md).

## Environment variables

Each app has its own `.env` (gitignored) and `.env.example`.

| App | Variable | Purpose |
|---|---|---|
| backend | `APP_KEY` | Laravel's encryption key, created by `composer setup` |
| backend | `APP_URL` | Where the app runs, e.g. `http://localhost:8000`. The "View invoice online" link in emails points to `APP_URL/app` |
| backend | `DB_DATABASE` | Optional SQLite file path. Default: `database/database.sqlite`; on a host, a path on a persistent disk |
| backend | `MAIL_MAILER`, `MAIL_SCHEME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Email sending over SMTP |
| frontend | `API_URL` | Development only: where `npm run dev` forwards `/api/*` (default `http://localhost:8000`) |
| frontend | `NEXT_PUBLIC_API_URL` | Optional, at build time: an API on another domain, if the frontend is hosted separately |

## Deployment

The usual setup is a single Laravel application: build the frontend into `public/app`, then deploy `backend/` like any Laravel app.

| Step | Command (in `backend/`) |
|---|---|
| Install | `composer install --no-dev --optimize-autoloader` |
| Build the frontend | `php artisan frontend:build` (needs Node.js on the build machine) |
| Database | `php artisan migrate --force` |
| Cache config and routes | `php artisan optimize` |
| Web root | `backend/public` |

**Suitable hosts:** any server with PHP 8.3 and a persistent disk, such as a VPS (DigitalOcean, Lightsail, EC2) with Nginx or Apache, Laravel Forge, Laravel Cloud, Ploi, or shared hosting that supports PHP 8.3. SQLite is a single file, so the app must run as one instance with the database on persistent storage. Full steps are in [`backend/README.md`](backend/README.md).

## Email setup

Email is sent by Laravel over SMTP, so any provider works. Credentials stay on the server in `backend/.env` and are never sent to the browser.

**Resend (used for the demo):**

1. Sign up at <https://resend.com> and verify your email address.
2. Create an API key with **Sending access**.
3. Add it to `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD=your-resend-api-key
MAIL_FROM_ADDRESS="onboarding@resend.dev"
MAIL_FROM_NAME="Acme Studio"
```

4. Restart `php artisan serve`, open an invoice and click **Send**.

Without a verified domain, Resend only delivers to your own account email, which suits testing. Other SMTP providers, such as Gmail with an app password, work the same way.

## Calculation

```
line total = round(quantity × unit price)     each line rounded to cents
subtotal   = sum of line totals
taxable    = subtotal − discount               discount cannot exceed subtotal
tax        = round(taxable × tax rate)
total      = taxable + tax
```

Example from the brief: 2 × $50 − $10 discount + 10% tax = **$99.00**. This is covered by tests in both apps and is used as the sample invoice.

## Design decisions

- **Visual style:** a clean financial SaaS interface (Inter font, cool neutrals, one deep-teal accent) around a professional invoice document (serif headings, aligned figures, an "Amount due" summary).
- **Preview matches print:** the preview is the same Letter-size document that gets printed, so the PDF looks exactly like the screen.
- **Reliable printing:** the invoice includes its own page margins, so it prints correctly under Chrome's Default, None or Minimum margin settings.
- **Single form instead of tabs:** section links at the top jump through one scrolling form, so a validation error is never hidden on another tab.
- **Same validation in both apps:** the same rules run in the browser (for instant feedback) and on the server (as the final check).
- **Static frontend inside Laravel:** one application, one domain and one deployment, with no Node.js server needed in production. The frontend still lives in its own folder and builds independently.
- **One API contract:** the API uses camelCase JSON fields and a single error format (`{ error: { message, fieldErrors } }`), which the frontend's types mirror exactly.
- **Focused scope:** only features supported by real data were built. For example, Sent/Draft status comes from whether the invoice was emailed; there is no payment tracking.

## AI tools used

Built with **Claude Code** (Anthropic) as a pair programmer.

- **What it did:** scaffolded the project, drafted components and tests, and checked the result in a real browser, including desktop and mobile layouts, keyboard access and printed PDFs.
- **What I owned:** the requirements, design direction and key decisions, such as integer-cents money handling, the rounding order, shared validation and scope. I reviewed the code and can explain any part of it.

## Time spent

About 3 hours in total for the exercise, within the 3-hour limit. The Laravel backend and the static frontend build were added afterwards as a follow-up.

## Unfinished work and limitations

- **No PDF attachment in emails:** the email contains the full invoice and a link to view it online. PDF export is done through the browser.
- **No authentication,** as the brief allows.
- **SQLite hosting needs a persistent disk:** the app must run as a single instance on a server with persistent storage.
- **Pages show a short loading state:** the frontend is static, so data loads after the page opens.
- **No rate limiting** on the email endpoint.
- **Client-side dashboard filtering:** fine at this scale. Large datasets would need search and pagination on the server.
- **Not built:** deleting or duplicating invoices, bulk actions, logo upload, currencies other than USD, and dark mode.
- **Tests:** the backend covers the money rules and every API endpoint (PHPUnit, in-memory SQLite); the frontend covers its calculations and form validation. The UI was tested manually in the browser.
