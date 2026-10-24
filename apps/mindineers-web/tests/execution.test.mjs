import test from "node:test";
import assert from "node:assert/strict";
import {
  graphLayout,
  configDiff,
  triggerErrors,
} from "../src/domains/execution/model.ts";
import { validateTrace, replayEvents } from "../src/domains/execution/trace.ts";
import {
  validateAcknowledgement,
  disconnectedRuntime,
} from "../src/domains/execution/RunControls.tsx";
import { validateProduct } from "../src/product-model.js";
const trace = () => ({
  id: "run1",
  name: "Recorded run",
  mode: "Imported trace",
  status: "Paused",
  startedAt: "2026-10-24T10:00:00Z",
  nodes: [
    {
      id: "a",
      name: "Start",
      agent: "Atlas",
      state: "Completed",
      dependencies: [],
    },
    {
      id: "b",
      name: "Review",
      agent: "Reviewer",
      state: "Paused",
      dependencies: ["a"],
    },
  ],
  events: [
    {
      id: "e2",
      at: "2026-10-24T10:02:00Z",
      level: "Info",
      node: "b",
      message: "Review",
    },
    {
      id: "e1",
      at: "2026-10-24T10:01:00Z",
      level: "Info",
      node: "a",
      message: "Start",
    },
  ],
  checkpoints: [
    { id: "c", name: "Checkpoint", at: "2026-10-24T10:01:00Z", node: "a" },
  ],
  artifacts: [
    {
      id: "f",
      name: "Draft",
      type: "Text",
      content: "Partial content",
      completeness: "Partial",
      node: "a",
    },
  ],
});
test("graph layout respects dependencies and saved positions, tolerating invalid cycles for inspection", () => {
  const graph = {
    nodes: ["a", "b", "c"].map((id) => ({
      id,
      name: id,
      type: "Agent",
      timeout: 60,
      retries: 0,
    })),
    edges: [
      { from: "a", to: "b" },
      { from: "a", to: "c" },
    ],
  };
  const p = graphLayout(graph);
  assert.ok(p.get("b").x > p.get("a").x);
  assert.notEqual(p.get("b").y, p.get("c").y);
  graph.nodes[1].position = { x: 420, y: 90 };
  assert.deepEqual(graphLayout(graph).get("b"), { x: 420, y: 90 });
  graph.edges.push({ from: "b", to: "a" });
  assert.equal(graphLayout(graph).size, 3);
});
test("configuration diff includes additions, removals and array changes without mutating snapshots", () => {
  const before = { name: "A", removed: true, steps: ["one"] },
    after = { name: "B", added: false, steps: ["two"] };
  const diff = configDiff(before, after);
  assert.equal(diff.length, 4);
  assert.equal(diff.find((d) => d.path.endsWith("/removed")).after, "(absent)");
  assert.equal(before.name, "A");
  assert.deepEqual(configDiff(before, { ...before }), []);
});
test("trace validation rejects broken graph references, duplicate IDs, cycles and malformed artifacts", () => {
  assert.equal(validateTrace(trace()).id, "run1");
  validateProduct({ traces: [trace()] });
  for (const mutate of [
    (t) => t.nodes.push({ ...t.nodes[0] }),
    (t) => (t.nodes[1].dependencies = ["missing"]),
    (t) => (t.nodes[0].dependencies = ["b"]),
    (t) => (t.events[0].node = "unknown"),
    (t) => (t.events[0].at = "invalid"),
    (t) => (t.checkpoints[0].node = "unknown"),
    (t) => (t.artifacts[0].completeness = "Guaranteed"),
    (t) => (t.artifacts[0].node = "missing"),
    (t) => (t.events[0].id = ""),
  ]) {
    const t = trace();
    mutate(t);
    assert.throws(() => validateTrace(t));
    assert.throws(() => validateProduct({ traces: [t] }));
  }
  assert.throws(() => validateTrace(JSON.parse('{"__proto__":{}}')));
});
test("replay orders recorded evidence without changing authoritative nodes or source event order", () => {
  const t = trace();
  assert.deepEqual(
    replayEvents(t, 1).map((e) => e.id),
    ["e1"],
  );
  assert.equal(t.events[0].id, "e2");
  assert.equal(t.nodes[1].state, "Paused");
  assert.deepEqual(replayEvents(t, -5), []);
});
test("trigger drafts validate payload, event type and timezone without activation", () => {
  const t = {
    id: "t",
    workflowId: "w",
    name: "Trigger",
    kind: "Manual",
    schedule: "",
    timezone: "UTC",
    eventType: "",
    payload: "{}",
    state: "Draft",
    history: [],
  };
  assert.deepEqual(triggerErrors(t), []);
  assert.ok(triggerErrors({ ...t, payload: "[]" }).length);
  assert.ok(triggerErrors({ ...t, payload: '{"__proto__":{}}' }).length);
  assert.ok(
    triggerErrors({
      ...t,
      kind: "Schedule",
      schedule: "daily",
      timezone: "invalid",
    }).length,
  );
  assert.ok(triggerErrors({ ...t, kind: "Event" }).length);
  validateProduct({ workflowTriggers: [t] });
  assert.throws(() =>
    validateProduct({ workflowTriggers: [{ ...t, state: "Active" }] }),
  );
});
test("runtime acknowledgements must match command identity and compatible action outcome", async () => {
  assert.equal(
    validateAcknowledgement(
      { requestId: "q", runId: "r", action: "Pause", status: "Paused" },
      "q",
      "r",
      "Pause",
    ),
    "Paused",
  );
  for (const patch of [
    { requestId: "other" },
    { runId: "other" },
    { action: "Cancel" },
    { status: "Cancelled" },
  ])
    assert.throws(() =>
      validateAcknowledgement(
        {
          requestId: "q",
          runId: "r",
          action: "Pause",
          status: "Paused",
          ...patch,
        },
        "q",
        "r",
        "Pause",
      ),
    );
  assert.equal(disconnectedRuntime.available, false);
  await assert.rejects(() =>
    disconnectedRuntime.command(
      "r",
      "Pause",
      "review",
      "q",
      new AbortController().signal,
    ),
  );
});
test("continuation drafts persist only planning states", () => {
  const p = {
    id: "p",
    runId: "r",
    checkpointId: "c",
    name: "Continue",
    reason: "Review again",
    scope: "Read only",
    budget: "10.00",
    state: "Draft",
    createdAt: new Date().toISOString(),
    sourceMode: "Imported trace",
  };
  validateProduct({ runPlans: [p] });
  assert.throws(() =>
    validateProduct({ runPlans: [{ ...p, state: "Running" }] }),
  );
});
