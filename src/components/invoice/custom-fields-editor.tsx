"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { LIMITS, type InvoiceFormValues } from "@/lib/invoice-schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TextField } from "./form-controls";

const SUGGESTIONS = ["PO number", "Project", "Payment terms"];

export function CustomFieldsEditor() {
  const { control, register, formState } = useFormContext<InvoiceFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "customFields" });
  const values = useWatch({ control, name: "customFields" });
  const errors = formState.errors.customFields;
  const full = fields.length >= LIMITS.customFields;

  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-6 text-center">
        <p className="text-sm font-medium">No custom fields yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Add details like a PO number or project name. They appear on the invoice but never change the totals.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((label) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="h-9 rounded-full bg-white"
              onClick={() => append({ label, value: "", visible: true }, { focusName: `customFields.0.value` })}
            >
              <Plus aria-hidden /> {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const visible = values?.[index]?.visible ?? true;
          const name = values?.[index]?.label?.trim() || `field ${index + 1}`;
          return (
            <li
              key={field.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-2 gap-y-2 rounded-xl border border-border bg-white p-3 transition-opacity sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto_auto] sm:border-0 sm:p-0",
                !visible && "opacity-60",
              )}
            >
              <TextField
                label={`Custom field ${index + 1} label`}
                hideLabel
                placeholder="Label"
                className="col-span-3 sm:col-span-1"
                error={errors?.[index]?.label?.message}
                {...register(`customFields.${index}.label`)}
              />
              <TextField
                label={`${name} value`}
                hideLabel
                placeholder="Value"
                error={errors?.[index]?.value?.message}
                {...register(`customFields.${index}.value`)}
              />
              <Controller
                control={control}
                name={`customFields.${index}.visible`}
                render={({ field: toggle }) => (
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted">
                    <Switch
                      checked={toggle.value}
                      onCheckedChange={toggle.onChange}
                      aria-label={`Show ${name} on invoice`}
                    />
                    {toggle.value ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                    <span className="w-11">{toggle.value ? "Shown" : "Hidden"}</span>
                  </label>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${name}`}
                onClick={() => remove(index)}
                className="mt-0.5 size-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        disabled={full}
        className="mt-4 h-10 w-full border-dashed text-primary hover:bg-accent sm:w-auto"
        onClick={() => append({ label: "", value: "", visible: true })}
      >
        <Plus aria-hidden /> {full ? `Limit of ${LIMITS.customFields} reached` : "Add field"}
      </Button>
    </div>
  );
}
