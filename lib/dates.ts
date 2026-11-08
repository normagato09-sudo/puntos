// Fechas locales como texto YYYY-MM-DD, en la zona horaria de la familia.
const TZ = process.env.APP_TIMEZONE || "Europe/Madrid";

export const DAY_KEYS = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isISODate(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

function toUTC(iso: string) {
  return new Date(iso + "T00:00:00Z");
}

export function addDays(iso: string, n: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo */
export function weekdayIndex(iso: string): number {
  return (toUTC(iso).getUTCDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function shortDate(iso: string): string {
  const d = toUTC(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const a = toUTC(monday);
  const b = toUTC(sunday);
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `semana del ${a.getUTCDate()} al ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]}`;
  }
  return `semana del ${shortDate(monday)} al ${shortDate(sunday)}`;
}

export function longDate(iso: string): string {
  const d = toUTC(iso);
  return `${d.getUTCDate()} de ${
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][
      d.getUTCMonth()
    ]
  }`;
}
