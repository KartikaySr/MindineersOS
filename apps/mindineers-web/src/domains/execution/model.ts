import { validateDataTree } from "../../shared/services/input-safety";
export interface GraphNode {
  id: string;
  name: string;
  type: string;
  timeout: number;
  retries: number;
  position?: { x: number; y: number };
  inputPorts?: { name: string; type: string }[];
  outputPorts?: { name: string; type: string }[];
  inputSchema?: string;
  outputSchema?: string;
  inputType?: string;
  outputType?: string;
  failureMode?: string;
  idempotencyKey?: string;
  condition?: string;
  concurrency?: number;
  mergePolicy?: string;
  subflow?: Graph;
  [key: string]: unknown;
}
export interface GraphEdge {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
export function graphLayout(
  graph: Graph,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>(),
    levels = new Map<string, number>(),
    ids = new Set(graph.nodes.map((n) => n.id));
  const pending = new Set(ids);
  let rounds = 0;
  while (pending.size && rounds++ <= graph.nodes.length) {
    let progress = false;
    for (const id of pending) {
      const parents = graph.edges
        .filter((e) => e.to === id && ids.has(e.from))
        .map((e) => e.from);
      if (parents.every((p) => levels.has(p))) {
        levels.set(
          id,
          parents.length
            ? 1 + Math.max(...parents.map((p) => levels.get(p) ?? 0))
            : 0,
        );
        pending.delete(id);
        progress = true;
      }
    }
    if (!progress) break;
  }
  const counts = new Map<number, number>();
  for (const node of graph.nodes) {
    const level = levels.get(node.id) ?? 0,
      row = counts.get(level) ?? 0;
    counts.set(level, row + 1);
    result.set(
      node.id,
      node.position ?? { x: 40 + level * 260, y: 40 + row * 125 },
    );
  }
  return result;
}
export interface ConfigDifference {
  path: string;
  before: string;
  after: string;
}
export function configDiff(
  before: unknown,
  after: unknown,
): ConfigDifference[] {
  const changes: ConfigDifference[] = [];
  const render = (x: unknown) =>
    x === undefined ? "(absent)" : JSON.stringify(x);
  const visit = (a: unknown, b: unknown, path: string, depth: number) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (
      depth > 12 ||
      !a ||
      !b ||
      typeof a !== "object" ||
      typeof b !== "object" ||
      Array.isArray(a) ||
      Array.isArray(b)
    ) {
      changes.push({ path, before: render(a), after: render(b) });
      return;
    }
    const left = a as Record<string, unknown>,
      right = b as Record<string, unknown>;
    for (const key of new Set([...Object.keys(left), ...Object.keys(right)]))
      visit(left[key], right[key], path + "/" + key, depth + 1);
  };
  visit(before, after, "configuration", 0);
  return changes;
}
export interface RunPlan {
  id: string;
  runId: string;
  checkpointId: string;
  name: string;
  reason: string;
  scope: string;
  budget: string;
  state: "Draft" | "Ready for review";
  createdAt: string;
  sourceMode: string;
}
export interface TriggerRecord {
  id: string;
  workflowId: string;
  name: string;
  kind: "Manual" | "Schedule" | "Event";
  schedule: string;
  timezone: string;
  eventType: string;
  payload: string;
  state: "Draft" | "Ready for review";
  history: { id: string; at: string; outcome: string; evidence: string }[];
}
export interface ExecutionCollections {
  runPlans: RunPlan[];
  workflowTriggers: TriggerRecord[];
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const fields = (v: unknown, keys: string[]): v is Record<string, string> =>
  object(v) &&
  keys.every((k) => typeof v[k] === "string" && v[k].length <= 200000);
export const executionValidators = {
  runPlans: (v: unknown) =>
    fields(v, [
      "id",
      "runId",
      "checkpointId",
      "name",
      "reason",
      "scope",
      "budget",
      "state",
      "createdAt",
      "sourceMode",
    ]) && ["Draft", "Ready for review"].includes(v.state ?? ""),
  workflowTriggers: (v: unknown) =>
    fields(v, [
      "id",
      "workflowId",
      "name",
      "kind",
      "schedule",
      "timezone",
      "eventType",
      "payload",
      "state",
    ]) &&
    ["Manual", "Schedule", "Event"].includes(v.kind ?? "") &&
    ["Draft", "Ready for review"].includes(v.state ?? "") &&
    object(v) &&
    Array.isArray(v.history) &&
    v.history.length <= 10000 &&
    v.history.every((e) => fields(e, ["id", "at", "outcome", "evidence"])),
};
export function triggerErrors(t: TriggerRecord): string[] {
  const errors = [];
  if (!t.name.trim()) errors.push("Name the trigger.");
  try {
    const p: unknown = validateDataTree(JSON.parse(t.payload));
    if (!object(p)) errors.push("Payload must be a JSON object.");
  } catch {
    errors.push("Payload must be valid JSON.");
  }
  if (t.kind === "Schedule") {
    if (!t.schedule.trim()) errors.push("Describe the schedule.");
    try {
      new Intl.DateTimeFormat("en", { timeZone: t.timezone });
    } catch {
      errors.push("Use a valid IANA timezone.");
    }
  }
  if (t.kind === "Event" && !t.eventType.trim())
    errors.push("Specify the event type.");
  return errors;
}
