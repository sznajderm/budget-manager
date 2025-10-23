import { format, parse } from "date-fns";

export const UI_PATTERN = "dd/MM/yyyy HH:mm";

export function parseUiToDate(value: string): Date | null {
  try {
    const d = parse(value, UI_PATTERN, new Date());
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function toInclusiveEnd(d: Date): Date {
  const copy = new Date(d);
  copy.setSeconds(59, 999);
  return copy;
}

export function toISO(d: Date): string {
  return d.toISOString();
}

export function formatDateForUI(d: Date): string {
  return format(d, UI_PATTERN);
}

export function currentMonthDefault(): { startISO: string; endISO: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}
