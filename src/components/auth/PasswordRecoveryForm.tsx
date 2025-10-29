import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecoverSchema, type RecoverFormValues } from "@/lib/auth/validators";
import { ZodError } from "zod";

type FieldErrorMap = Partial<Record<keyof RecoverFormValues, string>>;

export function PasswordRecoveryForm() {
  const [formData, setFormData] = useState<RecoverFormValues>({
    email: "",
    redirectTo: "/auth/callback",
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
      RecoverSchema.parse(formData);

      setSubmitting(true);

      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        setSuccessMessage(
          "Wysłaliśmy instrukcje resetu hasła na podany adres email. Sprawdź swoją skrzynkę pocztową."
        );
        setFormData({ email: "", redirectTo: "/auth/callback" });
      } else {
        const data = await response.json();
        setServerError(data.error || "Wystąpił błąd. Spróbuj ponownie.");
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FieldErrorMap = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RecoverFormValues] = err.message;
          }
        });
        setValidationErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof RecoverFormValues>(
    field: K,
    value: RecoverFormValues[K]
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
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Odzyskiwanie hasła</CardTitle>
        <CardDescription>
          Wprowadź swój adres email, aby otrzymać instrukcje resetu hasła
        </CardDescription>
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

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Wysyłanie..." : "Wyślij instrukcje"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Pamiętasz hasło?{" "}
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
