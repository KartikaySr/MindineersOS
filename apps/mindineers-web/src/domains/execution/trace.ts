import type { TraceRecord } from "../../shared/contracts/workspace";
import { validateDataTree } from "../../shared/services/input-safety";
export function validateTrace(value: unknown): TraceRecord {
  validateDataTree(value);
  const object = (x: unknown): x is Record<string, unknown> =>
    !!x && typeof x === "object" && !Array.isArray(x);
  const fields = (x: unknown, keys: string[]): x is Record<string, string> =>
    object(x) &&
    keys.every((k) => typeof x[k] === "string" && x[k].length <= 200000);
  const rows = (x: unknown, check: (v: unknown) => boolean, max: number) =>
    Array.isArray(x) &&
    x.length <= max &&
    x.every(check) &&
    new Set(x.map((v: Record<string, unknown>) => v.id)).size === x.length;
  if (
    !fields(value, ["id", "name", "mode", "status", "startedAt"]) ||
    !object(value)
  )
    throw new Error("Trace metadata is invalid.");
  if (
    !rows(
      value.nodes,
      (n) =>
        fields(n, ["id", "name", "agent", "state"]) &&
        object(n) &&
        Array.isArray(n.dependencies) &&
        n.dependencies.every((d) => typeof d === "string"),
      500,
    )
  )
    throw new Error("Trace nodes are invalid.");
  if (
    !rows(
      value.events,
      (e) => fields(e, ["id", "at", "level", "node", "message"]),
      10000,
    )
  )
    throw new Error("Trace events are invalid.");
  if (
    !rows(
      value.artifacts,
      (a) =>
        fields(a, ["id", "name", "type", "content"]) &&
        object(a) &&
        (a.completeness === undefined ||
          ["Partial", "Complete"].includes(String(a.completeness))) &&
        (a.node === undefined || typeof a.node === "string"),
      1000,
    )
  )
    throw new Error("Trace artifacts are invalid.");
  if (
    !rows(
      value.checkpoints,
      (c) => fields(c, ["id", "name", "at", "node"]),
      1000,
    )
  )
    throw new Error("Trace checkpoints are invalid.");
  // Shape has been checked above; relational validation follows before exposing data.
  const trace = value as unknown as TraceRecord,
    ids = new Set(trace.nodes.map((n) => n.id));
  if (!trace.id.trim() || !Number.isFinite(Date.parse(trace.startedAt)))
    throw new Error("Trace start time is invalid.");
  for (const group of [
    trace.nodes,
    trace.events,
    trace.artifacts,
    trace.checkpoints,
  ])
    if (group.some((row) => !row.id.trim()))
      throw new Error("Trace identifiers must not be empty.");
  for (const a of trace.artifacts)
    if (a.node !== undefined && !ids.has(a.node))
      throw new Error("Artifact node references are invalid.");
  for (const n of trace.nodes)
    if (
      !n.id ||
      n.dependencies.some((d) => !ids.has(d) || d === n.id) ||
      new Set(n.dependencies).size !== n.dependencies.length
    )
      throw new Error("Trace dependency references are invalid.");
  for (const e of trace.events)
    if ((e.node && !ids.has(e.node)) || !Number.isFinite(Date.parse(e.at)))
      throw new Error("Trace event references or timestamps are invalid.");
  for (const c of trace.checkpoints)
    if (!ids.has(c.node) || !Number.isFinite(Date.parse(c.at)))
      throw new Error("Checkpoint references or timestamps are invalid.");
  const done = new Set<string>(),
    visiting = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (done.has(id)) return true;
    visiting.add(id);
    for (const parent of trace.nodes.find((n) => n.id === id)?.dependencies ??
      [])
      if (!visit(parent)) return false;
    visiting.delete(id);
    done.add(id);
    return true;
  };
  if (trace.nodes.some((n) => !visit(n.id)))
    throw new Error("Trace dependencies contain a cycle.");
  return trace;
}
export function replayEvents(trace: TraceRecord, count: number) {
  return [...trace.events]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(0, Math.max(0, Math.floor(count)));
}
