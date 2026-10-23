import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkspace } from "../src/storage.js";
import { initialAgents, seedProjects, seeds } from "../src/data.js";
const fixture = () => ({
  settings: {
    name: "Test",
    workspace: "Studio",
    theme: "Light",
    motion: false,
    notifications: true,
    budget: 50,
  },
  agents: initialAgents,
  projects: seedProjects,
  records: seeds,
  messages: [],
  posts: [],
  approvals: [],
});
test("valid local workspace can be restored", () =>
  assert.equal(validateWorkspace(fixture()).projects.length, 3));
test("malformed agent content is rejected before restore", () => {
  const x = fixture();
  x.agents = [{ name: { injected: "value" } }];
  assert.throws(() => validateWorkspace(x), /agents/);
});
test("non-finite or negative budgets cannot be restored", () => {
  for (const budget of [-1, Infinity, NaN]) {
    const x = fixture();
    x.settings.budget = budget;
    assert.throws(() => validateWorkspace(x), /preferences/);
  }
});
test("invalid message role cannot spoof restored conversation", () => {
  const x = fixture();
  x.messages = [{ id: "x", text: "x", role: "assistant" }];
  assert.throws(() => validateWorkspace(x), /messages/);
});
test("invalid record collection cannot crash domain views after restore", () => {
  const x = fixture();
  x.records = { missions: null };
  assert.throws(() => validateWorkspace(x), /records/);
});
test("out-of-range progress cannot be restored", () => {
  const x = fixture();
  x.projects = [{ ...seedProjects[0], progress: 101 }];
  assert.throws(() => validateWorkspace(x), /projects/);
});
test("malformed extended records are rejected before restore", () => {
  const x = fixture();
  x.suite = {
    settings: {},
    localRecords: {},
    details: {
      "p:x": {
        values: {},
        history: [],
        checklist: null,
        comments: [],
        links: [],
      },
    },
  };
  assert.throws(() => validateWorkspace(x), /details/);
});
test("extended workspace survives backup validation", () => {
  const x = fixture();
  x.suite = {
    settings: { Workspace: { budget: "50" } },
    localRecords: {},
    details: {
      "p:x": {
        values: { Objective: "Ship" },
        history: [],
        checklist: [],
        comments: [],
        links: [],
      },
    },
  };
  assert.equal(
    validateWorkspace(x).suite.details["p:x"].values.Objective,
    "Ship",
  );
});
