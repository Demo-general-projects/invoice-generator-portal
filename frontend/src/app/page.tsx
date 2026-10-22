import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, FileText, Mail, Printer, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Ledgerline · Professional invoices in minutes",
  description: "Create, preview, print and email professional invoices. Totals, tax and discounts calculated for you.",
};

const features = [
  { icon: Wand2, title: "Live preview", body: "See the finished invoice update as you type. What you see is exactly what your client receives." },
  { icon: Calculator, title: "Totals done right", body: "Line items, discounts and tax are calculated on the server to the cent, every time." },
  { icon: Mail, title: "Send by email", body: "Email a polished invoice with a link to view it online. Sent and draft status is tracked for you." },
  { icon: Printer, title: "Print or export", body: "Letter-sized, print-ready layouts with no browser headers or footers getting in the way." },
  { icon: FileText, title: "Custom fields", body: "Add PO numbers, project codes or any detail your clients ask for, right on the invoice." },
  { icon: ShieldCheck, title: "Your numbering", body: "Sequential invoice numbers, due dates and notes kept consistent across every document." },
];

const steps = [
  { n: "01", title: "Sign in", body: "Open the workspace with the demo member account. Credentials are filled in for you." },
  { n: "02", title: "Fill in the details", body: "Add your client, line items and terms while the preview updates beside the form." },
  { n: "03", title: "Send or print", body: "Email the invoice straight from the app, or print it to PDF in one click." },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight">
            <span aria-hidden className="flex size-9 items-center justify-center rounded-[10px] bg-primary font-serif text-xl text-white">
              L
            </span>
            <span className="text-lg">Ledgerline</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">
              Features
            </a>
            <a href="#how" className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline">
              How it works
            </a>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
            >
              Get started <ArrowRight className="size-4" aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-10rem] left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-10rem] bottom-[-10rem] size-[30rem] rounded-full bg-emerald-200/40 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-2 lg:pt-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-teal-tint px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden /> Invoice generation, simplified
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Professional invoices, <span className="text-primary">ready in minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Ledgerline turns a short form into a beautiful, accurate invoice you can preview, print and email. No spreadsheets, no
              rounding errors, no design work.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(16,24,40,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-primary/90"
              >
                Get started <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-lg border border-border bg-white px-6 text-[15px] font-medium shadow-sm transition hover:bg-muted"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Demo workspace. No sign-up or card required.</p>
          </div>

          {/* Invoice mock */}
          <div className="relative mx-auto w-full max-w-md" aria-hidden>
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl bg-primary/10" />
            <div className="relative rounded-2xl border border-border bg-white p-7 shadow-[0_24px_60px_-20px_rgba(27,77,72,0.35)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-3xl">Invoice</p>
                  <p className="mt-1 text-xs text-muted-foreground">INV-0001 · Due in 30 days</p>
                </div>
                <span className="rounded-md bg-teal-tint px-2 py-1 text-xs font-medium text-primary">Sent</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="mt-1 font-medium">Acme Studio</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bill to</p>
                  <p className="mt-1 font-medium">Northwind Traders</p>
                </div>
              </div>
              <table className="mt-6 w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Brand identity design", "1", "$1,800.00"],
                    ["Website landing page", "1", "$2,400.00"],
                    ["Consulting (hours)", "6", "$900.00"],
                  ].map(([d, q, a]) => (
                    <tr key={d} className="border-b border-border/60">
                      <td className="py-2.5">{d}</td>
                      <td className="py-2.5 text-right tabular-nums">{q}</td>
                      <td className="py-2.5 text-right tabular-nums">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto w-48 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">$5,100.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span className="tabular-nums">$408.00</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums text-primary">$5,508.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-primary">Everything you need</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">Built for the way you bill</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6 transition hover:shadow-[0_8px_30px_-12px_rgba(27,77,72,0.25)]">
                <span className="flex size-10 items-center justify-center rounded-lg bg-teal-tint text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">Three steps to a sent invoice</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span className="font-serif text-5xl text-primary/30">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-white sm:px-12">
          <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Start generating invoices today</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">Open the demo workspace, create your first invoice and send it in under five minutes.</p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-medium text-primary shadow-sm transition hover:bg-white/90"
          >
            Get started <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Ledgerline. Invoice generator demo.</footer>
    </div>
  );
}
