import QueryProvider from '@/components/QueryClientProvider';
import DashboardSummary from './DashboardSummary';

export default function DashboardWrapper() {
  return (
    <QueryProvider>
      <DashboardSummary />
    </QueryProvider>
  );
}
