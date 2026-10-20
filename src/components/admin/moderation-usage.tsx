import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModerationUsage } from "@/lib/admin/moderation";

export function formatUsd(value: string | number | null): string {
  if (value === null) return "Not recorded";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 10 }).format(Number(value));
}

export function ModerationUsageCard({ usage }: { usage: ModerationUsage }) {
  return (
    <Card>
      <CardHeader><CardTitle>Review processing</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold tabular-nums">{formatUsd(usage.estimatedCostUsd)} <span className="text-sm font-normal text-muted-foreground">estimated known cost</span></p>
        <p className="text-sm text-muted-foreground">{usage.requests} API request attempts · {usage.inputTokens.toLocaleString("en-US")} recorded input tokens. Includes deleted books.</p>
        {(usage.unpriced > 0 || usage.legacyReviews > 0) && <p className="text-sm text-muted-foreground">Not included in this total: {usage.unpriced} requests without recorded cost and {usage.legacyReviews} older AI reviews without usage history.</p>}
        <p className="text-xs text-muted-foreground">USD estimate from reported input tokens and the price stored with each request. Account-specific discounts, regional and long-context adjustments may differ from the provider invoice.</p>
      </CardContent>
    </Card>
  );
}
