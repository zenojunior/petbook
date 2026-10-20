"use client";

import { KeyRound, Link2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";
import type { DiagramTable } from "@/lib/admin/schema-diagram";

type Line = { from: string; to: string; d: string };

// Tables are laid out in columns by rank (see rankTables), and each foreign key is drawn as a
// curve from its column to the referenced column. The curves are measured from the DOM after
// layout, so they follow the cards whatever their size.
export function SchemaDiagram({ tables }: { tables: DiagramTable[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<string | null>(null);

  const columns: DiagramTable[][] = [];
  for (const table of tables) (columns[table.rank] ??= []).push(table);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      if (!container) return;
      const box = container.getBoundingClientRect();
      const rowRect = (key: string) =>
        container.querySelector(`[data-column="${CSS.escape(key)}"]`)?.getBoundingClientRect();

      const next: Line[] = [];
      for (const table of tables) {
        for (const column of table.columns) {
          if (!column.references) continue;
          const from = rowRect(`${table.name}.${column.name}`);
          const to = rowRect(`${column.references.table}.${column.references.column}`);
          if (!from || !to) continue;
          // Leave from the side facing the target, so lines never cross their own card.
          const leftward = to.left < from.left;
          const x1 = (leftward ? from.left : from.right) - box.left;
          const x2 = (leftward ? to.right : to.left) - box.left;
          const y1 = from.top + from.height / 2 - box.top;
          const y2 = to.top + to.height / 2 - box.top;
          const bend = Math.max(Math.abs(x2 - x1) / 2, 24) * (leftward ? -1 : 1);
          next.push({
            from: table.name,
            to: column.references.table,
            d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
          });
        }
      }
      setLines(next);
      setSize({ width: container.scrollWidth, height: container.scrollHeight });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [tables]);

  return (
    <div className="overflow-x-auto rounded-xl border bg-muted/30">
      <div ref={containerRef} className="relative flex w-max gap-12 p-6">
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.width}
          height={size.height}
          aria-hidden
        >
          {lines.map((line, i) => {
            const lit = active !== null && (line.from === active || line.to === active);
            return (
              <path
                key={i}
                d={line.d}
                fill="none"
                className={cn(
                  "transition-[stroke,opacity]",
                  lit ? "stroke-primary" : "stroke-muted-foreground",
                  active !== null && !lit && "opacity-20",
                )}
                strokeWidth={lit ? 2 : 1.25}
              />
            );
          })}
        </svg>

        {columns.map((column, rank) => (
          <div key={rank} className="flex flex-col justify-center gap-6">
            {column.map((table) => (
              <TableCard
                key={table.name}
                table={table}
                dimmed={active !== null && active !== table.name && !isLinked(tables, active, table.name)}
                onHover={setActive}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCard({
  table,
  dimmed,
  onHover,
}: {
  table: DiagramTable;
  dimmed: boolean;
  onHover: (name: string | null) => void;
}) {
  return (
    <a
      href={`#table-${table.name}`}
      onMouseEnter={() => onHover(table.name)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(table.name)}
      onBlur={() => onHover(null)}
      className={cn(
        "relative w-56 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      <div className="border-b bg-muted px-3 py-2 font-mono text-sm font-semibold">{table.name}</div>
      <ul className="py-1 font-mono text-xs">
        {table.columns.map((column) => (
          <li
            key={column.name}
            data-column={`${table.name}.${column.name}`}
            className="flex items-center gap-1.5 px-3 py-0.5"
            title={
              column.references
                ? `→ ${column.references.table}.${column.references.column} (on delete ${column.references.onDelete ?? "no action"})`
                : undefined
            }
          >
            {column.primary ? (
              <KeyRound className="size-3 shrink-0 text-primary" aria-label="Primary key" />
            ) : column.references ? (
              <Link2 className="size-3 shrink-0 text-muted-foreground" aria-label="Foreign key" />
            ) : (
              <span className="size-3 shrink-0" />
            )}
            <span className={cn("truncate", column.primary && "font-semibold")}>{column.name}</span>
            <span className="ml-auto shrink-0 text-muted-foreground">
              {column.type}
              {column.notNull ? "" : "?"}
              {column.unique && !column.primary ? " uq" : ""}
            </span>
          </li>
        ))}
      </ul>
    </a>
  );
}

function isLinked(tables: DiagramTable[], a: string, b: string): boolean {
  const points = (from: string, to: string) =>
    tables.find((t) => t.name === from)?.columns.some((c) => c.references?.table === to) ?? false;
  return points(a, b) || points(b, a);
}
