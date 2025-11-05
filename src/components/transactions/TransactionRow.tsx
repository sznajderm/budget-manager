import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { TransactionVM } from "@/lib/transactions/types";
import { formatISOToUI } from "@/lib/utils/datetime";

interface TransactionRowProps {
  item: TransactionVM;
  isAISuggestionPending?: boolean;
  onEdit: (item: TransactionVM) => void;
  onDelete: (item: TransactionVM) => void;
}

export function TransactionRow({ item, isAISuggestionPending = false, onEdit, onDelete }: TransactionRowProps) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatISOToUI(item.transactionDateISO)}</TableCell>
      <TableCell>{item.description || "—"}</TableCell>
      <TableCell>{item.accountName}</TableCell>
      <TableCell>{item.categoryName}</TableCell>
      <TableCell>
        {isAISuggestionPending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Generating...</span>
          </div>
        ) : item.aiSuggestedCategoryName ? (
          item.aiSuggestedCategoryName
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="capitalize">{item.type}</TableCell>
      <TableCell className={`text-right font-medium ${item.amountClassName}`}>{item.amountFormatted}</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            aria-label={`Edit transaction ${item.description || "from " + item.transactionDateISO}`}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item)}
            aria-label={`Delete transaction ${item.description || "from " + item.transactionDateISO}`}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
