"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { emailRequestSchema, type EmailRequest } from "@/lib/invoice-schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TextAreaField, TextField } from "./form-controls";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: EmailRequest;
  onSend: (request: EmailRequest) => Promise<string | null>; // resolves to an error message, or null on success
};

export function EmailDialog({ open, onOpenChange, defaults, onSend }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        {/* Remount the form each time so it picks up the latest invoice details. */}
        {open && <EmailForm defaults={defaults} onSend={onSend} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EmailForm({ defaults, onSend, onDone }: Omit<Props, "open" | "onOpenChange"> & { onDone: () => void }) {
  const [values, setValues] = useState(defaults);
  const [errors, setErrors] = useState<Partial<Record<keyof EmailRequest, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const update = (key: keyof EmailRequest) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = emailRequestSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setFormError(null);
    setSending(true);
    const error = await onSend(parsed.data);
    setSending(false);
    if (error) setFormError(error);
    else onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader className="flex-row items-start gap-3 border-b border-border px-6 py-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <Mail className="size-5" aria-hidden />
        </span>
        <div>
          <DialogTitle className="text-base font-semibold">Send invoice</DialogTitle>
          <DialogDescription className="mt-1">
            The latest saved version is emailed. Unsaved changes are saved first.
          </DialogDescription>
        </div>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-6 py-5">
        <TextField label="To" type="email" autoComplete="email" value={values.to} onChange={update("to")} error={errors.to} />
        <TextField label="Subject" value={values.subject} onChange={update("subject")} error={errors.subject} />
        <TextAreaField
          label="Message (optional)"
          rows={4}
          value={values.message}
          onChange={update("message")}
          error={errors.message}
          hint={`${values.message.length}/1000`}
        />
        {formError && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {formError}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/50 px-6 py-4 sm:flex-row sm:justify-end">
        <DialogClose render={<Button type="button" variant="outline" className="h-10 bg-white px-4" />}>Cancel</DialogClose>
        <Button type="submit" disabled={sending} className="h-10 px-4">
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {sending ? "Sending…" : "Send invoice"}
        </Button>
      </div>
    </form>
  );
}
