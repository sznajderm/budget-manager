import { type Page, type Locator, expect } from '@playwright/test';

export class SigninPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.locator('[role="alert"]').first();
    this.signupLink = page.getByRole('link', { name: /zarejestruj się|sign up/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.waitFor({ state: 'visible' });
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillForm(email, password);
    await this.submit();
  }

  async waitForErrorMessage() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async getErrorMessageText(): Promise<string> {
    await this.waitForErrorMessage();
    return (await this.errorMessage.textContent()) || '';
  }
}


