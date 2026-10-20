import { Check, CircleHelp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { explainChecks, explainDecision } from "@/lib/moderation/explain";
import type { CheckVerdict } from "@/lib/moderation/parse-moderation";

const verdictStyle: Record<CheckVerdict, { text: string; badge: "default" | "secondary" | "destructive"; icon: typeof Check; bar: string }> = {
  pass: { text: "Passed", badge: "default", icon: Check, bar: "bg-primary" },
  unsure: { text: "Unsure", badge: "secondary", icon: CircleHelp, bar: "bg-muted-foreground" },
  fail: { text: "Failed", badge: "destructive", icon: X, bar: "bg-destructive" },
};

// What the automatic reviewer concluded, one row per check, with the verdict first and the
// number second. The number is the chance, in the reviewer's own words, that the statement is true.
export function ModerationChecks({
  decision,
  answers,
}: {
  decision: "approve" | "reject" | "needs_human" | null;
  answers: { name: string | null; probability?: number }[];
}) {
  const checks = explainChecks(answers);
  if (checks.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {decision && <p className="text-sm font-medium">{explainDecision(decision, checks)}</p>}
      <ul className="flex flex-col gap-2">
        {checks.map((check) => {
          const style = verdictStyle[check.verdict];
          return (
            <li key={check.name} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.rule}</p>
              </div>
              <div className="flex items-center gap-3 sm:w-64">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${(check.probability * 100).toFixed(1)}% chance`}>
                  <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(check.probability * 100, 1)}%` }} />
                </div>
                <span className="w-12 text-right text-sm tabular-nums">{Number((check.probability * 100).toFixed(1))}%</span>
                <Badge variant={style.badge} className="w-20 justify-center gap-1">
                  <style.icon className="size-3" aria-hidden />
                  {style.text}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
