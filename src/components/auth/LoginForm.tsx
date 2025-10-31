import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginSchema, type LoginFormValues } from "@/lib/auth/validators";
import { ZodError } from "zod";

type FieldErrorMap = Partial<Record<keyof LoginFormValues, string>>;

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<FieldErrorMap>({});
  const [serverError, setServerError] = useState<string>(() => {
    // Check for error in URL params (from auth callback)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("error") || "";
    }
    return "";
  });
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    // Check for success message in URL params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("confirmed") === "true" ? "Konto potwierdzone! Możesz się teraz zalogować." : "";
    }
    return "";
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationErrors({});
    setServerError("");

    try {
      LoginSchema.parse(formData);

      setSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        window.location.assign("/dashboard");
      } else {
        const data = await response.json();
        setServerError(data.error || "Nieprawidłowe dane logowania.");
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FieldErrorMap = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginFormValues] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K]
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
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby się zalogować</CardDescription>
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
              disabled={submitting}
              aria-invalid={!!validationErrors.email}
              placeholder="twoj@email.com"
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Hasło <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              disabled={submitting}
              aria-invalid={!!validationErrors.password}
              placeholder="••••••••"
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Zapomniałeś hasła? (Ta funkcjonalność nie działa)
            </a>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Nie masz konta?{" "}
            <a href="/signup" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
