const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(date: Date | null | undefined): string {
  return date ? dateFormat.format(date) : "—";
}

export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTimeFormat.format(date) : "—";
}

// Postgres `date` columns come back as "YYYY-MM-DD". Format them in UTC so the day
// does not shift with the server's time zone.
const dayFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function formatDay(value: string | null): string {
  return value ? dayFormat.format(new Date(`${value}T00:00:00Z`)) : "—";
}
