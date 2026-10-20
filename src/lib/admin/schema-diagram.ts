// Describes the Drizzle schema as plain data for the database diagram. It reads the table
// definitions in src/db/schema.ts, so the diagram follows every migration without being edited.
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import { rankTables } from "./rank-tables";

export type DiagramColumn = {
  name: string;
  type: string;
  notNull: boolean;
  primary: boolean;
  unique: boolean;
  // Set when the column points at another table.
  references: { table: string; column: string; onDelete: string | undefined } | null;
};

export type DiagramTable = { name: string; columns: DiagramColumn[]; rank: number };

export function describeSchema(): DiagramTable[] {
  // The schema module also exports enums and relations; keep only the tables.
  const tables = (Object.values(schema) as unknown[]).filter((value): value is PgTable => is(value, PgTable));

  const described = tables.map((table) => {
    const config = getTableConfig(table);
    const references = new Map<string, DiagramColumn["references"]>();
    for (const fk of config.foreignKeys) {
      const ref = fk.reference();
      ref.columns.forEach((column, i) => {
        references.set(column.name, {
          table: getTableConfig(ref.foreignTable).name,
          column: ref.foreignColumns[i].name,
          onDelete: fk.onDelete,
        });
      });
    }
    return {
      name: config.name,
      columns: config.columns.map((column) => ({
        name: column.name,
        type: column.getSQLType(),
        notNull: column.notNull,
        primary: column.primary,
        unique: column.isUnique,
        references: references.get(column.name) ?? null,
      })),
    };
  });

  const ranks = rankTables(
    described.map((t) => ({
      name: t.name,
      dependsOn: t.columns.flatMap((c) => (c.references ? [c.references.table] : [])),
    })),
  );
  return described.map((t) => ({ ...t, rank: ranks.get(t.name) ?? 0 }));
}
