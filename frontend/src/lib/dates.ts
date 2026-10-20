// Frontend copy. The backend keeps its own copy in backend/src/domain/dates.ts; keep them in sync.
// Invoice dates are calendar dates ("YYYY-MM-DD"), not instants, so they are
// formatted in UTC to stay identical in every timezone.

const display = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return display.format(new Date(Date.UTC(y, m - 1, d)));
}

export function todayISO(offsetDays = 0): string {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}
