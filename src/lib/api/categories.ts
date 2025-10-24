import type { CategoryOption } from "@/lib/transactions/types";

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
