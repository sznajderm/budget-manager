import { test, expect } from "@playwright/test";
import { SigninPage } from "./page-objects/signin.page";
import { DashboardPage } from "./page-objects/dashboard.page";
import { TransactionsPage } from "./page-objects/transactions.page";

test.describe("Complete User Flow", () => {
  test("should register user, navigate through pages, create transactions, and verify summaries", async ({
    page,
    context,
  }) => {
    // Playwright creates a fresh context per test; explicit clearing usually not needed.

    const signinPage = new SigninPage(page);
    const dashboardPage = new DashboardPage(page);
    const transactionsPage = new TransactionsPage(page);

    const testEmail = process.env.E2E_USERNAME!;
    const testPassword = process.env.E2E_PASSWORD!;

    // Step 1: Sign in with existing user
    await signinPage.goto();
    // Wait for UI to be ready (avoid networkidle on dev/HMR)
    await expect(signinPage.submitButton).toBeVisible();
    await signinPage.login(testEmail, testPassword);

    // Wait for successful login (redirect to dashboard)
    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 10000 });

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

    // Step 4: Add two income transactions
    // If input is <input type="date"> prefer YYYY-MM-DD; adjust if your UI expects a different format.
    const formattedDate = new Date().toISOString().slice(0, 10);

    const income1 = {
      amount: "1500.00",
      type: "income" as const,
      description: "Salary Payment",
      date: formattedDate,
    };

    const income2 = {
      amount: "250.50",
      type: "income" as const,
      description: "Freelance Project",
      date: formattedDate,
    };

    await transactionsPage.createTransaction(income1);
    await transactionsPage.waitForModalClose();
    expect(await transactionsPage.hasTransaction(income1.description)).toBe(true);

    await transactionsPage.createTransaction(income2);
    await transactionsPage.waitForModalClose();
    expect(await transactionsPage.hasTransaction(income2.description)).toBe(true);

    // Step 4: Add two expense transactions
    const expense1 = {
      amount: "75.25",
      type: "expense" as const,
      description: "Grocery Shopping",
      date: formattedDate,
    };

    const expense2 = {
      amount: "120.00",
      type: "expense" as const,
      description: "Electricity Bill",
      date: formattedDate,
    };

    await transactionsPage.createTransaction(expense1);
    await transactionsPage.waitForModalClose();
    expect(await transactionsPage.hasTransaction(expense1.description)).toBe(true);

    await transactionsPage.createTransaction(expense2);
    await transactionsPage.waitForModalClose();
    expect(await transactionsPage.hasTransaction(expense2.description)).toBe(true);

    // Step 5: Verify all transactions are displayed on the /transactions view
    const transactionCount = await transactionsPage.getTransactionCount();
    expect(transactionCount).toBeGreaterThanOrEqual(4);

    // Verify each transaction exists
    expect(await transactionsPage.hasTransaction("Salary Payment")).toBe(true);
    expect(await transactionsPage.hasTransaction("Freelance Project")).toBe(true);
    expect(await transactionsPage.hasTransaction("Grocery Shopping")).toBe(true);
    expect(await transactionsPage.hasTransaction("Electricity Bill")).toBe(true);

    // Step 6: Verify transactions are properly summed on the /dashboard view
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

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
  });
});
