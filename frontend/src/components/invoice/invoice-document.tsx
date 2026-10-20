import { formatDate } from "@/lib/dates";
import type { InvoiceFormValues } from "@/lib/invoice-schema";
import { formatDecimal, formatUSD } from "@/lib/money";
import { derivePreview } from "@/lib/preview";
import { cn } from "@/lib/utils";

/**
 * The invoice as a business document. It renders straight from the live form
 * values, so it stays useful while the form is incomplete: unparseable numbers
 * show as "—" instead of a misleading amount. This is also what gets printed.
 *
 * Print: the page has no @page margin, so the document's own padding is the
 * margin. `box-decoration-break: clone` repeats that padding on every printed
 * page, which keeps the layout identical whatever margin setting is chosen.
 */
export function InvoiceDocument({ values }: { values: InvoiceFormValues }) {
  const { lines, totals, taxRateBps, linesValid, totalsValid } = derivePreview(values);
  const money = (cents: number) => (totalsValid ? formatUSD(cents) : "—");

  const visibleFields = values.customFields.filter((f) => f.visible && f.label.trim());
  const details = [
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
      className="invoice-document relative flex min-h-[1056px] w-[816px] flex-col bg-paper px-16 pt-14 pb-10 text-[13.5px] leading-relaxed text-ink print:min-h-[10.75in] print:w-full"
    >
      {/* Accent rule */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-primary" />

      {/* Header */}
      <header className="flex items-start justify-between gap-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-[22px] text-white"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-serif text-[30px] leading-none tracking-tight break-words">
              {values.businessName || <span className="text-muted-foreground/60">Your business</span>}
            </p>
            {values.businessEmail && <p className="mt-1.5 text-[12.5px] text-muted-foreground">{values.businessEmail}</p>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-serif text-[46px] leading-[0.85] tracking-[0.02em] text-primary">Invoice</p>
          <p className="mt-3 text-[13px] text-muted-foreground">
            No. <span className="font-semibold text-ink tabular-nums">{values.number || "—"}</span>
          </p>
        </div>
      </header>

      {values.businessAddress && (
        <p className="mt-4 max-w-72 text-[12.5px] whitespace-pre-line text-muted-foreground">{values.businessAddress}</p>
      )}

      {/* Summary band: who, when, how much */}
      <section className="mt-9 grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_13.5rem] gap-7 border-t border-border pt-7">
        <div className="min-w-0">
          <Eyebrow>Billed to</Eyebrow>
          <p className="mt-2 text-[15px] font-semibold break-words">
            {values.customerName || <span className="font-normal text-muted-foreground/60">Customer name</span>}
          </p>
          <div className="mt-0.5 text-[12.5px] whitespace-pre-line text-muted-foreground">
            {values.customerAddress && <p>{values.customerAddress}</p>}
            {values.customerEmail && <p className="break-words">{values.customerEmail}</p>}
          </div>
        </div>
        <div className="min-w-0">
          <Eyebrow>Details</Eyebrow>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px]">
            {details.map((item, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="min-w-0 font-medium break-words">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="self-start rounded-xl bg-primary px-5 py-4 text-white">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">Amount due</p>
          <p className="mt-1 text-[28px] leading-tight font-semibold tracking-tight tabular-nums">{money(totals.totalCents)}</p>
          <p className="mt-1 text-[12px] text-white/75">Due {formatDate(values.dueDate)}</p>
        </div>
      </section>

      {/* Items */}
      <table className="mt-10 w-full border-collapse text-left">
        <thead>
          <tr className="bg-teal-tint text-[11.5px] font-semibold tracking-[0.08em] text-primary uppercase">
            <th scope="col" className="w-10 rounded-l-md py-2.5 pl-4">#</th>
            <th scope="col" className="py-2.5">Description</th>
            <th scope="col" className="w-20 py-2.5 text-right">Qty</th>
            <th scope="col" className="w-32 py-2.5 text-right">Unit price</th>
            <th scope="col" className="w-32 rounded-r-md py-2.5 pr-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {lines.map((line, i) => (
            <tr key={i} className="invoice-row border-b border-border">
              <td className="py-3.5 pl-4 align-top text-muted-foreground">{i + 1}</td>
              <td className="py-3.5 pr-4 align-top break-words">
                {values.lineItems[i]?.description || <span className="text-muted-foreground/60">Item description</span>}
              </td>
              <td className="py-3.5 text-right align-top">
                {line.quantityHundredths !== null ? formatDecimal(line.quantityHundredths, 2) : "—"}
              </td>
              <td className="py-3.5 text-right align-top">
                {line.unitPriceCents !== null ? formatUSD(line.unitPriceCents) : "—"}
              </td>
              <td className="py-3.5 pr-4 text-right align-top font-medium">
                {line.amountCents !== null ? formatUSD(line.amountCents) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="invoice-row mt-5 flex justify-end">
        <dl className="w-72 tabular-nums">
          <TotalRow label="Subtotal" value={linesValid ? formatUSD(totals.subtotalCents) : "—"} />
          {totals.discountCents > 0 && (
            <TotalRow label="Discount" value={totalsValid ? `−${formatUSD(totals.discountCents)}` : "—"} />
          )}
          <TotalRow
            label={`Tax (${taxRateBps !== null ? formatDecimal(taxRateBps, 2) : "—"}%)`}
            value={money(totals.taxCents)}
          />
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-primary px-4 pt-3">
            <dt className="text-[13px] font-semibold tracking-wide text-primary uppercase">Total due</dt>
            <dd className="text-[22px] font-semibold tracking-tight text-primary">{money(totals.totalCents)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes + sign-off */}
      <div className="invoice-row mt-10 flex items-end justify-between gap-10">
        <div className="max-w-md">
          {values.notes.trim() && (
            <>
              <Eyebrow>Notes</Eyebrow>
              <p className="mt-2 text-[12.5px] whitespace-pre-line text-muted-foreground">{values.notes}</p>
            </>
          )}
        </div>
        <p aria-hidden className="shrink-0 -rotate-6 font-script text-[42px] leading-none text-primary/80">
          Thank you!
        </p>
      </div>

      {/* Footer: pinned to the page bottom, but never closer than the spacer allows. */}
      <div aria-hidden className="min-h-12 flex-1" />
      <footer className="invoice-row flex items-center justify-between gap-6 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
        <span className="truncate">
          {[values.businessName, values.businessEmail].filter(Boolean).join(" · ") || "Your business"}
        </span>
        <span className="shrink-0 tabular-nums">
          {values.number || "—"} · Due {formatDate(values.dueDate)}
        </span>
      </footer>
    </article>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">{children}</h2>;
}

function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between px-4 py-1.5 text-[13.5px]", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
