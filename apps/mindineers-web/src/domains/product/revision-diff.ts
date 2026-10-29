export interface FieldChange { path: string; before: string; after: string; kind: "Added" | "Removed" | "Changed" }
function display(value: unknown): string {
  if (value === undefined) return "(Absent)";
  return typeof value === "string" ? value : JSON.stringify(value);
}
export function revisionDiff(before: unknown, after: unknown): FieldChange[] {
  const changes: FieldChange[] = [];
  let visited = 0;
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  function walk(a: unknown, b: unknown, path: string, depth: number) {
    if (++visited > 5000 || depth > 24) throw new Error("Revision exceeds comparison limits.");
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (object(a) && object(b)) {
      for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort())
        walk(a[key], b[key], `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`, depth + 1);
    } else changes.push({path: path || "/", before: display(a), after: display(b), kind: a === undefined ? "Added" : b === undefined ? "Removed" : "Changed"});
  }
  walk(before, after, "", 0);
  return changes;
}
