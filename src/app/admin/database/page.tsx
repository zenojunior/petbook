import { Suspense } from "react";
import { formatBytes } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { SchemaDiagram } from "@/components/admin/schema-diagram";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDatabase } from "@/lib/admin/data";
import { StatsSkeleton } from "@/components/skeletons";

export default function DatabasePage() {
  return (
    <>
      <PageHeader title="Database" description="Every table, how they connect and how much space they use." />
      <Suspense fallback={<StatsSkeleton />}>
        <Database />
      </Suspense>
    </>
  );
}

// How a member's book ends up in the tables above, in the order it happens.
const bookFlow = [
  { table: "user, account, session", text: "The member signs in with Google. Better Auth creates the account." },
  { table: "pets", text: "They add their pet: name, species, dates and a rounded location (owner_id)." },
  { table: "books", text: "They start the book for that pet. One book per pet (pet_id is unique), status draft." },
  { table: "pages", text: "They write the pages, ordered by position, each with a layout, text and a photo." },
  { table: "uploads/books/<book id>/", text: "The photos are files on the server's disk, not rows in the database." },
  { table: "reviews", text: "On submit, every moderation decision (rules, AI, admin) is recorded here." },
];

// getDatabase() calls requireAdmin(), so none of this is prerendered or sent to non-admins.
async function Database() {
  const data = await getDatabase();
  const tablesBytes = data.tables.reduce((sum, t) => sum + t.totalBytes, 0);
  const byWeight = [...data.tables].sort((a, b) => b.totalBytes - a.totalBytes);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Database" value={formatBytes(data.databaseBytes)} hint="Whole Postgres database, system catalogs included" />
        <Stat label="Our tables" value={formatBytes(tablesBytes)} hint={`${data.tables.length} tables, data and indexes`} />
        <Stat
          label="Uploaded images"
          value={formatBytes(data.uploads.bytes)}
          hint={`${data.uploads.files} file${data.uploads.files === 1 ? "" : "s"} on disk`}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-medium">Diagram</h2>
          <p className="text-sm text-muted-foreground">
            Read from <code className="font-mono">src/db/schema.ts</code>, so it follows every migration. Hover a
            table to see its links; <span className="font-mono">?</span> marks a nullable column.
          </p>
        </div>
        <SchemaDiagram tables={data.tables} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How a member&apos;s book is stored</CardTitle>
          <CardDescription>From sign-in to the review queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {bookFlow.map((step, i) => (
              <li key={step.table} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
                  {i + 1}
                </span>
                <div className="flex flex-col">
                  <code className="font-mono text-sm">{step.table}</code>
                  <span className="text-muted-foreground">{step.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Tables by size</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Data</TableHead>
                <TableHead className="text-right">Indexes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byWeight.map((t) => (
                <TableRow key={t.name} id={`table-${t.name}`} className="scroll-mt-8 target:bg-muted">
                  <TableCell className="font-mono">{t.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.rows.toLocaleString("en")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBytes(t.dataBytes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBytes(t.indexBytes)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatBytes(t.totalBytes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>All tables</TableCell>
                <TableCell className="text-right tabular-nums">{formatBytes(tablesBytes)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground">
          Total includes TOAST, where Postgres keeps long text and jsonb. Even an empty table takes a few KB for its
          indexes. Uploaded images are read from <code className="font-mono">{data.uploads.dir}</code>.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}
