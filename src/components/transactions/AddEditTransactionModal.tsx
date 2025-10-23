import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import { dollarsToCents } from "@/lib/utils/currency";
import { uiDateToISO } from "@/lib/utils/datetime";
import type {
  TransactionFormValues,
  FieldErrorMap,
  AccountOption,
  CategoryOption,
  TransactionCreatePayload,
  TransactionUpdatePayload,
} from "@/lib/transactions/types";

interface AddEditTransactionModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TransactionFormValues;
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultUncategorizedId?: string | null;
  fieldErrors?: FieldErrorMap;
  submitting: boolean;
  onClose: () => void;
  onSubmitCreate: (payload: TransactionCreatePayload) => Promise<void>;
  onSubmitUpdate: (
    id: string,
    payload: TransactionUpdatePayload
  ) => Promise<void>;
  editingId?: string;
}

export function AddEditTransactionModal({
  open,
  mode,
  initialValues,
  accounts,
  categories,
  defaultUncategorizedId,
  fieldErrors,
  submitting,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  editingId,
}: AddEditTransactionModalProps) {
  const handleSubmit = async (values: TransactionFormValues) => {
    // Convert form values to API payload
    const { amount_dollars, transaction_date_input, ...rest } = values;

    const amountCents = dollarsToCents(amount_dollars);
    const transactionDate = uiDateToISO(transaction_date_input);

    if (!transactionDate) {
      throw new Error("Invalid date format");
    }

    const basePayload = {
      amount_cents: amountCents,
      transaction_type: rest.transaction_type,
      transaction_date: transactionDate,
      account_id: rest.account_id,
      category_id: rest.category_id || null,
      description: rest.description || null,
    };

    if (mode === "create") {
      await onSubmitCreate(basePayload);
    } else if (mode === "edit" && editingId) {
      await onSubmitUpdate(editingId, basePayload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Transaction" : "Edit Transaction"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Enter the details of your transaction."
              : "Update the transaction details."}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          mode={mode}
          initialValues={initialValues}
          accounts={accounts}
          categories={categories}
          defaultUncategorizedId={defaultUncategorizedId}
          submitting={submitting}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
