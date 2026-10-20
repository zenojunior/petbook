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

const units = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}
