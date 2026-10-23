export const nodeTypes = [
  "Agent",
  "Tool",
  "Function",
  "Branch",
  "Parallel",
  "Merge",
  "Approval",
  "Timer",
  "Event",
  "Verification",
];
export const makeGraph = () => ({
  nodes: [
    {
      id: "brief",
      name: "Prepare brief",
      type: "Agent",
      timeout: 60,
      retries: 1,
    },
    {
      id: "review",
      name: "Review brief",
      type: "Approval",
      timeout: 300,
      retries: 0,
    },
    {
      id: "verify",
      name: "Check acceptance",
      type: "Verification",
      timeout: 60,
      retries: 0,
    },
  ],
  edges: [
    { from: "brief", to: "review" },
    { from: "review", to: "verify" },
  ],
});
export function validateGraph(graph) {
  const errors = [],
    ids = new Set(graph.nodes.map((n) => n.id));
  if (!graph.nodes.length) errors.push("Add at least one node.");
  if (ids.size !== graph.nodes.length) errors.push("Node IDs must be unique.");
  for (const n of graph.nodes) {
    if (!n.name.trim()) errors.push("Every node needs a name.");
    if (!nodeTypes.includes(n.type)) errors.push("Unknown node type.");
    if (!Number.isInteger(Number(n.timeout)) || n.timeout < 1)
      errors.push(`${n.name}: timeout must be a positive integer.`);
    if (!Number.isInteger(Number(n.retries)) || n.retries < 0 || n.retries > 5)
      errors.push(`${n.name}: retries must be between 0 and 5.`);
  }
  const seenEdges = new Set();
  for (const e of graph.edges) {
    if (!ids.has(e.from) || !ids.has(e.to))
      errors.push("An edge references a missing node.");
    const key = e.from + ">" + e.to;
    if (seenEdges.has(key)) errors.push("Duplicate dependency.");
    seenEdges.add(key);
  }
  const visiting = new Set(),
    done = new Set();
  function visit(id) {
    if (visiting.has(id)) return true;
    if (done.has(id)) return false;
    visiting.add(id);
    for (const e of graph.edges.filter((e) => e.from === id))
      if (visit(e.to)) return true;
    visiting.delete(id);
    done.add(id);
    return false;
  }
  if (graph.nodes.some((n) => visit(n.id)))
    errors.push("Dependency cycle: remove an edge before running.");
  return [...new Set(errors)];
}
export function invoiceTotal(rows, taxBps = 0) {
  if (!Number.isSafeInteger(taxBps) || taxBps < 0 || taxBps > 10000)
    throw new Error("Tax must be between 0 and 100%.");
  const subtotal = rows.reduce((sum, r) => {
    if (
      !Number.isSafeInteger(r.quantity) ||
      r.quantity < 0 ||
      !Number.isSafeInteger(r.unitMinor) ||
      r.unitMinor < 0
    )
      throw new Error("Use whole quantities and non-negative amounts.");
    const amount = r.quantity * r.unitMinor;
    if (!Number.isSafeInteger(amount + sum))
      throw new Error("Amount exceeds supported range.");
    return sum + amount;
  }, 0);
  const tax = Math.round((subtotal * taxBps) / 10000);
  if (!Number.isSafeInteger(subtotal + tax))
    throw new Error("Amount exceeds supported range.");
  return { subtotal, tax, total: subtotal + tax };
}
export function effectiveSetting(scopes, key) {
  for (let i = scopes.length - 1; i >= 0; i--)
    if (Object.hasOwn(scopes[i].values, key))
      return { value: scopes[i].values[key], source: scopes[i].name };
  return { value: undefined, source: "Default" };
}
export function validHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function dependencyErrors(tasks) {
  const visiting = new Set(),
    done = new Set();
  function walk(id) {
    if (visiting.has(id)) return true;
    if (done.has(id)) return false;
    visiting.add(id);
    const task = tasks.find((t) => t.id === id);
    for (const dep of task?.dependsOn || []) if (walk(dep)) return true;
    visiting.delete(id);
    done.add(id);
    return false;
  }
  return tasks.some((t) => walk(t.id));
}
