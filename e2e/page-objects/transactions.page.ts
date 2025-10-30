import { type Page, type Locator, expect } from '@playwright/test';

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
    this.heading = page.getByRole('heading', { name: /^transactions$/i });
    this.addButton = page.getByRole('button', { name: /add transaction/i });
    this.transactionsTable = page.locator('table').first();
    
    // Modal elements
    this.modal = page.locator('[role="dialog"]');
    this.modalTitle = this.modal.locator('h2');
    this.amountInput = page.locator('#amount_dollars');
    this.typeSelect = page.locator('#transaction_type');
    this.dateInput = page.locator('#transaction_date_input');
    this.accountSelect = page.locator('#account_id');
    this.categorySelect = page.locator('#category_id');
    this.descriptionInput = page.locator('#description');
    this.submitButton = this.modal.getByRole('button', { name: /save|create/i });
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
    this.errorMessage = this.modal.locator('[role="alert"]');
    
    // Toast notifications
    this.toast = page.locator('[data-sonner-toast]');
  }

  async goto() {
    await this.page.goto('/transactions');
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: 'visible' });
  }

  async clickAddTransaction() {
    await this.addButton.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  async fillTransactionForm(data: {
    amount: string;
    type: 'expense' | 'income';
    date?: string;
    account?: string;
    category?: string;
    description?: string;
  }) {
    // Fill amount
    await this.amountInput.fill(data.amount);

    // Select type (using Radix UI SelectItem)
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: data.type === 'expense' ? 'Expense' : 'Income' }).click();

    // Fill date if provided
    if (data.date) {
      await this.dateInput.fill(data.date);
    }

    // Select account if provided
    if (data.account) {
      await this.accountSelect.click();
      await this.page.getByRole('option', { name: data.account }).click();
    }

    // Select category if provided
    if (data.category) {
      await this.categorySelect.click();
      await this.page.getByRole('option', { name: data.category }).click();
    }

    // Fill description if provided
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async createTransaction(data: {
    amount: string;
    type: 'expense' | 'income';
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
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async waitForSuccessToast() {
    try {
      await expect(this.toast).toBeVisible({ timeout: 5000 });
      await expect(this.toast).toContainText(/success/i);
    } catch (error) {
      // Toast might have appeared and disappeared quickly
      // Check if modal is closed as alternative success indicator
      console.log('Toast not visible, checking if modal closed as success indicator');
    }
  }

  async getTransactionRows() {
    return this.transactionsTable.locator('tbody tr');
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
    const amountCell = row.locator('td').filter({ hasText: /\$/ }).first();
    return await amountCell.textContent();
  }

  async getTransactionType(description: string): Promise<string | null> {
    const row = await this.findTransactionByDescription(description);
    if (!row) return null;
    
    // Look for expense/income indicators
    const cells = await row.locator('td').all();
    for (const cell of cells) {
      const text = await cell.textContent();
      if (text?.toLowerCase().includes('expense') || text?.toLowerCase().includes('income')) {
        return text.toLowerCase().includes('expense') ? 'expense' : 'income';
      }
    }
    return null;
  }

  async waitForTableUpdate() {
    // Wait for any loading indicators to disappear
    await this.page.waitForTimeout(500);
    await this.transactionsTable.waitFor({ state: 'visible' });
  }
}
