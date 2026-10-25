import test from "node:test";
import assert from "node:assert/strict";
import {
  entityKey,
  resolveSetting,
  settingError,
  setOverride,
  undoOverride,
} from "../src/domains/settings/model.ts";
const layers = [
  { id: "Organization", label: "Organization" },
  { id: "Workspace", label: "Workspace" },
  { id: entityKey("Agent", "a"), label: "Agent A" },
];
test("entity overrides remain isolated and inherit scope defaults", () => {
  let settings = setOverride({}, "Workspace", "concurrency", "2");
  settings = setOverride(settings, entityKey("Agent", "a"), "concurrency", "4");
  assert.equal(resolveSetting(settings, layers, "concurrency", "1").value, "4");
  assert.equal(
    resolveSetting(
      settings,
      [...layers.slice(0, 2), { id: entityKey("Agent", "b"), label: "B" }],
      "concurrency",
      "1",
    ).value,
    "2",
  );
  assert.notEqual(entityKey("Agent", "a:b"), entityKey("Agent:a", "b"));
});
test("mandatory ancestor wins and conflicting descendants are identified", () => {
  const settings = {
    Organization: { concurrency: "2", "mandatory:concurrency": "true" },
    Workspace: { concurrency: "4" },
    [entityKey("Agent", "a")]: { concurrency: "8" },
  };
  assert.deepEqual(resolveSetting(settings, layers, "concurrency", "1"), {
    value: "2",
    source: "Organization",
    locked: true,
    conflicts: ["Workspace", "Agent A"],
  });
});
test("reset and undo preserve unrelated concurrent fields", () => {
  const settings = { Workspace: { concurrency: "4", retention: "90" } };
  const reset = setOverride(settings, "Workspace", "concurrency");
  assert.equal(reset.Workspace.concurrency, undefined);
  assert.deepEqual(
    undoOverride(reset, "Workspace", "concurrency", undefined, "4"),
    settings,
  );
  assert.throws(
    () => undoOverride(settings, "Workspace", "concurrency", "2", "1"),
    /changed again/,
  );
});
test("numeric and timezone drafts reject invalid inputs", () => {
  for (const value of ["-1", "Infinity", "NaN", "1.5", "1001"])
    assert.ok(settingError("concurrency", value));
  assert.equal(settingError("budget", "1.50"), null);
  assert.equal(settingError("timezone", "Asia/Kolkata"), null);
  assert.ok(settingError("timezone", "unknown-zone"));
  assert.ok(settingError("language", " "));
});
