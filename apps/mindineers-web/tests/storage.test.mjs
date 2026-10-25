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

test("restored domain text fields cannot smuggle objects into editors", () => {
  for (const field of [
    "email",
    "date",
    "time",
    "due",
    "tags",
    "stage",
    "notes",
  ]) {
    const value = structuredClone(fixture());
    value.records.customers = [
      {
        id: "c",
        name: "Contact",
        description: "",
        status: "Lead",
        [field]: { bad: true },
      },
    ];
    assert.throws(() => validateWorkspace(value), /records/);
  }
});
test("restored workflow optional fields must match the typed editor contract", () => {
  const value = structuredClone(fixture());
  value.suite = {
    settings: {},
    localRecords: {},
    runs: [],
    details: {
      w: {
        values: {},
        history: [],
        checklist: [],
        comments: [],
        links: [],
        graph: {
          nodes: [
            {
              id: "n",
              name: "Node",
              type: "Agent",
              timeout: 60,
              retries: 0,
              inputSchema: { bad: true },
            },
          ],
          edges: [],
        },
      },
    },
  };
  assert.throws(() => validateWorkspace(value), /graph/);
});

test("duplicate identity in a workspace list is rejected before one edit can affect multiple records", () => {
  for (const collection of ["projects", "agents"]) {
    const value = structuredClone(fixture());
    value[collection].push(structuredClone(value[collection][0]));
    assert.throws(() => validateWorkspace(value), /Duplicate/);
  }
  const value = structuredClone(fixture());
  const record = { id: "same", name: "A", description: "", status: "Draft" };
  value.records.missions = [record, { ...record, name: "B" }];
  assert.throws(() => validateWorkspace(value), /Duplicate/);
});
test("legacy evidence restore rejects credentials and control characters in links", () => {
  for (const url of [
    "https://user:secret@example.org",
    "https://example.org/\npath",
  ]) {
    const value = structuredClone(fixture());
    value.suite = {
      settings: {},
      localRecords: {},
      runs: [],
      details: {
        r: {
          values: {},
          history: [],
          checklist: [],
          comments: [],
          links: [],
          evidence: [
            {
              id: "e",
              at: "2026-10-25",
              url,
              excerpt: "Quote",
              assessment: "Supports",
            },
          ],
        },
      },
    };
    assert.throws(() => validateWorkspace(value), /evidence/);
  }
});
