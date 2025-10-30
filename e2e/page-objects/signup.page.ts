import { type Page, type Locator, expect } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.submitButton = page.getByRole('button', { name: /zarejestruj się/i });
    this.successMessage = page.locator('[role="status"]');
    this.errorMessage = page.locator('[role="alert"]').first();
    this.loginLink = page.getByRole('link', { name: /Log in/i });
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async fillForm(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword ?? password);
  }

  async submit() {
    await this.submitButton.waitFor({ state: 'visible' });
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async register(email: string, password: string, confirmPassword?: string) {
    await this.fillForm(email, password, confirmPassword);
    await this.submit();
  }

  async waitForSuccessMessage() {
    await this.successMessage.waitFor({ state: 'visible' });
  }

  async waitForErrorMessage() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async getErrorMessageText(): Promise<string> {
    await this.waitForErrorMessage();
    return await this.errorMessage.textContent() || '';
  }

  async getSuccessMessageText(): Promise<string> {
    await this.waitForSuccessMessage();
    return await this.successMessage.textContent() || '';
  }
}
