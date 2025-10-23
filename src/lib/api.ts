import { summaryCommandSchema } from "@/components/dashboard/types";
import type { SummaryCommand, SummaryDTO } from "@/types";

const BASE = "/api/rest/v1/rpc";

function handle401(res: Response) {
  if (res.status === 401) {
    window.location.assign("/login");
    return true;
  }
  return false;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (handle401(res)) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export async function fetchExpenseSummary(cmd: SummaryCommand): Promise<SummaryDTO> {
  summaryCommandSchema.parse(cmd);
  return postJSON<SummaryDTO>(`${BASE}/get_expense_summary`, cmd);
}

export async function fetchIncomeSummary(cmd: SummaryCommand): Promise<SummaryDTO> {
  summaryCommandSchema.parse(cmd);
  return postJSON<SummaryDTO>(`${BASE}/get_income_summary`, cmd);
}
