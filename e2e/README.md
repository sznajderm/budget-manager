# E2E Tests

End-to-end tests for Budget Manager using Playwright.

## Test Structure

Tests follow the **Page Object Model (POM)** pattern for maintainability and reusability.

### Page Objects

Located in `e2e/page-objects/`:

- `signup.page.ts` - Sign up page interactions
- `dashboard.page.ts` - Dashboard page interactions and summary verification
- `transactions.page.ts` - Transactions page with CRUD operations

### Test Suites

- `user-transaction-flow.spec.ts` - Complete user journey from registration to transaction management

## Running Tests

### Prerequisites

1. Ensure `.env.test` is configured with test database credentials
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install chromium`

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/user-transaction-flow.spec.ts

# Run with debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Test Scenarios

### Main Flow Test

**Scenario**: Complete user registration and transaction management
1. Register a new user with unique email
2. Navigate to dashboard (verify empty state)
3. Navigate to transactions page
4. Add 2 income transactions ($1500.00, $500.50)
5. Add 2 expense transactions ($850.75, $125.25)
6. Verify all 4 transactions appear in table
7. Verify dashboard shows correct summaries:
   - Income: $2,000.50 (2 transactions)
   - Expense: $976.00 (2 transactions)
8. Verify color coding (red for expenses, green for income)

### Edge Cases

**Decimal Precision Test**
- Verifies amounts with cents are preserved correctly
- Tests $99.99 transaction

**Validation Error Test**
- Attempts to submit empty transaction form
- Verifies validation errors are shown

**Data Persistence Test**
- Adds transaction and navigates between pages
- Verifies data persists across navigation

## Key Features

### Resilient Selectors
- Uses semantic locators (roles, labels)
- Falls back to IDs for form inputs
- Avoids brittle CSS selectors

### Browser Context Isolation
- Each test gets clean state via `beforeEach`
- Cookies cleared between tests
- Unique emails generated per test run

### Parallel Execution
- Tests can run in parallel (configured in `playwright.config.ts`)
- Uses browser contexts for isolation

### Trace & Screenshots
- Traces captured on first retry
- Screenshots on failure
- HTML report with detailed results

## Debugging

### View Test Results
```bash
npx playwright show-report
```

### View Traces
```bash
npx playwright show-trace trace.zip
```

### Use Codegen for Recording
```bash
npx playwright codegen http://localhost:4321
```

## CI/CD Integration

Tests are configured for CI with:
- Retry logic (2 retries in CI)
- JUnit XML output for CI systems
- HTML report generation
- Single worker in CI for stability

## Business Rules Tested

1. **User Registration**
   - Valid email format
   - Password requirements (min 8 chars, letter + digit)
   - Password confirmation matching
   - Auto-login after registration (if enabled)

2. **Transaction Management**
   - Required fields validation
   - Amount precision (2 decimal places)
   - Transaction type selection
   - Real-time table updates
   - Toast notifications

3. **Dashboard Summaries**
   - Accurate sum calculations
   - Transaction count accuracy
   - Visual differentiation (colors)
   - Loading states
   - Empty states

4. **Data Persistence**
   - Data survives page navigation
   - Data survives page reload
   - Consistent state across views

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify database connectivity

### Flaky Tests
- Check for race conditions
- Add explicit waits for network requests
- Use `waitForLoadState('networkidle')`

### Element Not Found
- Use Playwright Inspector: `npx playwright test --debug`
- Check if element exists in current viewport
- Verify selector is correct

## Best Practices

✅ **DO**
- Use Page Object Model
- Use semantic locators (roles, labels)
- Add explicit waits for async operations
- Test user flows, not implementation details
- Generate unique test data per run

❌ **DON'T**
- Use brittle CSS selectors
- Share state between tests
- Test internal component state
- Use fixed test data (causes conflicts)
- Skip error handling tests
