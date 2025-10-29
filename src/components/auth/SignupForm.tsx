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
        
        if (response.status === 202) {
          setSuccessMessage(
            "Sprawdź swoją skrzynkę pocztową i potwierdź adres email, aby dokończyć rejestrację."
          );
        } else {
          window.location.assign("/dashboard");
        }
      } else {
        const data = await response.json();
        
        if (response.status === 409) {
          setServerError("Adres email jest już zajęty.");
        } else {
          setServerError(data.error || "Wystąpił błąd podczas rejestracji.");
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
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Utwórz nowe konto</CardDescription>
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
              Min. 8 znaków, zawierające literę i cyfrę
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Potwierdź hasło <span className="text-red-500">*</span>
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
            {submitting ? "Rejestracja..." : "Zarejestruj się"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Masz już konto?{" "}
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
