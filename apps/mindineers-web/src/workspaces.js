import { validateWorkspace } from "./storage.js";
export const LEGACY_KEY = "mindineers.workspace.v1";
const INDEX_KEY = "mindineers.workspaces.v2";
export const workspaceKey = (id) =>
  id === "original" ? LEGACY_KEY : `mindineers.workspace.v2.${id}`;
export function readIndex(storage) {
  const raw = storage.getItem(INDEX_KEY);
  if (!raw)
    return {
      active: "original",
      items: [{ id: "original", name: "Personal workspace" }],
    };
  const index = JSON.parse(raw);
  if (
    !index ||
    !Array.isArray(index.items) ||
    !index.items.length ||
    index.items.some(
      (i) => typeof i.id !== "string" || typeof i.name !== "string",
    ) ||
    !index.items.some((i) => i.id === index.active)
  )
    throw new Error("Workspace index cannot be read.");
  return index;
}
export function writeIndex(storage, index) {
  storage.setItem(INDEX_KEY, JSON.stringify(index));
}
export function readWorkspace(storage, id, empty) {
  const raw = storage.getItem(workspaceKey(id));
  if (!raw) return { data: empty(), raw: null, error: null };
  try {
    return {
      data: { ...empty(), ...validateWorkspace(JSON.parse(raw)) },
      raw,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      raw,
      error:
        "The saved workspace could not be read. Your original data has been preserved.",
    };
  }
}
export function saveWorkspace(storage, id, data) {
  validateWorkspace(data);
  storage.setItem(workspaceKey(id), JSON.stringify(data));
}
