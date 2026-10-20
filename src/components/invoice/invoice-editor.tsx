"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Mail, Printer, Save } from "lucide-react";
import { FormProvider, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { formToInput, invoiceFormSchema, type EmailRequest, type InvoiceFormValues } from "@/lib/invoice-schema";
import { formatUSD } from "@/lib/money";
import { derivePreview } from "@/lib/preview";
import { cn } from "@/lib/utils";
import { CustomFieldsEditor } from "./custom-fields-editor";
import { EmailDialog } from "./email-dialog";
import { Section, TextAreaField, TextField } from "./form-controls";
import { InvoiceDocument } from "./invoice-document";
import { LineItemsEditor } from "./line-items-editor";

export type EditorAction = "print" | "email";

type Props = {
  invoiceId?: string;
  initialValues: InvoiceFormValues;
  /** Opened from the invoice list's actions menu: print or open the email dialog on arrival. */
  initialAction?: EditorAction;
};

const SECTIONS = [
  { id: "details", label: "Details" },
  { id: "items", label: "Items" },
  { id: "custom-fields", label: "Custom fields" },
  { id: "notes", label: "Notes" },
];

export function InvoiceEditor({ invoiceId, initialValues, initialAction }: Props) {
  const router = useRouter();
  const [savedId, setSavedId] = useState(invoiceId);
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(initialAction === "email");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { register, handleSubmit, formState, reset, setError, control } = form;
  const errors = formState.errors;
  const values = useWatch({ control }) as InvoiceFormValues;

  /** Validates, saves and returns the invoice id, or null when anything failed. */
  async function save(): Promise<string | null> {
    let result: string | null = null;
    await handleSubmit(
      async (formValues) => {
        setSaving(true);
        try {
          const res = await fetch(savedId ? `/api/invoices/${savedId}` : "/api/invoices", {
            method: savedId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formToInput(formValues)),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 409) setError("number", { message: body.error?.message }, { shouldFocus: true });
            toast.error(body.error?.message ?? "Couldn't save the invoice. Please try again.");
            return;
          }
          reset(formValues);
          setSavedId(body.invoice.id);
          if (!savedId) router.replace(`/invoices/${body.invoice.id}`, { scroll: false });
          result = body.invoice.id;
        } catch {
          toast.error("Network error. Check your connection and try again.");
        } finally {
          setSaving(false);
        }
      },
      (invalid) => {
        setMobileView("edit");
        toast.error(`Please fix ${countErrors(invalid)} highlighted field${countErrors(invalid) === 1 ? "" : "s"}.`);
      },
    )();
    return result;
  }

  async function onSave() {
    if (await save()) toast.success("Invoice saved");
  }

  async function sendEmail(request: EmailRequest): Promise<string | null> {
    const id = formState.isDirty || !savedId ? await save() : savedId;
    if (!id) {
      setEmailOpen(false);
      return "Save failed";
    }
    const res = await fetch(`/api/invoices/${id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).catch(() => null);
    if (!res) return "Network error. Check your connection and try again.";
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error?.message ?? "The email couldn't be sent.";
    toast.success(`Invoice sent to ${request.to}`);
    return null;
  }

  // The email action opens the dialog via initial state; print runs once fonts are ready. Then drop the param.
  const handledAction = useRef(false);
  useEffect(() => {
    if (!initialAction || !invoiceId || handledAction.current) return;
    handledAction.current = true;
    router.replace(`/invoices/${invoiceId}`, { scroll: false });
    if (initialAction === "print") document.fonts.ready.then(() => window.print());
  }, [initialAction, invoiceId, router]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!formState.isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  const preview = derivePreview(values);
  const totalCents = preview.totalsValid ? preview.totals.totalCents : null;
  const status = saving ? "Saving…" : formState.isDirty || !savedId ? "Unsaved changes" : "All changes saved";

  return (
    <FormProvider {...form}>
      <div className="min-h-dvh pb-24 lg:pb-0">
        <AppHeader
          crumbs={[
            { label: "Invoices", href: "/invoices" },
            { label: savedId ? values.number || "Invoice" : "New invoice" },
          ]}
        >
          <span role="status" className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
            {status === "All changes saved" && <Check className="size-3.5 text-primary" aria-hidden />}
            {status}
          </span>
          <ToolbarButton icon={<Printer aria-hidden />} label="Print / PDF" onClick={() => window.print()} />
          <ToolbarButton icon={<Mail aria-hidden />} label="Send" onClick={() => setEmailOpen(true)} />
          <Button onClick={onSave} disabled={saving} className="hidden h-10 px-4 shadow-sm lg:inline-flex">
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Save invoice
          </Button>
        </AppHeader>

        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 print:max-w-none print:p-0">
          <div className="flex items-end justify-between gap-4 pt-7 pb-5 print:hidden">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
                {savedId ? "Edit invoice" : "Create invoice"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Fill in the details and watch the invoice update live.</p>
            </div>
          </div>

          {/* Mobile view switch */}
          <div
            role="tablist"
            aria-label="View"
            className="mb-4 grid grid-cols-2 rounded-xl border border-border bg-white p-1 lg:hidden print:hidden"
          >
            {(["edit", "preview"] as const).map((view) => (
              <button
                key={view}
                role="tab"
                type="button"
                aria-selected={mobileView === view}
                onClick={() => setMobileView(view)}
                className={cn(
                  "h-10 rounded-lg text-sm font-medium capitalize transition-colors",
                  mobileView === view ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-8">
            {/* Editor */}
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
              aria-label="Invoice details"
              className={cn(
                "rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(22,32,31,0.04),0_8px_24px_-12px_rgba(22,32,31,0.08)] print:hidden",
                mobileView === "preview" && "hidden lg:block",
              )}
            >
              <nav
                aria-label="Form sections"
                className="sticky top-16 z-20 flex gap-1 overflow-x-auto rounded-t-2xl border-b border-border bg-card/95 px-3 py-2 backdrop-blur sm:px-5"
              >
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>

              <div className="divide-y divide-border">
                <Section id="details" title="Business information" description="Who the invoice is from.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Business name" autoComplete="organization" error={errors.businessName?.message} {...register("businessName")} />
                    <TextField label="Email" type="email" autoComplete="email" error={errors.businessEmail?.message} {...register("businessEmail")} />
                    <TextAreaField label="Address" className="sm:col-span-2" rows={2} error={errors.businessAddress?.message} {...register("businessAddress")} />
                  </div>
                </Section>

                <Section id="customer" title="Customer information" description="Who the invoice is for.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Customer name" error={errors.customerName?.message} {...register("customerName")} />
                    <TextField label="Email" type="email" error={errors.customerEmail?.message} hint="Used as the default recipient." {...register("customerEmail")} />
                    <TextAreaField label="Address" className="sm:col-span-2" rows={2} error={errors.customerAddress?.message} {...register("customerAddress")} />
                  </div>
                </Section>

                <Section id="invoice-details" title="Invoice details">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField label="Invoice number" autoComplete="off" error={errors.number?.message} {...register("number")} />
                    <TextField label="Issue date" type="date" error={errors.issueDate?.message} {...register("issueDate", { deps: ["dueDate"] })} />
                    <TextField label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
                  </div>
                </Section>

                <Section id="items" title="Invoice items" description="Each line is rounded to the cent automatically.">
                  <LineItemsEditor />
                </Section>

                <Section id="adjustments" title="Discount & tax">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Discount (USD)"
                      inputMode="decimal"
                      prefix="$"
                      placeholder="0.00"
                      hint="Fixed amount, can't exceed the subtotal."
                      error={errors.discount?.message}
                      {...register("discount")}
                    />
                    <TextField
                      label="Tax rate"
                      inputMode="decimal"
                      suffix="%"
                      placeholder="0"
                      hint="Applied after the discount."
                      error={errors.taxRate?.message}
                      {...register("taxRate")}
                    />
                  </div>
                </Section>

                <Section id="custom-fields" title="Custom fields" description="Extra details shown on the invoice. Hidden fields are kept but not shown or printed.">
                  <CustomFieldsEditor />
                </Section>

                <Section id="notes" title="Notes">
                  <TextAreaField
                    label="Notes for your customer"
                    rows={3}
                    placeholder="Payment instructions, thank-you note…"
                    hint={`${values.notes?.length ?? 0}/2000`}
                    error={errors.notes?.message}
                    {...register("notes")}
                  />
                </Section>
              </div>
            </form>

            {/* Live preview */}
            <section
              aria-label="Live preview"
              className={cn(
                "lg:sticky lg:top-20 print:block",
                mobileView === "edit" && "hidden lg:block",
              )}
            >
              <div className="rounded-2xl bg-canvas p-3 sm:p-6 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto print:max-h-none print:overflow-visible print:bg-transparent print:p-0">
                <PaperScaler>
                  <InvoiceDocument values={values} />
                </PaperScaler>
              </div>
            </section>
          </div>
        </div>

        {/* Mobile action bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total due</p>
              <p className="text-lg font-semibold tracking-tight text-primary tabular-nums">
                {totalCents === null ? "—" : formatUSD(totalCents)}
              </p>
            </div>
            <Button onClick={onSave} disabled={saving} className="h-11 px-5">
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <EmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        defaults={{
          to: values.customerEmail ?? "",
          subject: `Invoice ${values.number} from ${values.businessName}`.trim(),
          message: "",
        }}
        onSend={sendEmail}
      />
    </FormProvider>
  );
}

function ToolbarButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-10 bg-white px-3 shadow-sm" aria-label={label}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

/** Renders the fixed-width paper and zooms it to fit its column; print is always 100%. */
function PaperScaler({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setZoom(Math.min(1, entry.contentRect.width / 816)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full">
      <div
        style={{ "--zoom": zoom ?? 1 } as React.CSSProperties}
        className={cn(
          "mx-auto w-fit overflow-hidden rounded-[3px] shadow-[0_1px_2px_rgba(22,32,31,0.06),0_12px_40px_-12px_rgba(22,32,31,0.18)] [zoom:var(--zoom)]",
          "print:overflow-visible print:rounded-none print:shadow-none print:[zoom:1]",
          zoom === null && "opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function countErrors(errors: FieldErrors): number {
  return Object.values(errors).reduce<number>((n, e) => {
    if (!e) return n;
    if (Array.isArray(e)) return n + e.reduce<number>((m, item) => m + (item ? countErrors(item as FieldErrors) : 0), 0);
    if (typeof e === "object" && "message" in e && typeof e.message === "string") return n + 1;
    return n + countErrors(e as FieldErrors);
  }, 0);
}
