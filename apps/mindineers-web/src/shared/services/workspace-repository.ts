import { validateWorkspace } from "../../storage.js";
import type {
  StoragePort,
  Workspace,
  WorkspaceIndex,
  WorkspaceRead,
} from "../contracts/workspace";
export const LEGACY_KEY = "mindineers.workspace.v1";
const INDEX_KEY = "mindineers.workspaces.v2";
export function workspaceKey(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id))
    throw new Error("Invalid workspace identifier.");
  return id === "original" ? LEGACY_KEY : `mindineers.workspace.v2.${id}`;
}
export function parseWorkspace(value: unknown): Workspace {
  // The legacy runtime validator remains authoritative at the untrusted-data boundary.
  // Its domain checks must evolve alongside the interfaces as screens migrate.
  return validateWorkspace(value) as Workspace;
}
function parseIndex(value: unknown): WorkspaceIndex {
  if (
    !value ||
    typeof value !== "object" ||
    !("active" in value) ||
    !("items" in value) ||
    typeof value.active !== "string" ||
    !Array.isArray(value.items) ||
    !value.items.length ||
    value.items.length > 1000
  )
    throw new Error("Workspace index cannot be read.");
  const items: { id: string; name: string }[] = value.items.map(
    (item: unknown) => {
      if (
        !item ||
        typeof item !== "object" ||
        !("id" in item) ||
        !("name" in item) ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        item.name.length > 300
      )
        throw new Error("Workspace index cannot be read.");
      workspaceKey(item.id);
      return { id: item.id, name: item.name };
    },
  );
  if (
    new Set(items.map((i) => i.id)).size !== items.length ||
    !items.some((i) => i.id === value.active)
  )
    throw new Error("Workspace index cannot be read.");
  return { active: value.active, items };
}
export function readIndex(storage: StoragePort): WorkspaceIndex {
  const raw = storage.getItem(INDEX_KEY);
  if (!raw)
    return {
      active: "original",
      items: [{ id: "original", name: "Personal workspace" }],
    };
  try {
    return parseIndex(JSON.parse(raw) as unknown);
  } catch {
    throw new Error("Workspace index cannot be read.");
  }
}
export function writeIndex(storage: StoragePort, index: WorkspaceIndex): void {
  storage.setItem(INDEX_KEY, JSON.stringify(parseIndex(index)));
}
export function readWorkspace(
  storage: StoragePort,
  id: string,
  empty: () => Workspace,
): WorkspaceRead {
  let raw: string | null = null;
  try {
    raw = storage.getItem(workspaceKey(id));
    if (!raw) return { data: empty(), raw: null, error: null };
    if (raw.length > 10 * 1024 * 1024) throw new Error("Workspace too large.");
    return {
      data: { ...empty(), ...parseWorkspace(JSON.parse(raw) as unknown) },
      raw,
      error: null,
    };
  } catch {
    return {
      data: null,
      raw,
      error:
        "The saved workspace could not be read. Your original data has been preserved.",
    };
  }
}
export function saveWorkspace(
  storage: StoragePort,
  id: string,
  data: Workspace,
): void {
  const serialized = JSON.stringify(parseWorkspace(data));
  if (serialized.length > 10 * 1024 * 1024)
    throw new Error(
      "Workspace exceeds the 10 MB local record limit. Export your work.",
    );
  storage.setItem(workspaceKey(id), serialized);
}
export interface WorkspaceRepository {
  read(id: string): WorkspaceRead;
  save(id: string, data: Workspace): void;
  readIndex(): WorkspaceIndex;
  writeIndex(index: WorkspaceIndex): void;
}
export function createLocalRepository(
  storage: StoragePort,
  empty: () => Workspace,
): WorkspaceRepository {
  return {
    read: (id) => readWorkspace(storage, id, empty),
    save: (id, data) => saveWorkspace(storage, id, data),
    readIndex: () => readIndex(storage),
    writeIndex: (index) => writeIndex(storage, index),
  };
}
