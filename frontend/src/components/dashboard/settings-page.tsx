"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Section, TextAreaField, TextField } from "@/components/invoice/form-controls";
import { TemplatePicker } from "@/components/invoice/template-picker";
import { PageError, PageLoading } from "@/components/load-state";
import { Button } from "@/components/ui/button";
import { apiUrl, useApiGet } from "@/lib/api-client";
import type { BusinessSettingsDTO, InvoiceSummary } from "@/lib/api-types";
import { LIMITS } from "@/lib/invoice-schema";
import { formatDecimal, parseDecimal } from "@/lib/money";
import { TEMPLATE_IDS } from "@/lib/templates";

const schema = z.object({
  businessName: z.string().trim().max(120),
  businessEmail: z.union([z.literal(""), z.email("Enter a valid email address")]),
  businessPhone: z.string().trim().max(40),
  businessAddress: z.string().max(500),
  defaultTemplate: z.enum(TEMPLATE_IDS),
  defaultTaxRate: z.string().superRefine((v, ctx) => {
    if (v.trim() === "") return;
    const bps = parseDecimal(v, 2);
    if (bps === null || v.startsWith("-")) ctx.addIssue({ code: "custom", message: "Enter a number with up to 2 decimals" });
    else if (bps > LIMITS.taxRateBps) ctx.addIssue({ code: "custom", message: "Tax rate can't exceed 100%" });
  }),
  defaultNotes: z.string().max(2000),
});
type FormValues = z.input<typeof schema>;

export function SettingsPage() {
  const [settings, retry] = useApiGet<{ settings: BusinessSettingsDTO }>("/api/settings");
  const [invoices] = useApiGet<{ invoices: InvoiceSummary[] }>("/api/invoices");
  if (settings.status === "loading") return <PageLoading label="Loading settings…" />;
  if (settings.status !== "ready") {
    return <PageError message={settings.status === "error" ? settings.message : "The settings API was not found."} onRetry={retry} />;
  }
  const count = invoices.status === "ready" ? invoices.data.invoices.length : 0;
  return (
    <DashboardShell invoiceCount={count} current="settings">
      <SettingsForm initial={settings.data.settings} />
    </DashboardShell>
  );
}

function toForm(s: BusinessSettingsDTO): FormValues {
  const { defaultTaxRateBps, ...rest } = s;
  return { ...rest, defaultTaxRate: defaultTaxRateBps ? formatDecimal(defaultTaxRateBps, 2) : "" };
}

function SettingsForm({ initial }: { initial: BusinessSettingsDTO }) {
  const [values, setValues] = useState<FormValues>(() => toForm(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };
  const bind = (key: Exclude<keyof FormValues, "defaultTemplate">) => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    error: errors[key],
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    const { defaultTaxRate, ...rest } = parsed.data;
    const body: BusinessSettingsDTO = { ...rest, defaultTaxRateBps: parseDecimal(defaultTaxRate, 2) ?? 0 };
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(json.error?.fieldErrors ?? {});
        toast.error(json.error?.message ?? "Couldn't save the settings.");
        return;
      }
      setValues(toForm(json.settings));
      setDirty(false);
      toast.success("Settings saved. New invoices will use them.");
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex h-[4.5rem] items-center justify-between gap-4 border-b border-border px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-[17px] font-medium tracking-[-0.01em]">Settings</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">Defaults for every new invoice. You can still change them per invoice.</p>
        </div>
        <Button onClick={submit} disabled={saving || !dirty} className="h-10 px-4 shadow-sm">
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save settings
        </Button>
      </div>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <form onSubmit={submit} noValidate className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(22,32,31,0.04),0_8px_24px_-12px_rgba(22,32,31,0.08)]">
          <div className="divide-y divide-border">
            <Section id="company" title="Company details" description="Shown in the header of every invoice you create.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Company name" autoComplete="organization" placeholder="Acme Studio" {...bind("businessName")} />
                <TextField label="Email" type="email" autoComplete="email" placeholder="billing@acme.com" {...bind("businessEmail")} />
                <TextField label="Phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" {...bind("businessPhone")} />
                <TextAreaField label="Address" className="sm:col-span-2" rows={2} placeholder={"123 Creative Street\nSan Francisco, CA 94105"} {...bind("businessAddress")} />
              </div>
            </Section>

            <Section id="template" title="Default template" description="Picked automatically for each new invoice. You can switch templates on any invoice.">
              <TemplatePicker name="defaultTemplate" value={values.defaultTemplate} onChange={(id) => set("defaultTemplate", id)} />
            </Section>

            <Section id="defaults" title="Invoice defaults">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Default tax rate" inputMode="decimal" suffix="%" placeholder="0" {...bind("defaultTaxRate")} />
                <TextAreaField
                  label="Default notes"
                  className="sm:col-span-2"
                  rows={3}
                  placeholder="Payment instructions, thank-you note…"
                  hint={`${values.defaultNotes.length}/2000`}
                  {...bind("defaultNotes")}
                />
              </div>
            </Section>
          </div>
          <div className="flex justify-end border-t border-border px-5 py-4 sm:px-7">
            <Button type="submit" disabled={saving || !dirty} className="h-10 px-4 shadow-sm">
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              Save settings
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
