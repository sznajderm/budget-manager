import { format, parse } from "date-fns";

export const UI_DATE_PATTERN = "dd/MM/yyyy HH:mm";

/**
 * Parse UI date string to Date object
 * @param value - Date string in DD/MM/YYYY HH:mm format
 * @returns Date object or null if invalid
 */
export function parseUIDate(value: string): Date | null {
  try {
    const d = parse(value, UI_DATE_PATTERN, new Date());
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Convert UI date string to ISO 8601 string
 * @param value - Date string in DD/MM/YYYY HH:mm format
 * @returns ISO 8601 string or null if invalid
 */
export function uiDateToISO(value: string): string | null {
  const date = parseUIDate(value);
  return date ? date.toISOString() : null;
}

/**
 * Format ISO date string to UI format
 * @param isoString - ISO 8601 date string
 * @returns Date string in DD/MM/YYYY HH:mm format
 */
export function formatISOToUI(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return format(date, UI_DATE_PATTERN);
  } catch {
    return "";
  }
}

/**
 * Get current date/time in UI format
 * @returns Current date string in DD/MM/YYYY HH:mm format
 */
export function getCurrentUIDate(): string {
  return format(new Date(), UI_DATE_PATTERN);
}
