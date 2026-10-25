import test from "node:test";
import assert from "node:assert/strict";
import {
  initialHistory,
  replaceHistory,
  commitHistory,
  moveHistory,
  editHistory,
} from "../src/domains/recovery/model.ts";
const workspace = () => ({
  settings: {
    name: "Owner",
    workspace: "Test",
    theme: "Light",
    budget: 50,
    notifications: true,
    motion: false,
  },
  projects: [],
  agents: [],
  records: { missions: [] },
  messages: [],
  posts: [],
  approvals: [],
});
const rename = (data, name) => ({
  ...data,
  settings: { ...data.settings, name },
});
test("workspace recovery restores records and settings and supports redo", () => {
  const initial = workspace();
  const edited = {
    ...rename(initial, "New owner"),
    records: {
      missions: [
        { id: "task", name: "Task", description: "", status: "Draft" },
      ],
    },
  };
  const history = commitHistory(initialHistory(initial), edited, 1000);
  const undo = moveHistory(history, "undo");
  assert.deepEqual(undo.present, initial);
  assert.deepEqual(moveHistory(undo, "redo").present, edited);
  assert.equal(undo.restores, 1);
  assert.notEqual(history.generation, undo.generation);
});
test("typing in one field coalesces but separate fields and actions do not", () => {
  let h = initialHistory(workspace());
  h = commitHistory(h, rename(h.present, "A"), 1000);
  h = commitHistory(h, rename(h.present, "AB"), 1200);
  assert.equal(h.past.length, 1);
  h = commitHistory(
    h,
    {
      ...h.present,
      settings: { ...h.present.settings, workspace: "Different" },
    },
    1300,
  );
  assert.equal(h.past.length, 2);
  h = commitHistory(
    h,
    { ...h.present, records: { missions: [{ id: "task" }] } },
    1400,
  );
  assert.equal(h.past.length, 3);
});
test("new edits after undo discard the redo branch", () => {
  let h = initialHistory(workspace());
  h = moveHistory(commitHistory(h, rename(h.present, "Edit"), 1000), "undo");
  assert.equal(h.future.length, 1);
  h = commitHistory(h, rename(h.present, "New branch"), 2000);
  assert.equal(h.future.length, 0);
  assert.equal(moveHistory(h, "redo"), h);
});
test("old asynchronous saves cannot mutate a switched or restored workspace", () => {
  const old = initialHistory(workspace());
  const switched = initialHistory(rename(workspace(), "Other workspace"));
  let called = false;
  const stale = () => {
    called = true;
    return old.present;
  };
  assert.equal(editHistory(switched, old.generation, stale, 2000), switched);
  const restored = moveHistory(
    commitHistory(old, rename(old.present, "Edit"), 1000),
    "undo",
  );
  assert.equal(editHistory(restored, old.generation, stale, 2000), restored);
  assert.equal(called, false);
});
test("no-op updates do not consume history and functional updates use latest data", () => {
  const h = initialHistory(workspace());
  assert.equal(commitHistory(h, structuredClone(h.present), 1000), h);
  const next = editHistory(
    h,
    h.generation,
    (d) => rename(d, d.settings.name + " changed"),
    1000,
  );
  assert.equal(next.present.settings.name, "Owner changed");
});
test("history is bounded by edit count and memory in both directions", () => {
  let h = initialHistory(workspace());
  for (let n = 0; n < 35; n++)
    h = commitHistory(h, rename(h.present, String(n)), n * 1000);
  assert.equal(h.past.length, 20);
  const huge = { ...h.present, notes: "x".repeat(4_100_000) };
  h = commitHistory(h, huge, 40000);
  h = moveHistory(h, "undo");
  assert.ok(h.bytes <= 8_000_000);
  assert.equal(h.future.length, 0);
});

test("replacement clears history, invalidates old saves, and resets mounted editors", () => {
  let h = initialHistory(workspace());
  h = commitHistory(h, rename(h.present, "Edit"), 1000);
  const replaced = replaceHistory(h, workspace());
  assert.equal(replaced.past.length, 0);
  assert.equal(replaced.future.length, 0);
  assert.equal(replaced.restores, h.restores + 1);
  assert.notEqual(replaced.generation, h.generation);
});
