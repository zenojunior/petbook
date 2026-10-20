import { Badge } from "@/components/ui/badge";
import type { BookStatus } from "@/lib/admin/data";

const labels: Record<BookStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  rejected: "Rejected",
  needs_human: "Needs review",
};

const variants: Record<BookStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  in_review: "secondary",
  published: "default",
  rejected: "destructive",
  needs_human: "secondary",
};

export function bookStatusLabel(status: BookStatus): string {
  return labels[status];
}

export function StatusBadge({ status }: { status: BookStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

type Decision = "approve" | "reject" | "needs_human";

const decisionLabels: Record<Decision, string> = {
  approve: "Approved",
  reject: "Rejected",
  needs_human: "Sent to admin",
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  const variant = decision === "approve" ? "default" : decision === "reject" ? "destructive" : "secondary";
  return <Badge variant={variant}>{decisionLabels[decision]}</Badge>;
}
