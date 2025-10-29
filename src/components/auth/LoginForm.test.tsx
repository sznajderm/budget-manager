import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset window.location.search
    delete (window as any).location;
    (window as any).location = { search: '', assign: vi.fn() };
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with title and description', () => {
      render(<LoginForm />);
      expect(screen.getByText('Logowanie')).toBeInTheDocument();
      expect(screen.getByText('Wprowadź swoje dane, aby się zalogować')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input field', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/hasło/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render submit button', () => {
      render(<LoginForm />);
      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginForm />);
      const link = screen.getByRole('link', { name: /zapomniałeś hasła/i });
      expect(link).toHaveAttribute('href', '/forgot-password');
    });

    it('should render signup link', () => {
      render(<LoginForm />);
      const link = screen.getByRole('link', { name: /zarejestruj się/i });
      expect(link).toHaveAttribute('href', '/signup');
    });
  });

  describe('Form state management', () => {
    it('should update email field on input change', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'user@example.com');

      expect(emailInput.value).toBe('user@example.com');
    });

    it('should update password field on input change', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;
      await user.type(passwordInput, 'Password123');

      expect(passwordInput.value).toBe('Password123');
    });

    it('should maintain form state across multiple changes', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'Password123');

      expect(emailInput.value).toBe('user@example.com');
      expect(passwordInput.value).toBe('Password123');
    });
  });

  describe('Client-side validation', () => {
    it('should show password validation error for short password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
      });
    });

    it('should show error for empty email field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(passwordInput, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
      });
    });

    it('should show error for empty password field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
      });
    });

  })

  describe('Error clearing on field change', () => {

    it('should clear server error when user starts typing', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
      );
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      // Wait for server error
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Clear error by typing
      await user.clear(emailInput);
      await user.type(emailInput, 'newuser@example.com');

      // Server error should disappear
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should submit form with valid credentials', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should include credentials in API request', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(async (url, options) => {
        if (url === '/api/auth/login') {
          const body = JSON.parse(options.body);
          expect(body).toEqual({
            email: 'user@example.com',
            password: 'ValidPass123',
          });
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/login',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(async () => {
        // Delay to ensure we can catch the disabled state
        await new Promise((resolve) => setTimeout(resolve, 100));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');

      // Button should be enabled before submission
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);

      // During submission, button should be disabled and show loading text
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /logowanie\.\.\./i })).toBeInTheDocument();
      });
    });

    it('should show loading text during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logowanie\.\.\./i })).toBeInTheDocument();
      });
    });

    it('should clear validation errors on successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      // Validation errors should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
        expect(screen.queryByText('Password must be at least 8 characters.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Server error handling', () => {
    it('should display server error on failed login', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Nieprawidłowe dane logowania.' }), { status: 401 })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(screen.getByText('Nieprawidłowe dane logowania.')).toBeInTheDocument();
      });
    });

    it('should display default error message if response lacks error field', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 500 })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(screen.getByText('Nieprawidłowe dane logowania.')).toBeInTheDocument();
      });
    });

    it('should display server error with aria-alert role', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /zaloguj się/i }));

      await waitFor(() => {
        const alertDiv = screen.getByRole('alert', { hidden: false });
        expect(alertDiv).toHaveTextContent('Server error');
      });
    });
  });

  describe('URL parameter handling', () => {
    it('should display error message from URL params', () => {
      (window.location as any).search = '?error=Email%20not%20confirmed';
      render(<LoginForm />);

      const alertDiv = screen.getByRole('alert');
      expect(alertDiv).toHaveTextContent('Email not confirmed');
    });

    it('should display success message when confirmed=true in URL', () => {
      (window.location as any).search = '?confirmed=true';
      render(<LoginForm />);

      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveTextContent('Konto potwierdzone! Możesz się teraz zalogować.');
    });

    it('should not display success message if confirmed is not true', () => {
      (window.location as any).search = '?confirmed=false';
      render(<LoginForm />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not display error or success messages without URL params', () => {
      (window.location as any).search = '';
      render(<LoginForm />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle multiple URL params', () => {
      (window.location as any).search = '?confirmed=true&other=param';
      render(<LoginForm />);

      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveTextContent('Konto potwierdzone! Możesz się teraz zalogować.');
    });
  });

  describe('Input field behavior', () => {
    it('should disable input fields during form submission', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/hasło/i) as HTMLInputElement;

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });

    it('should show placeholder text in input fields', () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText('twoj@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('Form reset between submissions', () => {
    it('should allow multiple login attempts after error', async () => {
      const user = userEvent.setup();
      let callCount = 0;

      (global.fetch as any).mockImplementation(async (url, options) => {
        if (url === '/api/auth/login') {
          callCount++;
          const body = JSON.parse(options.body);
          // First call fails, second call succeeds
          if (callCount === 1 && body.password === 'WrongPassword123') {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
          }
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole('button', { name: /zaloguj się/i });

      // First attempt with wrong password
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'WrongPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Correct the password for second attempt
      await user.clear(passwordInput);
      await user.type(passwordInput, 'CorrectPass123');
      await user.click(submitButton);

      // Should proceed to dashboard
      await waitFor(() => {
        expect(window.location.assign).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
