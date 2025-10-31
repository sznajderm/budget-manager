/**
 * Utility functions for parsing PostgREST-style query parameters
 * Handles formats like: id=eq.{uuid}, name=like.*pattern*
 */

export interface PostgRESTFilter {
  column: string;
  operator: string;
  value: string;
}

/**
 * Parses PostgREST-style query parameter to extract transaction ID
 * Expected format: id=eq.{transaction_id}
 * @param queryParams - URLSearchParams object from request URL
 * @returns string | null - The extracted transaction ID or null if not found/invalid format
 */
export function parseTransactionIdFromQuery(queryParams: URLSearchParams): string | null {
  const idParam = queryParams.get("id");

  if (!idParam) {
    return null;
  }

  // Check if it matches PostgREST format: eq.{uuid}
  const postgrestMatch = idParam.match(/^eq\.(.+)$/);
  if (postgrestMatch && postgrestMatch[1]) {
    return postgrestMatch[1];
  }

  return null;
}

/**
 * Generic PostgREST filter parser for future extensibility
 * @param queryParams - URLSearchParams object from request URL
 * @returns PostgRESTFilter[] - Array of parsed filters
 */
export function parsePostgRESTFilters(queryParams: URLSearchParams): PostgRESTFilter[] {
  const filters: PostgRESTFilter[] = [];

  for (const [key, value] of queryParams.entries()) {
    // Skip non-filter parameters (like limit, offset, order)
    if (["limit", "offset", "order", "select"].includes(key)) {
      continue;
    }

    // Parse PostgREST filter format: column=operator.value
    const filterMatch = value.match(/^([^.]+)\.(.*)$/);
    if (filterMatch) {
      filters.push({
        column: key,
        operator: filterMatch[1],
        value: filterMatch[2],
      });
    }
  }

  return filters;
}

/**
 * Validates that the extracted transaction ID is a valid UUID format
 * @param transactionId - The transaction ID to validate
 * @returns boolean - True if valid UUID format, false otherwise
 */
export function isValidUUID(transactionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(transactionId);
}
