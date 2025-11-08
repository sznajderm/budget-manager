import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "./MoneyInput";
import { DateTimeInput } from "./DateTimeInput";
import {
  TransactionFormSchema,
  type TransactionFormValues,
  type FieldErrorMap,
  type AccountOption,
  type CategoryOption,
} from "@/lib/transactions/types";
import { ZodError } from "zod";

interface TransactionFormProps {
  mode: "create" | "edit";
  initialValues?: TransactionFormValues;
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultUncategorizedId?: string | null;
  submitting: boolean;
  fieldErrors?: FieldErrorMap;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
}

export function TransactionForm({
  mode,
  initialValues,
  accounts,
  categories,
  defaultUncategorizedId,
  submitting,
  fieldErrors: externalErrors,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  // Ensure accounts and categories are always arrays
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const [formData, setFormData] = useState<TransactionFormValues>(
    initialValues || {
      amount_dollars: "",
      transaction_type: "expense",
      transaction_date_input: "",
      account_id: "",
      category_id: defaultUncategorizedId || null,
      description: "",
    }
  );

  const [validationErrors, setValidationErrors] = useState<FieldErrorMap>({});

  // Merge external errors (from backend) with validation errors
  const errors = { ...validationErrors, ...externalErrors };

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  // Update account_id when accounts load and current account_id is empty
  useEffect(() => {
    if (mode === "create" && !formData.account_id && safeAccounts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        account_id: safeAccounts[0].id,
      }));
    }
  }, [mode, formData.account_id, safeAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});

    // Validate form data
    try {
      TransactionFormSchema.parse(formData);
      onSubmit(formData);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FieldErrorMap = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      }
    }
  };

  const updateField = <K extends keyof TransactionFormValues>(field: K, value: TransactionFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = validationErrors;
      setValidationErrors(rest);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MoneyInput
        id="amount_dollars"
        value={formData.amount_dollars}
        onChange={(value) => updateField("amount_dollars", value)}
        error={errors.amount_dollars}
        disabled={submitting}
      />

      <div className="space-y-2">
        <Label htmlFor="transaction_type">
          Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.transaction_type}
          onValueChange={(value) => updateField("transaction_type", value as "income" | "expense")}
          disabled={submitting}
        >
          <SelectTrigger id="transaction_type" aria-invalid={!!errors.transaction_type} data-testid="transaction-type-select">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.transaction_type && (
          <p className="text-sm text-red-600" role="alert">
            {errors.transaction_type}
          </p>
        )}
      </div>

      <DateTimeInput
        id="transaction_date_input"
        value={formData.transaction_date_input}
        onChange={(value) => updateField("transaction_date_input", value)}
        error={errors.transaction_date_input}
        disabled={submitting}
      />

      <div className="space-y-2">
        <Label htmlFor="account_id">
          Account <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.account_id}
          onValueChange={(value) => updateField("account_id", value)}
          disabled={submitting}
        >
          <SelectTrigger id="account_id" aria-invalid={!!errors.account_id} data-testid="transaction-account-select">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {safeAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && (
          <p className="text-sm text-red-600" role="alert">
            {errors.account_id}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Category</Label>
        <Select
          value={formData.category_id || "null"}
          onValueChange={(value) => updateField("category_id", value === "null" ? null : value)}
          disabled={submitting}
        >
          <SelectTrigger id="category_id" aria-invalid={!!errors.category_id} data-testid="transaction-category-select">
            <SelectValue placeholder="Select category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">No category</SelectItem>
            {safeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-sm text-red-600" role="alert">
            {errors.category_id}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Input
          id="description"
          type="text"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Description"
          maxLength={255}
          disabled={submitting}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          data-testid="transaction-description-input"
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} data-testid="transaction-submit-button">
          {submitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Transaction"
              : "Update Transaction"}
        </Button>
      </div>
    </form>
  );
}
