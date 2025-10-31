import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MoneyInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function MoneyInput({ id, value, onChange, error, disabled }: MoneyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow empty, digits, and one decimal point
    if (input === "" || /^\d*\.?\d{0,2}$/.test(input)) {
      onChange(input);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Amount (USD) <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pl-7"
          data-testid={`transaction-${id}`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
