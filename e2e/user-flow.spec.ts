import { test, expect } from '@playwright/test';
import { SignupPage } from './page-objects/signup.page';
import { DashboardPage } from './page-objects/dashboard.page';
import { TransactionsPage } from './page-objects/transactions.page';

test.describe('Complete User Flow', () => {
  test('should register user, navigate through pages, create transactions, and verify summaries', async ({ page, context }) => {
    // Clear all cookies and storage for test isolation
    await context.clearCookies();
    await context.clearPermissions();
    
    // Use browser context for test isolation
    const signupPage = new SignupPage(page);
    const dashboardPage = new DashboardPage(page);
    const transactionsPage = new TransactionsPage(page);

    const testEmail = `testuser-${Date.now()}@example.com`;
    const testPassword = 'Topsecret99';

    // Step 1: Register a new user
    await signupPage.goto();
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await signupPage.register(testEmail, testPassword);
    
    // Wait for successful registration (either success message or redirect to dashboard)
    await page.waitForURL(url => !url.pathname.includes('/signup'), { timeout: 10000 });

    // Step 2: Navigate to dashboard page
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
    
    // Verify dashboard is loaded
    await expect(dashboardPage.heading).toBeVisible();

    // Step 3: Navigate to transactions page
    await transactionsPage.goto();
    await transactionsPage.waitForLoad();
    
    // Verify transactions page is loaded
    await expect(transactionsPage.heading).toBeVisible();

    // Step 3.5: Create default account and categories if needed
    // New users need at least one account and some categories before creating transactions
    // We'll click the button and wait a bit longer with explicit actionability checks
    await page.waitForLoadState('networkidle');

    // Step 4: Add two income transactions
    // Format date as DD/MM/YYYY to match form expectations
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    const income1 = {
      amount: '1500.00',
      type: 'income' as const,
      description: 'Salary Payment',
      date: formattedDate,
    };

    const income2 = {
      amount: '250.50',
      type: 'income' as const,
      description: 'Freelance Project',
      date: formattedDate,
    };

    await transactionsPage.createTransaction(income1);
    // Wait for either success toast or modal to close
    try {
      await transactionsPage.waitForSuccessToast();
    } catch {
      // If no toast, just wait for modal to close
    }
    await transactionsPage.waitForModalClose();
    await transactionsPage.waitForTableUpdate();

    await transactionsPage.createTransaction(income2);
    try {
      await transactionsPage.waitForSuccessToast();
    } catch {
      // If no toast, just wait for modal to close
    }
    await transactionsPage.waitForModalClose();
    await transactionsPage.waitForTableUpdate();

    // Step 4: Add two expense transactions
    const expense1 = {
      amount: '75.25',
      type: 'expense' as const,
      description: 'Grocery Shopping',
      date: formattedDate,
    };

    const expense2 = {
      amount: '120.00',
      type: 'expense' as const,
      description: 'Electricity Bill',
      date: formattedDate,
    };

    await transactionsPage.createTransaction(expense1);
    try {
      await transactionsPage.waitForSuccessToast();
    } catch {
      // If no toast, just wait for modal to close
    }
    await transactionsPage.waitForModalClose();
    await transactionsPage.waitForTableUpdate();

    await transactionsPage.createTransaction(expense2);
    try {
      await transactionsPage.waitForSuccessToast();
    } catch {
      // If no toast, just wait for modal to close
    }
    await transactionsPage.waitForModalClose();
    await transactionsPage.waitForTableUpdate();

    // Step 5: Verify all transactions are displayed on the /transactions view
    const transactionCount = await transactionsPage.getTransactionCount();
    expect(transactionCount).toBeGreaterThanOrEqual(4);

    // Verify each transaction exists
    expect(await transactionsPage.hasTransaction('Salary Payment')).toBe(true);
    expect(await transactionsPage.hasTransaction('Freelance Project')).toBe(true);
    expect(await transactionsPage.hasTransaction('Grocery Shopping')).toBe(true);
    expect(await transactionsPage.hasTransaction('Electricity Bill')).toBe(true);

    // Step 6: Verify transactions are properly summed on the /dashboard view
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
    
    // Wait for data to fully load
    await dashboardPage.waitForDataToLoad();

    // Verify income and expense totals
    const actualIncome = await dashboardPage.getIncomeTotalAsNumber();
    const actualExpense = await dashboardPage.getExpenseTotalAsNumber();

    // Calculate expected totals
    const expectedIncome = parseFloat(income1.amount) + parseFloat(income2.amount); // 1750.50
    const expectedExpense = parseFloat(expense1.amount) + parseFloat(expense2.amount); // 195.25

    // Verify totals match (allowing for minor floating-point differences)
    expect(actualIncome).toBeCloseTo(expectedIncome, 2);
    expect(actualExpense).toBeCloseTo(expectedExpense, 2);

    // Verify transaction counts on dashboard
    const incomeCount = await dashboardPage.getIncomeTransactionCount();
    const expenseCount = await dashboardPage.getExpenseTransactionCount();

    expect(incomeCount).toBeGreaterThanOrEqual(2);
    expect(expenseCount).toBeGreaterThanOrEqual(2);

    // Visual verification (optional - take screenshot for review)
    await expect(page).toHaveScreenshot('dashboard-with-transactions.png', { 
      fullPage: true,
      maxDiffPixels: 100 
    });
  });
});
