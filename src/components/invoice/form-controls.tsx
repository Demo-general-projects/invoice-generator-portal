"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const controlClass = cn(
  "w-full rounded-lg border border-input bg-white px-3 text-base text-foreground shadow-[0_1px_1px_rgba(22,32,31,0.04)] transition-[border-color,box-shadow] sm:text-sm",
  "placeholder:text-muted-foreground/70 hover:border-[#c4c6be]",
  "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none",
  "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
);

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
};

/** Label + control + hint/error wiring shared by every input. */
export function FieldShell({ label, error, hint, hideLabel, className, children }: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-[13px] font-medium text-foreground/80", hideLabel && "sr-only")}>
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": message ? messageId : undefined })}
      {message && (
        <p
          id={messageId}
          className={cn("text-xs leading-snug", error ? "font-medium text-destructive" : "text-muted-foreground")}
        >
          {message}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<"input">, "className"> & {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
};

export function TextField({ label, error, hint, hideLabel, className, prefix, suffix, ...input }: TextFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} hideLabel={hideLabel} className={className}>
      {(a11y) => (
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          <input
            {...input}
            {...a11y}
            className={cn(controlClass, "h-10", prefix && "pl-7", suffix && "pr-8", input.inputMode === "decimal" && "tabular-nums")}
          />
          {suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      )}
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "className"> & {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextAreaField({ label, error, hint, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint} className={className}>
      {(a11y) => <textarea rows={3} {...textarea} {...a11y} className={cn(controlClass, "resize-y py-2.5 leading-relaxed")} />}
    </FieldShell>
  );
}

export function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} id={id} className="scroll-mt-32 px-5 py-6 sm:px-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={`${id}-title`} className="text-[15px] font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
