import type { AccountOption } from "@/lib/transactions/types";
import type { AccountListResponse } from "@/types";

const BASE_URL = "/api/rest/v1";

function handle401(res: Response) {
  if (res.status === 401) {
    window.location.assign("/login");
    return true;
  }
  return false;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (handle401(res)) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch list of accounts
 */
export async function fetchAccounts(): Promise<AccountOption[]> {
  const res = await fetch(`${BASE_URL}/accounts?select=id,name&order=name.asc`, {
    method: "GET",
    credentials: "include",
  });

  const response = await handleResponse<AccountListResponse>(res);
  return response.data;
}
