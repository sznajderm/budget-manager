import type { SummaryCardProps } from "./types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export default function SummaryCard({ title, kind, data, isLoading, error, onRetry }: SummaryCardProps) {
  const color = kind === "expense" ? "text-red-600" : "text-emerald-600";
  const border = kind === "expense" ? "border-red-200" : "border-emerald-200";

  return (
    <Card className={clsx("border", border)} aria-busy={isLoading}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : error ? (
          <Alert role="alert" className="space-y-2">
            <AlertDescription>{error}</AlertDescription>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            )}
          </Alert>
        ) : data ? (
          <div className="space-y-1">
            <div className={clsx("text-3xl font-semibold", color)} aria-live="polite">
              {data.totalFormatted}
            </div>
            <div className="text-sm text-muted-foreground">{data.transactionCount} transactions</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
