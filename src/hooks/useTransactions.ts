import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { fetchAccounts } from "@/lib/api/accounts";
import { fetchCategories } from "@/lib/api/categories";
import type { TransactionCreatePayload, TransactionUpdatePayload } from "@/lib/transactions/types";

/**
 * Hook to fetch paginated transactions list
 */
export function useTransactionsQuery(limit: number, offset: number) {
  return useQuery({
    queryKey: ["transactions", { limit, offset }],
    queryFn: () => fetchTransactions(limit, offset),
  });
}

/**
 * Hook to fetch accounts list for selectors
 */
export function useAccountsQuery() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes - accounts don't change often
  });
}

/**
 * Hook to fetch categories list for selectors
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}

/**
 * Hook to create a new transaction
 */
export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransactionCreatePayload) => createTransaction(payload),
    onSuccess: () => {
      // Invalidate all transactions queries to refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Hook to update an existing transaction
 */
export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransactionUpdatePayload }) => updateTransaction(id, payload),
    onSuccess: () => {
      // Invalidate all transactions queries to refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      // Invalidate all transactions queries to refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
