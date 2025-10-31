import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignupSchema, type SignupFormValues } from "@/lib/auth/validators";
import { ZodError } from "zod";

type FieldErrorMap = Partial<Record<keyof SignupFormValues, string>>;

export function SignupForm() {
  const [formData, setFormData] = useState<SignupFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<FieldErrorMap>({});
  const [serverError, setServerError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationErrors({});
    setServerError("");
    setSuccessMessage("");

    try {
      SignupSchema.parse(formData);

      setSubmitting(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if email confirmation is required (status 202)
        if (response.status === 202 || data.requiresConfirmation) {
          setSuccessMessage(
            "Registration successful!"
          );
          // Clear form after successful registration
          setFormData({ email: "", password: "", confirmPassword: "" });
        } else {
          // Auto-confirmed - redirect to dashboard
          window.location.assign("/dashboard");
        }
      } else {
        const data = await response.json();
        
        if (response.status === 409) {
          setServerError("Email is already in use.");
        } else {
          setServerError(data.error || "An error occurred during registration.");
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FieldErrorMap = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignupFormValues] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof SignupFormValues>(
    field: K,
    value: SignupFormValues[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError("");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900" role="alert">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900" role="status">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={submitting || !!successMessage}
              aria-invalid={!!validationErrors.email}
              placeholder="your@email.com"
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              disabled={submitting || !!successMessage}
              aria-invalid={!!validationErrors.password}
              placeholder="••••••••"
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600" role="alert">
                {validationErrors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters, including a letter and a number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              disabled={submitting || !!successMessage}
              aria-invalid={!!validationErrors.confirmPassword}
              placeholder="••••••••"
            />
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-600" role="alert">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || !!successMessage}
            className="w-full"
          >
            {submitting ? "Signing up..." : "Sign up"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
