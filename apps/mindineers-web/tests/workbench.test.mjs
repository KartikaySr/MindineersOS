import test from "node:test";
import assert from "node:assert/strict";
import {
  makeGraph,
  validateGraph,
  invoiceTotal,
  effectiveSetting,
  validHttpUrl,
} from "../src/workbench-model.js";
test("workflow dependencies reject cycles and dangling references", () => {
  const graph = makeGraph();
  assert.deepEqual(validateGraph(graph), []);
  graph.edges.push({ from: "verify", to: "brief" });
  assert.match(validateGraph(graph).join(" "), /cycle/);
  graph.edges = [{ from: "missing", to: "brief" }];
  assert.match(validateGraph(graph).join(" "), /missing/);
});
test("workflow bounds retries and rejects duplicate links", () => {
  const graph = makeGraph();
  graph.nodes[0].retries = 6;
  graph.edges.push(graph.edges[0]);
  const result = validateGraph(graph).join(" ");
  assert.match(result, /retries/);
  assert.match(result, /Duplicate/);
});
test("invoice sums use integer minor units and round tax once", () =>
  assert.deepEqual(
    invoiceTotal(
      [
        { quantity: 3, unitMinor: 1999 },
        { quantity: 1, unitMinor: 250 },
      ],
      825,
    ),
    { subtotal: 6247, tax: 515, total: 6762 },
  ));
test("invoice rejects fractional quantities, negative prices and overflow", () => {
  for (const rows of [
    [{ quantity: 1.5, unitMinor: 10 }],
    [{ quantity: 1, unitMinor: -1 }],
    [{ quantity: 2, unitMinor: Number.MAX_SAFE_INTEGER }],
  ])
    assert.throws(() => invoiceTotal(rows));
  assert.throws(() => invoiceTotal([], 10001));
});
test("settings resolve the nearest explicit override including empty or zero values", () => {
  const scopes = [
    { name: "Organization", values: { budget: 50 } },
    { name: "Workspace", values: { budget: 0 } },
    { name: "Run", values: {} },
  ];
  assert.deepEqual(effectiveSetting(scopes, "budget"), {
    value: 0,
    source: "Workspace",
  });
});
test("evidence links accept only HTTP(S)", () => {
  assert.equal(validHttpUrl("https://example.org/research"), true);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///secret",
    "oops",
  ])
    assert.equal(validHttpUrl(url), false);
});
import { dependencyErrors } from "../src/workbench-model.js";
test("mission dependencies detect cycles across multiple tasks", () => {
  assert.equal(
    dependencyErrors([
      { id: "a", dependsOn: ["b"] },
      { id: "b", dependsOn: ["c"] },
      { id: "c", dependsOn: [] },
    ]),
    false,
  );
  assert.equal(
    dependencyErrors([
      { id: "a", dependsOn: ["b"] },
      { id: "b", dependsOn: ["c"] },
      { id: "c", dependsOn: ["a"] },
    ]),
    true,
  );
});
test("workflow port contracts reject incompatible types and malformed JSON", () => {
  const g = makeGraph();
  g.nodes[0].outputType = "Text";
  g.nodes[1].inputType = "Number";
  g.nodes[0].inputSchema = "{bad";
  const errors = validateGraph(g).join(" ");
  assert.match(errors, /Type mismatch/);
  assert.match(errors, /valid JSON/);
});

test("workflow named ports validate both endpoints and compatible types", () => {
  const g = makeGraph();
  g.nodes[0].outputPorts = [{ name: "result", type: "Text" }];
  g.nodes[1].inputPorts = [{ name: "payload", type: "Number" }];
  g.edges[0] = {
    from: "brief",
    to: "review",
    fromPort: "result",
    toPort: "payload",
  };
  assert.ok(validateGraph(g).some((e) => e.includes("Port type mismatch")));
  g.nodes[1].inputPorts[0].type = "Text";
  assert.deepEqual(validateGraph(g), []);
  g.edges[0].toPort = "missing";
  assert.ok(validateGraph(g).some((e) => e.includes("missing input")));
});
test("nested subflows validate their graphs and bound recursion", () => {
  const g = makeGraph();
  g.nodes[0].type = "Subflow";
  g.nodes[0].subflow = makeGraph();
  assert.deepEqual(validateGraph(g), []);
  g.nodes[0].subflow.edges.push({ from: "verify", to: "brief" });
  assert.ok(validateGraph(g).some((e) => e.includes("cycle")));
  g.nodes[0].subflow = g;
  assert.ok(validateGraph(g).some((e) => e.includes("four nested")));
});
