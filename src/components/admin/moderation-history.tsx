import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getModerationHistory, RUN_PAGE_SIZE } from "@/lib/admin/moderation";
import { DecisionBadge } from "./status-badge";
import { formatDateTime } from "./format";
import { formatUsd, ModerationUsageCard } from "./moderation-usage";
import { Pagination } from "./pagination";

const answersSchema = z.object({ answers: z.array(z.object({
  name: z.string().nullable(), type: z.string(), probability: z.number().optional(),
  choice: z.union([z.string(), z.boolean(), z.number()]).optional(), score: z.number().optional(),
})) });

export async function ModerationHistory({ bookId, searchParams }: {
  bookId: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).reviewsPage;
  const page = z.coerce.number().int().min(1).max(100000).safeParse(raw ?? 1);
  const currentPage = page.success ? page.data : 1;
  const { runs, total, usage } = await getModerationHistory(bookId, currentPage);
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Automatic review history">
      <h2 className="font-heading text-lg font-medium">Automatic review history</h2>
      <ModerationUsageCard usage={usage} />
      {runs.length === 0 && <p className="text-sm text-muted-foreground">No detailed API calls recorded. Older reviews keep their decisions, but their original prompts, responses and costs cannot be reconstructed.</p>}
      {runs.map((run, index) => {
        const parsed = answersSchema.safeParse(run.response);
        const answers = parsed.success ? parsed.data.answers : [];
        return (
          <details key={run.id} open={index === 0} className="min-w-0 rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium">{formatDateTime(run.startedAt)} · {run.state.replaceAll("_", " ")} · {formatUsd(run.estimatedCostUsd)}</summary>
            <div className="mt-4 flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{run.model}</Badge><Badge variant="outline">{run.promptVersion}</Badge>{run.decision && <DecisionBadge decision={run.decision} />}</div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Input / output tokens</dt><dd>{run.inputTokens ?? "Not recorded"} / {run.outputTokens ?? "Not recorded"}</dd></div>
                <div><dt className="text-muted-foreground">Input price per 1M tokens</dt><dd>{formatUsd(run.inputUsdPerMillion)}</dd></div>
                <div><dt className="text-muted-foreground">Duration / HTTP status</dt><dd>{run.durationMs === null ? "Pending" : `${run.durationMs} ms`} / {run.httpStatus ?? "No response"}</dd></div>
                <div><dt className="text-muted-foreground">Applied to book</dt><dd>{run.reviewId ? "Yes" : "No (pending, deleted or resolved separately)"}</dd></div>
              </dl>
              {run.requestId && <p className="break-all font-mono text-xs">Request: {run.requestId}</p>}
              {run.errorCode && <p className="text-sm">Failure: {run.errorCode}</p>}
              {run.reasons.length > 0 && <ul className="list-disc pl-5 text-sm">{run.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>}
              <div className="overflow-x-auto rounded-lg border"><Table>
                <TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Returned answer</TableHead></TableRow></TableHeader>
                <TableBody>{run.questions.map((question) => {
                  const answer = answers.find((a) => a.name === question.name);
                  const label = !answer ? "No answer" : answer.type === "predicate" && answer.probability !== undefined ? `${(answer.probability * 100).toFixed(2)}% probability of true` : answer.type === "refusal" ? "Refused" : String(answer.choice ?? answer.score ?? "See raw response");
                  return <TableRow key={question.name}><TableCell className="whitespace-normal"><p className="font-mono text-xs">{question.name}</p><p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm text-muted-foreground">{question.instructions}</p></TableCell><TableCell className="whitespace-normal">{label}</TableCell></TableRow>;
                })}</TableBody>
              </Table></div>
              {run.inputSnapshot && <details><summary className="cursor-pointer text-sm">{run.sentAt ? "Exact submitted text and image references" : "Prepared text and image references (not sent)"}</summary><pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap break-words">{run.inputSnapshot.text}</pre>
                <ul className="mt-2 space-y-2 text-xs">{run.inputSnapshot.images.map((image) => <li key={image.url} className="break-all"><a href={image.url} target="_blank" rel="noreferrer" className="underline">{image.labels.join(", ")}</a> · {image.bytes} bytes · SHA-256 {image.sha256}</li>)}</ul>
              </details>}
              {run.response !== null && <details><summary className="cursor-pointer text-sm">Raw provider response</summary><pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap break-words">{JSON.stringify(run.response, null, 2)}</pre></details>}
            </div>
          </details>
        );
      })}
      <Pagination pathname={`/admin/books/${bookId}`} params={{}} page={currentPage} pageSize={RUN_PAGE_SIZE} total={total} pageKey="reviewsPage" />
    </section>
  );
}
