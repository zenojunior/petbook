// Places each table one column to the right of the tables it references, so the diagram reads
// left to right: user, then what a user owns, then what that owns. Self references and cycles
// are ignored instead of looping forever.
export function rankTables(tables: { name: string; dependsOn: string[] }[]): Map<string, number> {
  const byName = new Map(tables.map((t) => [t.name, t]));
  const ranks = new Map<string, number>();

  function rankOf(name: string, visiting: Set<string>): number {
    const known = ranks.get(name);
    if (known !== undefined) return known;
    const table = byName.get(name);
    if (!table || visiting.has(name)) return -1;
    visiting.add(name);
    const parents = table.dependsOn.filter((parent) => parent !== name);
    const rank = parents.length ? Math.max(...parents.map((p) => rankOf(p, visiting))) + 1 : 0;
    visiting.delete(name);
    ranks.set(name, Math.max(rank, 0));
    return Math.max(rank, 0);
  }

  for (const table of tables) rankOf(table.name, new Set());
  return ranks;
}
