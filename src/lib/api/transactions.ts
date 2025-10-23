import type {
  TransactionDTO,
  TransactionListResponse,
  TransactionCreatePayload,
  TransactionUpdatePayload,
  AccountOption,
  CategoryOption,
} from "@/lib/transactions/types";

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
 * Fetch paginated list of transactions
 */
export async function fetchTransactions(
  limit: number,
  offset: number
): Promise<TransactionListResponse> {
  const url = `${BASE_URL}/transactions?limit=${limit}&offset=${offset}&select=*,accounts(name),categories(name)&order=created_at.desc`;
  
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse<TransactionDTO[]>(res);
  
  // Extract count from Content-Range header
  const contentRange = res.headers.get("Content-Range");
  let totalCount = 0;
  
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/);
    if (match) {
      totalCount = parseInt(match[1], 10);
    }
  }

  return {
    data,
    meta: {
      total_count: totalCount,
      limit,
      offset,
    },
  };
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  payload: TransactionCreatePayload
): Promise<TransactionDTO> {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<TransactionDTO>(res);
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: string,
  payload: TransactionUpdatePayload
): Promise<TransactionDTO> {
  const res = await fetch(`${BASE_URL}/transactions?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<TransactionDTO[]>(res);
  
  if (!data || data.length === 0) {
    throw new Error("Transaction not found");
  }

  return data[0];
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/transactions?id=eq.${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  await handleResponse<void>(res);
}

/**
 * Fetch list of accounts
 */
export async function fetchAccounts(): Promise<AccountOption[]> {
  const res = await fetch(
    `${BASE_URL}/accounts?select=id,name&order=name.asc`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return handleResponse<AccountOption[]>(res);
}

/**
 * Fetch list of categories
 */
export async function fetchCategories(): Promise<CategoryOption[]> {
  const res = await fetch(
    `${BASE_URL}/categories?select=id,name&order=name.asc`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return handleResponse<CategoryOption[]>(res);
}
