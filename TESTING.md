# Testing Guide

This project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end tests.

## Tech Stack

### Unit & Integration Tests
- **Vitest** - Fast test framework with TypeScript and ESM support
- **@testing-library/react** - Testing utilities for React components
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom matchers for DOM testing
- **MSW (Mock Service Worker)** - API mocking and request interception
- **happy-dom** - Fast DOM implementation
- **@vitest/coverage-v8** - Code coverage reporting

### E2E Tests
- **Playwright** - End-to-end testing on Chromium
- **@axe-core/playwright** - Automated accessibility testing

## Running Tests

### Unit Tests
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test -- --run

# Run with UI mode
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

## Project Structure

```
budget-manager/
├── src/
│   └── test/
│       ├── setup.ts          # Vitest setup & MSW configuration
│       └── example.test.tsx  # Example unit test
├── e2e/
│   └── example.spec.ts       # Example E2E test
├── vitest.config.ts          # Vitest configuration
└── playwright.config.ts      # Playwright configuration
```

## Writing Tests

### Unit Tests

Follow the Vitest guidelines from `.cursor/rules/vitest.mdc`:
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Leverage the Arrange-Act-Assert pattern
- Use testing-library queries for DOM testing

Example:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<button onClick={handleClick}>Click</button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### E2E Tests

Follow the Playwright guidelines from `.cursor/rules/playwright.mdc`:
- Use Page Object Model for maintainable tests
- Use locators for resilient element selection
- Include accessibility checks with @axe-core/playwright
- Use expect assertions with specific matchers

Example:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## MSW API Mocking

MSW is configured in `src/test/setup.ts`. Add handlers as needed:

```typescript
import { http, HttpResponse } from 'msw';
import { server } from './setup';

// In your test
server.use(
  http.get('/api/data', () => {
    return HttpResponse.json({ data: 'mocked' });
  })
);
```

## Coverage

Coverage reports are generated in the `coverage/` directory. Configure thresholds in `vitest.config.ts` if needed.

## CI/CD

Both test suites are configured for CI environments:
- Playwright runs with 2 retries in CI
- Tests run on a single worker in CI for stability
- HTML and jUnit reports are generated for test results
