import test from "node:test";
import assert from "node:assert/strict";
import {
  readIndex,
  readWorkspace,
  saveWorkspace,
  workspaceKey,
  writeIndex,
} from "../src/workspaces.js";
const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
};
const blank = () => ({
  settings: {
    name: "You",
    workspace: "Studio",
    theme: "Light",
    motion: false,
    notifications: true,
    budget: 50,
  },
  agents: [],
  projects: [],
  records: {},
  messages: [],
  posts: [],
  approvals: [],
});
test("workspace data is isolated by workspace ID and legacy data remains addressable", () => {
  const s = storage();
  saveWorkspace(s, "original", blank());
  const second = blank();
  second.settings.workspace = "Other";
  saveWorkspace(s, "second", second);
  assert.equal(workspaceKey("original"), "mindineers.workspace.v1");
  assert.equal(
    readWorkspace(s, "original", blank).data.settings.workspace,
    "Studio",
  );
  assert.equal(
    readWorkspace(s, "second", blank).data.settings.workspace,
    "Other",
  );
});
test("corrupt saved data is preserved for recovery instead of returning a blank writable workspace", () => {
  const s = storage();
  s.setItem(workspaceKey("original"), "{broken");
  const loaded = readWorkspace(s, "original", blank);
  assert.equal(loaded.data, null);
  assert.equal(loaded.raw, "{broken");
  assert.ok(loaded.error);
  assert.equal(s.getItem(workspaceKey("original")), "{broken");
});
test("workspace index rejects dangling active workspace", () => {
  const s = storage();
  const invalid = { active: "missing", items: [{ id: "a", name: "A" }] };
  assert.throws(() => writeIndex(s, invalid), /index/);
  s.setItem("mindineers.workspaces.v2", JSON.stringify(invalid));
  assert.throws(() => readIndex(s), /index/);
});
