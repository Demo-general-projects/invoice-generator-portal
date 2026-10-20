import { formatDate } from "@/lib/dates";
import type { InvoiceFormValues } from "@/lib/invoice-schema";
import { formatDecimal, formatUSD } from "@/lib/money";
import { derivePreview } from "@/lib/preview";
import { cn } from "@/lib/utils";

/**
 * The invoice as a business document. It renders straight from the live form
 * values, so it stays useful while the form is incomplete: unparseable numbers
 * show as "—" instead of a misleading amount. This is also what gets printed.
 */
export function InvoiceDocument({ values }: { values: InvoiceFormValues }) {
  const { lines, totals, taxRateBps, linesValid, totalsValid } = derivePreview(values);
  const money = (cents: number) => (totalsValid ? formatUSD(cents) : "—");

  const visibleFields = values.customFields.filter((f) => f.visible && f.label.trim());
  const meta = [
    { label: "Invoice no.", value: values.number || "—" },
    { label: "Issue date", value: formatDate(values.issueDate) },
    { label: "Due date", value: formatDate(values.dueDate) },
    ...visibleFields.map((f) => ({ label: f.label, value: f.value || "—" })),
  ];
  const initials =
    values.businessName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "—";

  return (
    <article
      aria-label="Invoice preview"
      className="relative flex min-h-[1056px] w-[816px] flex-col bg-paper px-16 py-14 text-[13px] leading-relaxed text-ink print:min-h-0 print:w-auto print:p-0"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-10">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-xl text-white"
            >
              {initials}
            </div>
            <p className="font-serif text-[28px] leading-none tracking-tight break-words">
              {values.businessName || <span className="text-muted-foreground/60">Your business</span>}
            </p>
          </div>
          <div className="mt-5 text-[12.5px] whitespace-pre-line text-muted-foreground">
            {values.businessAddress && <p>{values.businessAddress}</p>}
            {values.businessEmail && <p>{values.businessEmail}</p>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-serif text-[56px] leading-[0.9] tracking-[0.04em] text-primary">INVOICE</p>
          <dl className="mt-6 grid grid-cols-[auto_auto] justify-end gap-x-6 gap-y-1 text-[12.5px]">
            {meta.map((item, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="max-w-56 font-medium break-words">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Bill to */}
      <section className="mt-12">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">Bill to</h2>
        <p className="mt-2 text-[15px] font-semibold">
          {values.customerName || <span className="font-normal text-muted-foreground/60">Customer name</span>}
        </p>
        <div className="text-[12.5px] whitespace-pre-line text-muted-foreground">
          {values.customerAddress && <p>{values.customerAddress}</p>}
          {values.customerEmail && <p>{values.customerEmail}</p>}
        </div>
      </section>

      {/* Items */}
      <table className="mt-10 w-full border-collapse text-left">
        <thead>
          <tr className="bg-teal-tint text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            <th scope="col" className="w-10 rounded-l-md py-2.5 pl-4">#</th>
            <th scope="col" className="py-2.5">Description</th>
            <th scope="col" className="w-20 py-2.5 text-right">Qty</th>
            <th scope="col" className="w-32 py-2.5 text-right">Unit price</th>
            <th scope="col" className="w-32 rounded-r-md py-2.5 pr-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {lines.map((line, i) => (
            <tr key={i} className="invoice-row border-b border-border/80">
              <td className="py-3.5 pl-4 text-muted-foreground">{i + 1}</td>
              <td className="py-3.5 pr-4 break-words">
                {values.lineItems[i]?.description || <span className="text-muted-foreground/60">Item description</span>}
              </td>
              <td className="py-3.5 text-right">
                {line.quantityHundredths !== null ? formatDecimal(line.quantityHundredths, 2) : "—"}
              </td>
              <td className="py-3.5 text-right">
                {line.unitPriceCents !== null ? formatUSD(line.unitPriceCents) : "—"}
              </td>
              <td className="py-3.5 pr-4 text-right font-medium">
                {line.amountCents !== null ? formatUSD(line.amountCents) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="invoice-row mt-6 flex justify-end">
        <dl className="w-72 tabular-nums">
          <TotalRow label="Subtotal" value={linesValid ? formatUSD(totals.subtotalCents) : "—"} />
          {totals.discountCents > 0 && <TotalRow label="Discount" value={totalsValid ? `−${formatUSD(totals.discountCents)}` : "—"} />}
          <TotalRow
            label={`Tax (${taxRateBps !== null ? formatDecimal(taxRateBps, 2) : "—"}%)`}
            value={money(totals.taxCents)}
          />
          <div className="mt-3 flex items-baseline justify-between rounded-lg bg-teal-tint px-4 py-3.5">
            <dt className="text-[13px] font-semibold tracking-wide text-primary uppercase">Total due</dt>
            <dd className="text-[24px] font-semibold tracking-tight text-primary">{money(totals.totalCents)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes + sign-off */}
      <footer className="invoice-row mt-auto flex items-end justify-between gap-10 pt-14">
        <div className="max-w-md">
          {values.notes.trim() && (
            <>
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">Notes</h2>
              <p className="mt-2 text-[12.5px] whitespace-pre-line text-muted-foreground">{values.notes}</p>
            </>
          )}
        </div>
        <p aria-hidden className="shrink-0 -rotate-6 font-script text-[44px] leading-none text-primary/80">
          Thank you!
        </p>
      </footer>
    </article>
  );
}

function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between px-4 py-1.5 text-[13px]", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
