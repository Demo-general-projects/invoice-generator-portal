"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS, isSignedIn, signIn } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSignedIn()) router.replace("/invoices");
  }, [router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // A short pause so the sign-in reads as an action.
    window.setTimeout(() => {
      if (signIn(email, password)) router.replace("/invoices");
      else {
        setError("Those details don't match the member account.");
        setBusy(false);
      }
    }, 450);
  }

  const field =
    "h-11 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-[15px] text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15";

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-primary text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-emerald-300/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white font-serif text-2xl text-primary">L</span>
          <span className="text-xl font-semibold tracking-tight">Ledgerline</span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-serif text-5xl leading-[1.05]">Invoices that look as good as the work behind them.</p>
          <p className="mt-6 text-lg text-white/75">
            Draft, preview, print and email professional invoices in minutes. Totals are calculated for you, every time.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="size-4" aria-hidden /> Demo workspace · no real data is stored
        </p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary font-serif text-xl text-white">L</span>
            <span className="text-lg font-semibold tracking-tight">Ledgerline</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to open your invoice workspace.</p>

          <div className="mt-6 rounded-xl border border-primary/20 bg-teal-tint px-4 py-3 text-sm text-primary">
            <p className="font-medium">Demo member account</p>
            <p className="mt-0.5 text-primary/80">The credentials are filled in for you. Just press Sign in.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(16,24,40,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {busy ? "Signing in…" : "Sign in as member"}
              {!busy && <ArrowRight className="size-4" aria-hidden />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="rounded underline-offset-4 hover:text-foreground hover:underline">
              ← Back to the home page
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
