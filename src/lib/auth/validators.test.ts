import { describe, it, expect } from "vitest";
import { LoginSchema, SignupSchema, RecoverSchema, type LoginFormValues, type SignupFormValues } from "./validators";
import { ZodError } from "zod";

describe("LoginSchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid email and password", () => {
      const data = { email: "user@example.com", password: "Password123" };
      expect(() => LoginSchema.parse(data)).not.toThrow();
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user123@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        const data = { email, password: "ValidPass123" };
        expect(() => LoginSchema.parse(data)).not.toThrow();
      });
    });

    it("should accept password with exactly 8 characters (minimum)", () => {
      const data = { email: "user@example.com", password: "Pass0123" };
      expect(() => LoginSchema.parse(data)).not.toThrow();
    });

    it("should accept long passwords", () => {
      const data = { email: "user@example.com", password: "VeryLongPasswordWith123" };
      expect(() => LoginSchema.parse(data)).not.toThrow();
    });
  });

  describe("Invalid email", () => {
    it("should reject empty email", () => {
      const data = { email: "", password: "Password123" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject email without @", () => {
      const data = { email: "userexample.com", password: "Password123" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject email without domain", () => {
      const data = { email: "user@", password: "Password123" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject email with spaces", () => {
      const data = { email: "user @example.com", password: "Password123" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should have correct error message for invalid email", () => {
      const data = { email: "invalid", password: "Password123" };
      try {
        LoginSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const emailError = error.errors.find((e) => e.path[0] === "email");
          expect(emailError?.message).toBe("Enter a valid email address.");
        }
      }
    });
  });

  describe("Invalid password", () => {
    it("should reject password shorter than 8 characters", () => {
      const data = { email: "user@example.com", password: "Pass123" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject empty password", () => {
      const data = { email: "user@example.com", password: "" };
      expect(() => LoginSchema.parse(data)).toThrow(ZodError);
    });

    it("should have correct error message for short password", () => {
      const data = { email: "user@example.com", password: "short" };
      try {
        LoginSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const passwordError = error.errors.find((e) => e.path[0] === "password");
          expect(passwordError?.message).toBe("Password must be at least 8 characters.");
        }
      }
    });
  });

  describe("Type safety", () => {
    it("should return correct type on successful parse", () => {
      const data = { email: "user@example.com", password: "ValidPass123" };
      const result = LoginSchema.parse(data);
      const check: LoginFormValues = result;
      expect(check).toBeDefined();
    });
  });
});

describe("SignupSchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid signup data with matching passwords", () => {
      const data = {
        email: "newuser@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      };
      expect(() => SignupSchema.parse(data)).not.toThrow();
    });

    it("should accept password with letter and number", () => {
      const data = {
        email: "user@example.com",
        password: "AbcDef123",
        confirmPassword: "AbcDef123",
      };
      expect(() => SignupSchema.parse(data)).not.toThrow();
    });
  });

  describe("Invalid email", () => {
    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("Invalid password", () => {
    it("should reject password shorter than 8 characters", () => {
      const data = {
        email: "user@example.com",
        password: "Pass12",
        confirmPassword: "Pass12",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without letter", () => {
      const data = {
        email: "user@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject password without number", () => {
      const data = {
        email: "user@example.com",
        password: "OnlyLetters",
        confirmPassword: "OnlyLetters",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });

    it("should have correct error message for missing letter", () => {
      const data = {
        email: "user@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      };
      try {
        SignupSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const passwordError = error.errors.find((e) => e.path[0] === "password");
          expect(passwordError?.message).toBe("Password must contain a letter.");
        }
      }
    });

    it("should have correct error message for missing number", () => {
      const data = {
        email: "user@example.com",
        password: "OnlyLetters",
        confirmPassword: "OnlyLetters",
      };
      try {
        SignupSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const passwordError = error.errors.find((e) => e.path[0] === "password");
          expect(passwordError?.message).toBe("Password must contain a number.");
        }
      }
    });
  });

  describe("Password confirmation", () => {
    it("should reject non-matching passwords", () => {
      const data = {
        email: "user@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass456",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });

    it("should have correct error message for mismatched passwords", () => {
      const data = {
        email: "user@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass456",
      };
      try {
        SignupSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          const confirmError = error.errors.find((e) => e.path[0] === "confirmPassword");
          expect(confirmError?.message).toBe("Passwords do not match.");
        }
      }
    });

    it("should accept case-sensitive matching passwords", () => {
      const data = {
        email: "user@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      };
      expect(() => SignupSchema.parse(data)).not.toThrow();
    });

    it("should reject case-insensitive mismatches", () => {
      const data = {
        email: "user@example.com",
        password: "ValidPass123",
        confirmPassword: "validpass123",
      };
      expect(() => SignupSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("Type safety", () => {
    it("should return correct type on successful parse", () => {
      const data = {
        email: "user@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      };
      const result = SignupSchema.parse(data);
      const check: SignupFormValues = result;
      expect(check).toBeDefined();
    });
  });
});

describe("RecoverSchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid email", () => {
      const data = { email: "user@example.com" };
      expect(() => RecoverSchema.parse(data)).not.toThrow();
    });

    it("should accept email with optional redirectTo", () => {
      const data = { email: "user@example.com", redirectTo: "https://example.com/dashboard" };
      expect(() => RecoverSchema.parse(data)).not.toThrow();
    });
  });

  describe("Invalid inputs", () => {
    it("should reject invalid email", () => {
      const data = { email: "not-an-email" };
      expect(() => RecoverSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject invalid URL in redirectTo", () => {
      const data = { email: "user@example.com", redirectTo: "not-a-url" };
      expect(() => RecoverSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept valid redirectTo URL", () => {
      const data = { email: "user@example.com", redirectTo: "https://example.com/page" };
      expect(() => RecoverSchema.parse(data)).not.toThrow();
    });
  });
});
