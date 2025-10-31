import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchExpenseSummary, fetchIncomeSummary } from "@/lib/api";
import { formatUSD } from "@/lib/format";
import type { DateRange, SummaryVM } from "@/components/dashboard/types";
import type { SummaryCommand, SummaryDTO } from "@/types";

function dtoToVM(kind: "expense" | "income", dto: SummaryDTO): SummaryVM {
  return {
    kind,
    totalCents: dto.total_cents,
    totalFormatted: formatUSD(dto.total_cents),
    transactionCount: dto.transaction_count,
    periodStartISO: dto.period_start,
    periodEndISO: dto.period_end,
  };
}

export function useSummaries(range: DateRange | null) {
  const qc = useQueryClient();
  const enabled = !!range;

  const cmd: SummaryCommand | null = range
    ? {
        start_date: range.startISO,
        end_date: range.endISO,
      }
    : null;

  const expense = useQuery({
    queryKey: ["summary", "expense", cmd?.start_date, cmd?.end_date],
    queryFn: () => {
      if (!cmd) throw new Error("Command is required");
      return fetchExpenseSummary(cmd);
    },
    enabled,
    staleTime: 30_000,
    select: (dto: SummaryDTO) => dtoToVM("expense", dto),
  });

  const income = useQuery({
    queryKey: ["summary", "income", cmd?.start_date, cmd?.end_date],
    queryFn: () => {
      if (!cmd) throw new Error("Command is required");
      return fetchIncomeSummary(cmd);
    },
    enabled,
    staleTime: 30_000,
    select: (dto: SummaryDTO) => dtoToVM("income", dto),
  });

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["summary", "expense"] }),
      qc.invalidateQueries({ queryKey: ["summary", "income"] }),
    ]);
  };

  return { expense, income, invalidateAll };
}
