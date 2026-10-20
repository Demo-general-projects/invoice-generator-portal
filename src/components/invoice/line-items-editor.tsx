"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { parseField, type InvoiceFormValues } from "@/lib/invoice-schema";
import { formatUSD } from "@/lib/money";
import { lineTotalCents } from "@/lib/totals";
import { Button } from "@/components/ui/button";
import { TextField } from "./form-controls";

export function LineItemsEditor() {
  const { control, register, formState } = useFormContext<InvoiceFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const lines = useWatch({ control, name: "lineItems" });
  const errors = formState.errors.lineItems;

  return (
    <div className="@container">
      {/* Column headings for wide screens; each input also carries its own label. */}
      <div
        aria-hidden
        className="hidden grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_7rem_6rem_2.25rem] gap-3 border-b border-border pb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase @xl:grid"
      >
        <span>#</span>
        <span>Description</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      <ol className="divide-y divide-border">
        {fields.map((field, index) => {
          const line = lines?.[index];
          const q = line ? parseField(line.quantity, "quantity") : null;
          const p = line ? parseField(line.unitPrice, "unitPrice") : null;
          const amount = q !== null && p !== null ? formatUSD(lineTotalCents({ quantityHundredths: q, unitPriceCents: p })) : "—";
          const rowErrors = errors?.[index];
          const n = index + 1;
          return (
            <li
              key={field.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-start gap-x-3 gap-y-3 py-4 @xl:grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_7rem_6rem_2.25rem] @xl:py-3"
            >
              <span className="hidden pt-2.5 text-sm text-muted-foreground tabular-nums @xl:block">{n}</span>
              <TextField
                label={`Item ${n} description`}
                hideLabel
                placeholder="e.g. Website design"
                className="col-span-2 @xl:col-span-1"
                error={rowErrors?.description?.message}
                {...register(`lineItems.${index}.description`)}
              />
              <RemoveButton
                className="col-start-3 row-start-1 @xl:hidden"
                label={`Remove item ${n}`}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              />
              <TextField
                label="Qty"
                inputMode="decimal"
                autoComplete="off"
                className="[&_label]:@xl:sr-only"
                aria-label={`Item ${n} quantity`}
                error={rowErrors?.quantity?.message}
                {...register(`lineItems.${index}.quantity`)}
              />
              <TextField
                label="Unit price"
                inputMode="decimal"
                autoComplete="off"
                prefix="$"
                placeholder="0.00"
                className="col-span-2 @xl:col-span-1 [&_label]:@xl:sr-only"
                aria-label={`Item ${n} unit price`}
                error={rowErrors?.unitPrice?.message}
                {...register(`lineItems.${index}.unitPrice`)}
              />
              <output
                aria-label={`Item ${n} amount`}
                className="col-span-3 flex h-10 items-center justify-between rounded-lg bg-muted px-3 text-sm font-medium tabular-nums @xl:col-span-1 @xl:justify-end @xl:bg-transparent @xl:px-0"
              >
                <span className="text-muted-foreground @xl:hidden">Amount</span>
                {amount}
              </output>
              <RemoveButton
                className="hidden @xl:inline-flex"
                label={`Remove item ${n}`}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              />
            </li>
          );
        })}
      </ol>

      {errors?.root?.message && <p className="mt-2 text-xs font-medium text-destructive">{errors.root.message}</p>}

      <Button
        type="button"
        variant="outline"
        className="mt-3 h-10 w-full border-dashed text-primary hover:bg-accent sm:w-auto"
        onClick={() => append({ description: "", quantity: "1", unitPrice: "" })}
      >
        <Plus aria-hidden /> Add item
      </Button>
    </div>
  );
}

function RemoveButton({
  label,
  className,
  disabled,
  onClick,
}: {
  label: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={disabled ? "An invoice needs at least one item" : label}
      disabled={disabled}
      onClick={onClick}
      className={`mt-0.5 size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${className ?? ""}`}
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
