"use client";

import { Check } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import { cn } from "@/lib/utils";

/** Three small thumbnails that stand for the invoice layouts. */
export function TemplatePicker({ value, onChange, name = "template" }: { value: TemplateId; onChange: (id: TemplateId) => void; name?: string }) {
  return (
    <div role="radiogroup" aria-label="Invoice template" className="grid gap-3 sm:grid-cols-3">
      {TEMPLATES.map((t) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            name={name}
            aria-checked={selected}
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative rounded-xl border bg-white p-3 text-left transition focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none",
              selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-input",
            )}
          >
            <Thumb id={t.id} />
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
              {t.name}
              {selected && <Check className="size-4 text-primary" aria-hidden />}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function Thumb({ id }: { id: TemplateId }) {
  const line = "h-1 rounded-full bg-foreground/15";
  return (
    <div aria-hidden className="aspect-[8.5/11] w-full overflow-hidden rounded-md border border-border bg-[#fafbfc] p-2.5 text-[0]">
      {id === "classic" && (
        <>
          <div className="h-0.5 w-full bg-primary" />
          <div className="mt-2 flex justify-between">
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-primary" />
              <div className={cn(line, "w-8")} />
            </div>
            <div className="h-2 w-8 rounded-sm bg-primary/70" />
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="flex-1 space-y-1"><div className={cn(line, "w-10")} /><div className={cn(line, "w-7")} /></div>
            <div className="h-6 w-9 rounded-sm bg-primary" />
          </div>
          <div className="mt-3 h-1.5 w-full rounded-sm bg-teal-tint" />
          <div className="mt-1 space-y-1"><div className={line} /><div className={line} /><div className={line} /></div>
        </>
      )}
      {id === "modern" && (
        <>
          <div className="-m-2.5 mb-0 h-9 bg-primary p-2.5">
            <div className="h-1.5 w-10 rounded-full bg-white/80" />
            <div className="mt-1 h-1 w-6 rounded-full bg-white/50" />
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="flex-1 space-y-1"><div className={cn(line, "w-10")} /><div className={cn(line, "w-7")} /></div>
            <div className="flex-1 space-y-1"><div className={cn(line, "w-10")} /><div className={cn(line, "w-7")} /></div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-sm bg-foreground/80" />
          <div className="mt-1 space-y-1"><div className={line} /><div className={line} /><div className={line} /></div>
          <div className="mt-2 ml-auto h-2 w-10 rounded-sm bg-primary" />
        </>
      )}
      {id === "minimal" && (
        <>
          <div className="flex justify-between">
            <div className={cn(line, "w-9 bg-foreground/60")} />
            <div className={cn(line, "w-5")} />
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="flex-1 space-y-1"><div className={cn(line, "w-10")} /><div className={cn(line, "w-7")} /></div>
            <div className="flex-1 space-y-1"><div className={cn(line, "w-10")} /><div className={cn(line, "w-7")} /></div>
          </div>
          <div className="mt-3 border-t border-foreground/40" />
          <div className="mt-1.5 space-y-1.5"><div className={line} /><div className={line} /><div className={line} /></div>
          <div className="mt-2 border-t border-foreground/40" />
          <div className="mt-1 ml-auto h-1.5 w-8 rounded-full bg-foreground/70" />
        </>
      )}
    </div>
  );
}
