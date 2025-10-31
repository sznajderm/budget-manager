import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TransactionsHeader } from "./TransactionsHeader";
import { PaginationControls } from "./PaginationControls";
import { TransactionsTable } from "./TransactionsTable";
import { AddEditTransactionModal } from "./AddEditTransactionModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  useTransactionsQuery,
  useAccountsQuery,
  useCategoriesQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/hooks/useTransactions";
import { mapTransactionsToVMs } from "@/lib/utils/transaction-mappers";
import { centsToDollars } from "@/lib/utils/currency";
import { formatISOToUI, getCurrentUIDate } from "@/lib/utils/datetime";
import type { TransactionVM, TransactionFormValues } from "@/lib/transactions/types";

export function TransactionsIsland() {
  // URL state management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 50>(20);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTx, setSelectedTx] = useState<TransactionVM | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<TransactionVM | null>(null);

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPage = parseInt(params.get("page") || "1", 10);
    const urlLimit = parseInt(params.get("limit") || "20", 10);

    if (urlPage > 0) setPage(urlPage);
    if (urlLimit === 20 || urlLimit === 50) setPageSize(urlLimit);
  }, []);

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", pageSize.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [page, pageSize]);

  // Calculate offset for API
  const offset = (page - 1) * pageSize;

  // Fetch data
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useTransactionsQuery(pageSize, offset);

  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();

  // Mutations
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  // Transform data to ViewModels
  const transactions =
    transactionsData && Array.isArray(transactionsData.data) ? mapTransactionsToVMs(transactionsData.data) : [];
  const totalCount = transactionsData?.meta.total_count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Handle page out of range after deletion
  useEffect(() => {
    if (totalCount > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalCount, page, totalPages]);

  // Handlers
  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (newSize: 20 | 50) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page
  };

  const handleOpenAddModal = () => {
    setModalMode("create");
    setSelectedTx(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: TransactionVM) => {
    setModalMode("edit");
    setSelectedTx(tx);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTx(null);
  };

  const handleCreate = async (payload: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Transaction created successfully");
      handleCloseModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create transaction");
      throw error;
    }
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      toast.success("Transaction updated successfully");
      handleCloseModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update transaction");
      throw error;
    }
  };

  const handleOpenDeleteDialog = (tx: TransactionVM) => {
    setDeletingTx(tx);
    setDeleteOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteOpen(false);
    setDeletingTx(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;

    try {
      await deleteMutation.mutateAsync(deletingTx.id);
      toast.success("Transaction deleted successfully");
      handleCloseDeleteDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
      throw error;
    }
  };

  // Get initial form values for edit mode
  const getInitialFormValues = (): TransactionFormValues | undefined => {
    if (!selectedTx) return undefined;

    return {
      amount_dollars: centsToDollars(selectedTx.amountCents),
      transaction_type: selectedTx.type,
      transaction_date_input: formatISOToUI(selectedTx.transactionDateISO),
      account_id: selectedTx.accountId,
      category_id: selectedTx.categoryId,
      description: selectedTx.description,
    };
  };

  // Get default form values for create mode
  const getDefaultFormValues = (): TransactionFormValues => {
    const uncategorizedCategory = Array.isArray(categories)
      ? categories.find((cat) => cat.name.toLowerCase() === "uncategorized")
      : undefined;

    return {
      amount_dollars: "",
      transaction_type: "expense",
      transaction_date_input: getCurrentUIDate(),
      account_id: accounts[0]?.id || "",
      category_id: uncategorizedCategory?.id || null,
      description: "",
    };
  };

  const formInitialValues = modalMode === "edit" ? getInitialFormValues() : getDefaultFormValues();

  const uncategorizedId = Array.isArray(categories)
    ? categories.find((cat) => cat.name.toLowerCase() === "uncategorized")?.id
    : undefined;

  // Show loading or error states
  if (transactionsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-600">Error loading transactions. Please try again.</div>
      </div>
    );
  }

  const isLoading = transactionsLoading || accountsLoading || categoriesLoading;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <TransactionsHeader onAdd={handleOpenAddModal} />

      {/* Top pagination */}
      {!isLoading && totalCount > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Transactions table */}
      <TransactionsTable
        items={transactions}
        loading={isLoading}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
        onAdd={handleOpenAddModal}
      />

      {/* Bottom pagination */}
      {!isLoading && totalCount > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Add/Edit Modal */}
      <AddEditTransactionModal
        open={modalOpen}
        mode={modalMode}
        initialValues={formInitialValues}
        accounts={accounts}
        categories={categories}
        defaultUncategorizedId={uncategorizedId}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        editingId={selectedTx?.id}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        tx={
          deletingTx
            ? {
                id: deletingTx.id,
                description: deletingTx.description,
                amount_cents: deletingTx.amountCents,
                transaction_type: deletingTx.type,
              }
            : undefined
        }
        onCancel={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
