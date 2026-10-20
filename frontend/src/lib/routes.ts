// The app is a static export, which can't have a page per invoice id, so one
// edit page reads the id from the query string: /invoices/edit/?id=…
export function invoicePath(id: string, action?: "print" | "email"): string {
  const params = new URLSearchParams({ id });
  if (action) params.set("action", action);
  return `/invoices/edit/?${params}`;
}
