import type {
  TransactionDTO,
  TransactionListResponse,
  TransactionCreatePayload,
  TransactionUpdatePayload,
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
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch paginated list of transactions
 */
export async function fetchTransactions(limit: number, offset: number): Promise<TransactionListResponse> {
  const url = `${BASE_URL}/transactions?limit=${limit}&offset=${offset}&select=*,accounts(name),categories(name)&order=created_at.desc`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const response = await handleResponse<TransactionListResponse>(res);
  return response;
}

/**
 * Fetch a single transaction by ID
 */
export async function fetchSingleTransaction(id: string): Promise<TransactionDTO | null> {
  const url = `${BASE_URL}/transactions?id=eq.${id}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  // Handle 404 as null (transaction not found)
  if (res.status === 404) {
    return null;
  }

  return handleResponse<TransactionDTO>(res);
}

/**
 * Create a new transaction
 */
export async function createTransaction(payload: TransactionCreatePayload): Promise<TransactionDTO> {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<TransactionDTO>(res);
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id: string, payload: TransactionUpdatePayload): Promise<TransactionDTO> {
  const res = await fetch(`${BASE_URL}/transactions?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
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

  await handleResponse<undefined>(res);
}
