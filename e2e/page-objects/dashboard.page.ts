import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly applyButton: Locator;
  readonly resetButton: Locator;
  readonly expenseCard: Locator;
  readonly incomeCard: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i });
    this.startDateInput = page.locator('#start-date');
    this.endDateInput = page.locator('#end-date');
    this.applyButton = page.getByRole('button', { name: /apply/i });
    this.resetButton = page.getByRole('button', { name: /reset to current month/i });
    this.expenseCard = page.locator('[aria-label="Summary cards"]').locator('div').filter({ hasText: 'Total Expenses' }).first();
    this.incomeCard = page.locator('[aria-label="Summary cards"]').locator('div').filter({ hasText: 'Total Income' }).first();
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: 'visible' });
  }

  async getExpenseTotal(): Promise<string> {
    const text = await this.expenseCard.locator('.text-3xl').textContent();
    return text?.trim() || '';
  }

  async getIncomeTotal(): Promise<string> {
    const text = await this.incomeCard.locator('.text-3xl').textContent();
    return text?.trim() || '';
  }

  async getExpenseTransactionCount(): Promise<number> {
    const text = await this.expenseCard.locator('text=/\\d+ transactions/').textContent();
    const match = text?.match(/(\d+) transactions/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getIncomeTransactionCount(): Promise<number> {
    const text = await this.incomeCard.locator('text=/\\d+ transactions/').textContent();
    const match = text?.match(/(\d+) transactions/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async waitForExpenseData() {
    await expect(this.expenseCard.locator('.text-3xl')).toBeVisible();
  }

  async waitForIncomeData() {
    await expect(this.incomeCard.locator('.text-3xl')).toBeVisible();
  }

  async isLoadingExpense(): Promise<boolean> {
    const loadingSkeleton = this.expenseCard.locator('[class*="animate-pulse"]');
    return await loadingSkeleton.isVisible().catch(() => false);
  }

  async isLoadingIncome(): Promise<boolean> {
    const loadingSkeleton = this.incomeCard.locator('[class*="animate-pulse"]');
    return await loadingSkeleton.isVisible().catch(() => false);
  }

  async setDateRange(startDate: string, endDate: string) {
    await this.startDateInput.fill(startDate);
    await this.endDateInput.fill(endDate);
  }

  async applyDateFilter() {
    await this.applyButton.click();
  }

  async resetDateFilter() {
    await this.resetButton.click();
  }

  async filterByDateRange(startDate: string, endDate: string) {
    await this.setDateRange(startDate, endDate);
    await this.applyDateFilter();
  }

  async getExpenseTotalAsNumber(): Promise<number> {
    const text = await this.getExpenseTotal();
    return parseFloat(text.replace(/[^0-9.-]/g, ''));
  }

  async getIncomeTotalAsNumber(): Promise<number> {
    const text = await this.getIncomeTotal();
    return parseFloat(text.replace(/[^0-9.-]/g, ''));
  }

  async getNetTotal(): Promise<number> {
    const income = await this.getIncomeTotalAsNumber();
    const expense = await this.getExpenseTotalAsNumber();
    return income - expense;
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible().catch(() => false);
  }
}
