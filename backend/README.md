# Ledgerline backend

The Ledgerline invoice API in **Laravel 13** (PHP 8.3) with **SQLite**, plus email over SMTP. It also serves the built frontend from `public/app`, so in production the whole app is this one Laravel application.

## Run locally

Requirements: PHP 8.3+ with `pdo_sqlite`, Composer, and Node.js 20.9+ (only to build the frontend).

```bash
composer install
composer setup                 # .env, app key, database/database.sqlite and a sample invoice (INV-0001)
php artisan frontend:build     # builds ../frontend and copies it to public/app
php artisan serve              # http://localhost:8000
```

| Command | Purpose |
|---|---|
| `php artisan serve` (or `composer dev`) | Run the app on <http://localhost:8000> |
| `php artisan frontend:build` | Build `../frontend` (`npm ci`, `npm run build`) and copy it into `public/app`. Options: `--skip-install`, `--path=` |
| `php artisan test` | Unit tests (money and totals) and API tests against an in-memory SQLite database. No email is sent |
| `composer lint` | Laravel Pint code style check (`vendor/bin/pint` fixes it) |
| `php artisan db:seed` | Add the sample invoice (skipped if it already exists) |
| `php artisan migrate:fresh --seed` | Start again with an empty database and the sample invoice |

## Environment variables

See [`.env.example`](.env.example). The ones this app relies on:

| Variable | Required | Purpose |
|---|---|---|
| `APP_KEY` | yes | Created by `composer setup` (`php artisan key:generate`) |
| `APP_URL` | yes | Where the app runs. The "View invoice online" link in emails points to `APP_URL/app` |
| `FRONTEND_URL` | no | Overrides that link, e.g. `http://localhost:3000/app` while using the Next.js dev server |
| `DB_DATABASE` | no | SQLite file. Default `database/database.sqlite`; on a host, a path on a persistent disk |
| `MAIL_MAILER` | for email | `smtp` to send. The default `log` means email isn't configured, and sending returns a clear `503` |
| `MAIL_SCHEME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | for email | SMTP login. Resend: `smtps`, `smtp.resend.com`, `465`, `resend`, API key |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | for email | Sender. With Resend's sandbox use `onboarding@resend.dev` |

Sessions, cache and queues use files or run inline, so the database only holds invoice data.

## API

All responses are JSON. Errors use `{ "error": { "message", "fieldErrors"? } }`; field keys match the request, e.g. `lineItems.0.unitPriceCents`.

| Method | Path | Purpose | Errors |
|---|---|---|---|
| `GET` | `/api/health` | Health check (`{ "ok": true }`) | |
| `GET` | `/api/invoices` | List invoices with totals and Sent/Draft status | |
| `GET` | `/api/invoices/defaults` | Next invoice number, dates and last sender details | |
| `POST` | `/api/invoices` | Create | `400` validation, `409` duplicate number |
| `GET` | `/api/invoices/{id}` | Get one, with totals | `404` |
| `PUT` | `/api/invoices/{id}` | Replace an invoice, its line items and custom fields | `400`, `404`, `409` |
| `POST` | `/api/invoices/{id}/email` | Email the saved invoice (`{ to, subject, message }`) | `400`, `404`, `502` provider error, `503` not configured |

Every request body is validated, and totals are always calculated here, never trusted from the client. A malformed JSON body gets a `400` with a clear message.

## Project structure

```
app/
  Domain/                 Money and Totals: integer-cents rules (the source of truth)
  Http/
    Controllers/          InvoiceController (API), FrontendController (serves public/app pages)
    Requests/             InvoiceRequest and SendInvoiceEmailRequest: validation rules and messages
    Resources/            JSON shapes: InvoiceResource, InvoiceSummaryResource
    Middleware/           RejectInvalidJson
    ApiError.php          the shared error format
  Mail/                   InvoiceMail (HTML + plain text) and the email settings check
  Models/                 Invoice, LineItem, CustomField
  Console/Commands/       frontend:build
bootstrap/app.php         routing, middleware and JSON error handling
database/                 migrations, seeder, SQLite file (not committed)
resources/views/mail/     email templates
routes/                   api.php (the API), web.php (/ and /app)
tests/                    Unit/TotalsTest.php, Feature/InvoiceApiTest.php
```

`app/Domain/` and `app/Http/Requests/InvoiceRequest.php` have counterparts in `frontend/src/lib/`, which the frontend uses for the live preview. When changing a business rule, update both and run both test suites.

## Deploying (SQLite)

SQLite keeps all data in one file, so the server needs a **persistent disk**, and the app must run as a **single instance**.

- **Suitable hosts:** a VPS (DigitalOcean, Lightsail, EC2) with Nginx or Apache, Laravel Forge, Laravel Cloud, Ploi, or shared hosting with PHP 8.3.
- **Not suitable:** serverless or ephemeral hosts where files are lost on restart.

Typical deploy script:

```bash
composer install --no-dev --optimize-autoloader
php artisan frontend:build        # needs Node.js 20.9+ on the build machine
php artisan migrate --force
php artisan optimize
```

| Setting | Value |
|---|---|
| Web root | `backend/public` |
| Environment | `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://your-domain`, `MAIL_*` values |
| Database | `DB_DATABASE=/path/on/persistent/disk/ledgerline.sqlite`, writable by the web server |
| Health check | `/api/health` |

**Things to know before deploying:**
- **Frontend without Node.js on the server:** run `php artisan frontend:build` in CI or locally and upload `public/app` with the release.
- **Static files:** Nginx and Apache serve `public/app` directly. `routes/web.php` covers any page path the server doesn't resolve.
- **Backups:** use disk snapshots from the host, or copy the SQLite file on a schedule.
