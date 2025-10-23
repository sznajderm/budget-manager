import { formatUSD } from "@/lib/format";

/**
 * Convert dollars string to cents integer
 * @param dollars - String representation of dollar amount (e.g., "123.45")
 * @returns Integer cents value
 */
export function dollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid dollar amount");
  }
  return Math.round(parsed * 100);
}

/**
 * Convert cents integer to dollars string
 * @param cents - Integer cents value
 * @returns String representation with up to 2 decimals (e.g., "123.45")
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Format cents as USD currency string
 * @param cents - Integer cents value
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatCentsAsUSD(cents: number): string {
  return formatUSD(cents);
}

/**
 * Get CSS class name for amount based on transaction type
 * @param type - Transaction type ("income" | "expense")
 * @returns CSS class name for coloring
 */
export function getAmountClassName(type: "income" | "expense"): string {
  return type === "income" ? "text-green-600" : "text-red-600";
}
