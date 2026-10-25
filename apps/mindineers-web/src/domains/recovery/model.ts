import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
export interface Revision {
  data: Workspace;
  at: number;
  areas: string[];
  textPath: string | null;
}
export interface History {
  generation: symbol;
  restores: number;
  present: Workspace;
  past: Revision[];
  future: Revision[];
  lastEdit: number;
  bytes: number;
}
const LIMIT = 20;
const MAX_BYTES = 8_000_000;
export function initialHistory(data: Workspace): History {
  return {
    generation: Symbol(),
    restores: 0,
    present: data,
    past: [],
    future: [],
    lastEdit: 0,
    bytes: 0,
  };
}
export function changedAreas(before: Workspace, after: Workspace): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}
// Only consecutive typing in the same text field is grouped. Creates, deletes,
// reorders, toggles, and changes to multiple fields remain separate undo steps.
function singleTextPath(before: unknown, after: unknown): string | null {
  const changes: (string | null)[] = [];
  const visit = (a: unknown, b: unknown, path: string, depth: number) => {
    if (a === b || changes.length > 1) return;
    if (typeof a === "string" && typeof b === "string") {
      changes.push(path);
      return;
    }
    if (
      depth > 20 ||
      !a ||
      !b ||
      typeof a !== "object" ||
      typeof b !== "object" ||
      Array.isArray(a) !== Array.isArray(b)
    ) {
      changes.push(null);
      return;
    }
    const ak = Object.keys(a),
      bk = Object.keys(b);
    if (JSON.stringify(ak) !== JSON.stringify(bk)) {
      changes.push(null);
      return;
    }
    for (const key of ak)
      visit(
        Reflect.get(a, key),
        Reflect.get(b, key),
        `${path}/${key}`,
        depth + 1,
      );
  };
  visit(before, after, "", 0);
  return changes.length === 1 ? (changes[0] ?? null) : null;
}
function bounded(revisions: Revision[]) {
  let bytes = 0;
  const kept: Revision[] = [];
  for (const revision of revisions.slice(-LIMIT).reverse()) {
    const size = JSON.stringify(revision.data).length * 2;
    if (bytes + size > MAX_BYTES) break;
    kept.unshift(revision);
    bytes += size;
  }
  return { revisions: kept, bytes };
}
export function commitHistory(
  history: History,
  data: Workspace,
  at: number,
): History {
  if (data === history.present) return history;
  const areas = changedAreas(history.present, data);
  if (!areas.length) return history;
  const last = history.past.at(-1);
  const textPath = singleTextPath(history.present, data);
  const coalesce =
    textPath &&
    last?.textPath === textPath &&
    last &&
    at - history.lastEdit < 800 &&
    JSON.stringify(last.areas) === JSON.stringify(areas) &&
    !history.future.length;
  const result = bounded(
    coalesce
      ? history.past
      : [...history.past, { data: history.present, at, areas, textPath }],
  );
  return {
    generation: history.generation,
    restores: history.restores,
    present: data,
    past: result.revisions,
    future: [],
    lastEdit: at,
    bytes: result.bytes,
  };
}
export function moveHistory(
  history: History,
  direction: "undo" | "redo",
): History {
  const source = direction === "undo" ? history.past : history.future;
  const next = source.at(-1);
  if (!next) return history;
  const reverse = {
    data: history.present,
    at: next.at,
    areas: next.areas,
    textPath: next.textPath,
  };
  const past =
    direction === "undo"
      ? history.past.slice(0, -1)
      : [...history.past, reverse];
  const future =
    direction === "undo"
      ? [...history.future, reverse]
      : history.future.slice(0, -1);
  const kept = bounded([...past, ...future]);
  const retained = new Set(kept.revisions);
  return {
    generation: Symbol(),
    restores: history.restores + 1,
    present: next.data,
    past: past.filter((r) => retained.has(r)),
    future: future.filter((r) => retained.has(r)),
    lastEdit: 0,
    bytes: kept.bytes,
  };
}

export function editHistory(
  history: History,
  generation: symbol,
  change: Parameters<WorkspaceUpdate>[0],
  at: number,
): History {
  if (history.generation !== generation) return history;
  return commitHistory(
    history,
    typeof change === "function"
      ? change(history.present)
      : { ...history.present, ...change },
    at,
  );
}

export function replaceHistory(history: History, data: Workspace): History {
  return { ...initialHistory(data), restores: history.restores + 1 };
}
