import type { TransactionDTO, TransactionVM } from "@/lib/transactions/types";
import { formatCentsAsUSD, getAmountClassName } from "@/lib/utils/currency";

/**
 * Map TransactionDTO to TransactionVM for UI rendering
 * @param dto - Transaction DTO from API
 * @param uncategorizedLabel - Label to use for null category (default: "Uncategorized")
 * @returns TransactionVM for rendering
 */
export function mapTransactionToVM(dto: TransactionDTO, uncategorizedLabel = "Uncategorized"): TransactionVM {
  return {
    id: dto.id,
    createdAtISO: dto.created_at,
    transactionDateISO: dto.transaction_date,
    description: dto.description || "",
    accountName: dto.accounts.name,
    accountId: dto.account_id,
    categoryName: dto.categories?.name || uncategorizedLabel,
    categoryId: dto.category_id,
    type: dto.transaction_type,
    amountCents: dto.amount_cents,
    amountFormatted: formatCentsAsUSD(dto.amount_cents),
    amountClassName: getAmountClassName(dto.transaction_type),
  };
}

/**
 * Map array of DTOs to ViewModels
 * @param dtos - Array of transaction DTOs
 * @param uncategorizedLabel - Label to use for null category
 * @returns Array of TransactionVMs
 */
export function mapTransactionsToVMs(dtos: TransactionDTO[], uncategorizedLabel = "Uncategorized"): TransactionVM[] {
  return dtos.map((dto) => mapTransactionToVM(dto, uncategorizedLabel));
}
