export const WORKSPACE_BODY_LIMIT = 1_048_576;
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export interface WorkspaceContents {
  [key: string]: JsonValue;
  settings: { [key: string]: JsonValue };
  records: { [key: string]: JsonValue };
}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function checkWorkspaceContents(value: unknown): WorkspaceContents {
  if (!object(value) || !object(value.settings) || !object(value.records))
    throw Error("invalid_checkpoint");
  let nodes = 0;
  function visit(item: unknown, depth: number): void {
    if (++nodes > 100_000 || depth > 32) throw Error("checkpoint_too_complex");
    if (item === null || typeof item === "boolean" || typeof item === "string")
      return;
    if (typeof item === "number" && Number.isFinite(item)) return;
    if (Array.isArray(item)) {
      for (const child of item) visit(child, depth + 1);
      return;
    }
    if (
      !object(item) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(item))
    )
      throw Error("invalid_checkpoint");
    for (const [key, child] of Object.entries(item)) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw Error("unsafe_checkpoint_key");
      visit(child, depth + 1);
    }
  }
  visit(value, 0);
  return value as WorkspaceContents;
}

export function checkWorkspaceName(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 300)
    throw Error("invalid_name");
  return value.trim();
}

export function checkRevision(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value >= 2_147_483_647
  )
    throw Error("invalid_revision");
  return value;
}
