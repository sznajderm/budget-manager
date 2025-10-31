import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function DateTimeInput({ id, value, onChange, error, disabled }: DateTimeInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Date & Time <span className="text-red-500">*</span>
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="DD/MM/YYYY HH:mm"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">Format: DD/MM/YYYY HH:mm (e.g., 25/12/2024 14:30)</p>
    </div>
  );
}
