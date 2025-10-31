import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCentsAsUSD } from "@/lib/utils/currency";

interface DeleteConfirmDialogProps {
  open: boolean;
  tx?: {
    id: string;
    description?: string;
    amount_cents: number;
    transaction_type: "income" | "expense";
  };
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({ open, tx, onCancel, onConfirm, isDeleting = false }: DeleteConfirmDialogProps) {
  if (!tx) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-md bg-muted p-4">
          <div className="space-y-2 text-sm">
            {tx.description && (
              <div>
                <span className="font-medium">Description:</span> {tx.description}
              </div>
            )}
            <div>
              <span className="font-medium">Amount:</span>{" "}
              <span className={tx.transaction_type === "income" ? "text-green-600" : "text-red-600"}>
                {formatCentsAsUSD(tx.amount_cents)}
              </span>
            </div>
            <div>
              <span className="font-medium">Type:</span> <span className="capitalize">{tx.transaction_type}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
