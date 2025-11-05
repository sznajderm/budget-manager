import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import {
  fetchTransactions,
  fetchSingleTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/api/transactions";
import { fetchAccounts } from "@/lib/api/accounts";
import { fetchCategories } from "@/lib/api/categories";
import { mapTransactionToVM } from "@/lib/utils/transaction-mappers";
import type {
  TransactionCreatePayload,
  TransactionUpdatePayload,
  TransactionListResponse,
  TransactionVM,
} from "@/lib/transactions/types";

/**
 * Query key factory for transactions
 */
export const TRANSACTIONS_QUERY_KEY = {
  all: ["transactions"] as const,
  list: (params: { limit: number; offset: number }) => [...TRANSACTIONS_QUERY_KEY.all, params] as const,
};

/**
 * Hook to fetch paginated transactions list
 */
export function useTransactionsQuery(limit: number, offset: number) {
  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEY.list({ limit, offset }),
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
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY.all });
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
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY.all });
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
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY.all });
    },
  });
}

/**
 * Helper to update a transaction in all cached queries
 */
export function updateTransactionInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  transactionId: string,
  updater: (vm: TransactionVM) => TransactionVM
) {
  queryClient.setQueriesData<TransactionListResponse>({ queryKey: TRANSACTIONS_QUERY_KEY.all }, (oldData) => {
    if (!oldData) return oldData;

    const updatedData = oldData.data.map((dto) => {
      if (dto.id === transactionId) {
        // Map DTO to VM, apply updater, then we need to keep DTO intact but update the nested fields
        const currentVM = mapTransactionToVM(dto);
        const updatedVM = updater(currentVM);

        // Update the DTO with the new AI suggestion from the VM
        return {
          ...dto,
          ai_suggestions: updatedVM.aiSuggestedCategoryName
            ? {
                categories: {
                  name: updatedVM.aiSuggestedCategoryName,
                },
              }
            : null,
        };
      }
      return dto;
    });

    return {
      ...oldData,
      data: updatedData,
    };
  });
}

/**
 * Hook to poll for AI suggestion on a single transaction
 */
export function usePollTransactionAISuggestion({
  transactionId,
  enabled,
  intervalMs = 2000,
  timeoutMs = 30000,
  onSuccess,
  onTimeout,
}: {
  transactionId: string;
  enabled: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  onSuccess?: () => void;
  onTimeout?: () => void;
}) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFoundSuggestionRef = useRef(false);

  const cleanup = useCallback(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Clear timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (hasFoundSuggestionRef.current) return;

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const transaction = await fetchSingleTransaction(transactionId);

      if (!transaction) {
        // Transaction not found, stop polling
        cleanup();
        onTimeout?.();
        return;
      }

      // Check if AI suggestion is present
      if (transaction.ai_suggestions?.categories?.name) {
        hasFoundSuggestionRef.current = true;

        // Update cache with the new suggestion
        updateTransactionInCache(queryClient, transactionId, (vm) => ({
          ...vm,
          aiSuggestedCategoryName: transaction.ai_suggestions?.categories?.name || null,
        }));

        cleanup();
        onSuccess?.();
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error polling for AI suggestion:", error);
    }
  }, [transactionId, queryClient, cleanup, onSuccess, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    hasFoundSuggestionRef.current = false;

    // Start polling immediately
    pollOnce();

    // Set up interval for subsequent polls
    intervalIdRef.current = setInterval(pollOnce, intervalMs);

    // Set up timeout to stop polling
    timeoutIdRef.current = setTimeout(() => {
      if (!hasFoundSuggestionRef.current) {
        cleanup();
        onTimeout?.();
      }
    }, timeoutMs);

    // Cleanup on unmount or when enabled changes
    return cleanup;
  }, [enabled, pollOnce, intervalMs, timeoutMs, cleanup, onTimeout]);
}
