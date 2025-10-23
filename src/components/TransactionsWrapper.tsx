import QueryProvider from "@/components/QueryClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { TransactionsIsland } from "@/components/transactions/TransactionsIsland";

export default function TransactionsWrapper() {
  return (
    <QueryProvider>
      <TransactionsIsland />
      <Toaster />
    </QueryProvider>
  );
}
