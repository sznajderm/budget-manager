import { type Page, type Locator, expect } from "@playwright/test";

export class TransactionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly transactionsTable: Locator;
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly amountInput: Locator;
  readonly typeSelect: Locator;
  readonly dateInput: Locator;
  readonly accountSelect: Locator;
  readonly categorySelect: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /^transactions$/i });
    // Use .first() to select the header button when there are multiple Add Transaction buttons
    this.addButton = page.getByRole("button", { name: /add transaction/i }).first();
    this.transactionsTable = page.locator("table").first();

    // Modal elements
    this.modal = page.locator('[role="dialog"]');
    this.modalTitle = this.modal.locator("h2");
    // Scope inputs to the open modal to avoid interacting with hidden/detached nodes
    this.amountInput = this.modal.locator("#amount_dollars");
    this.typeSelect = this.modal.locator("#transaction_type");
    this.dateInput = this.modal.locator("#transaction_date_input");
    this.accountSelect = this.modal.locator("#account_id");
    this.categorySelect = this.modal.locator("#category_id");
    this.descriptionInput = this.modal.locator("#description");
    this.submitButton = this.modal.getByRole("button", { name: /save|create/i });
    this.cancelButton = this.modal.getByRole("button", { name: /cancel/i });
    this.errorMessage = this.modal.locator('[role="alert"]');

    // Toast notifications
    this.toast = page.locator("[data-sonner-toast]");
  }

  async goto() {
    await this.page.goto("/transactions");
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: "visible" });
  }

  async clickAddTransaction() {
    await this.addButton.waitFor({ state: "visible" });
    await expect(this.addButton).toBeEnabled();
    await this.addButton.click({ timeout: 10000 });
    await this.modal.waitFor({ state: "visible", timeout: 15000 });
  }

  async fillTransactionForm(data: {
    amount: string;
    type: "expense" | "income";
    date?: string;
    account?: string;
    category?: string;
    description?: string;
  }) {
    // Fill amount (robust for masked/controlled input)
    await this.amountInput.waitFor({ state: "visible" });
    await expect(this.amountInput).toBeEditable();
    await this.amountInput.click();
    await this.amountInput.fill(data.amount);
    await expect(this.amountInput).toHaveValue(data.amount);
    // Select type (using Radix UI SelectItem)
    await this.typeSelect.click();
    await this.page.getByRole("option", { name: data.type === "expense" ? "Expense" : "Income" }).click();

    // Fill date if provided
    // if (data.date) {
    //   await this.dateInput.fill(data.date);
    // }

    // Select account if provided
    if (data.account) {
      await this.accountSelect.click();
      await this.page.getByRole("option", { name: data.account }).click();
    }

    // Select category if provided
    if (data.category) {
      await this.categorySelect.click();
      await this.page.getByRole("option", { name: data.category }).click();
    }

    // Fill description if provided
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submitForm() {
    await this.submitButton.waitFor({ state: "visible" });
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
    // Prefer deterministic UI waits instead of networkidle
    // Wait for either toast or modal close
    await Promise.race([
      this.toast.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
        // Ignore error
      }),
      this.modal.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
        // Ignore error
      }),
    ]);
  }

  async createTransaction(data: {
    amount: string;
    type: "expense" | "income";
    date?: string;
    account?: string;
    category?: string;
    description?: string;
  }) {
    await this.clickAddTransaction();
    await this.fillTransactionForm(data);
    await this.submitForm();
  }

  async waitForModalClose() {
    await this.modal.waitFor({ state: "hidden", timeout: 10000 });
  }

  async waitForSuccessToast() {
    await expect(this.toast).toBeVisible({ timeout: 5000 });
    await expect(this.toast).toContainText(/success/i, { timeout: 3000 });
  }

  async getTransactionRows() {
    return this.transactionsTable.locator("tbody tr");
  }

  async getTransactionCount(): Promise<number> {
    const rows = await this.getTransactionRows();
    return await rows.count();
  }

  async findTransactionByDescription(description: string): Promise<Locator | null> {
    const rows = await this.getTransactionRows();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text?.includes(description)) {
        return row;
      }
    }
    return null;
  }

  async verifyTransactionExists(description: string): Promise<boolean> {
    const transaction = await this.findTransactionByDescription(description);
    return transaction !== null;
  }

  async getTransactionAmount(description: string): Promise<string | null> {
    const row = await this.findTransactionByDescription(description);
    if (!row) return null;

    // Find the amount cell (typically has currency symbol)
    const amountCell = row.locator("td").filter({ hasText: /\$/ }).first();
    return await amountCell.textContent();
  }

  async getTransactionType(description: string): Promise<string | null> {
    const row = await this.findTransactionByDescription(description);
    if (!row) return null;

    // Look for expense/income indicators
    const cells = await row.locator("td").all();
    for (const cell of cells) {
      const text = await cell.textContent();
      if (text?.toLowerCase().includes("expense") || text?.toLowerCase().includes("income")) {
        return text.toLowerCase().includes("expense") ? "expense" : "income";
      }
    }
    return null;
  }

  async waitForTableUpdate() {
    await this.transactionsTable.waitFor({ state: "visible" });
    // Optionally, assert a row appears rather than using networkidle
    // Caller can compare counts before/after to ensure update happened.
  }

  async getTransactionAmountAsNumber(description: string): Promise<number | null> {
    const amountText = await this.getTransactionAmount(description);
    if (!amountText) return null;
    return parseFloat(amountText.replace(/[^0-9.-]/g, ""));
  }

  async getAllTransactions(): Promise<{ description: string; amount: string; type: string }[]> {
    const rows = await this.getTransactionRows();
    const count = await rows.count();
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = await row.locator("td").all();
      if (cells.length > 0) {
        const description = (await cells[0]?.textContent()) || "";
        const amount = (await cells[1]?.textContent()) || "";
        const type = (await cells[2]?.textContent()) || "";
        transactions.push({ description: description.trim(), amount: amount.trim(), type: type.trim() });
      }
    }

    return transactions;
  }

  async deleteTransaction(description: string) {
    const row = await this.findTransactionByDescription(description);
    if (!row) throw new Error(`Transaction with description "${description}" not found`);

    const deleteButton = row.getByRole("button", { name: /delete/i });
    await deleteButton.click();
  }

  async editTransaction(description: string) {
    const row = await this.findTransactionByDescription(description);
    if (!row) throw new Error(`Transaction with description "${description}" not found`);

    const editButton = row.getByRole("button", { name: /edit/i });
    await editButton.click();
    await this.modal.waitFor({ state: "visible" });
  }

  async isTableEmpty(): Promise<boolean> {
    const count = await this.getTransactionCount();
    return count === 0;
  }

  async hasTransaction(description: string): Promise<boolean> {
    return await this.verifyTransactionExists(description);
  }
}
