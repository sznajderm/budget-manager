import { Button } from "@/components/ui/button";

interface TransactionsHeaderProps {
  onAdd: () => void;
}

export function TransactionsHeader({ onAdd }: TransactionsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Transactions</h1>
      <Button onClick={onAdd}>Add Transaction</Button>
    </div>
  );
}
