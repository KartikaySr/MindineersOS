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
  "Subflow",
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
export function validateGraph(graph, depth = 0) {
  if (depth > 4) return ["Subflows support at most four nested levels."];
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
    return ["Invalid graph structure."];
  if (graph.nodes.length > 200 || graph.edges.length > 1000)
    return ["Use at most 200 nodes and 1,000 connections per graph."];
  const errors = [],
    ids = new Set(graph.nodes.map((n) => n.id));
  if (!graph.nodes.length) errors.push("Add at least one node.");
  if (ids.size !== graph.nodes.length) errors.push("Node IDs must be unique.");
  for (const n of graph.nodes) {
    for (const key of ["inputPorts", "outputPorts"]) {
      const ports = n[key] || [];
      if (!Array.isArray(ports) || ports.length > 50) {
        errors.push(`${n.name}: invalid ports.`);
        continue;
      }
      if (new Set(ports.map((p) => p.name)).size !== ports.length)
        errors.push(`${n.name}: port names must be unique per direction.`);
      for (const p of ports)
        if (
          !/^[a-zA-Z][a-zA-Z0-9_]{0,49}$/.test(p.name) ||
          !["Any", "Text", "Object", "Array", "Number", "Boolean"].includes(
            p.type,
          )
        )
          errors.push(`${n.name}: use a valid port name and type.`);
    }
    if (n.type === "Subflow") {
      for (const error of validateGraph(n.subflow, depth + 1))
        errors.push(`${n.name} / ${error}`);
    }
    for (const key of ["inputSchema", "outputSchema"]) {
      if (n[key]) {
        try {
          const schema = JSON.parse(n[key]);
          if (!schema || typeof schema !== "object" || Array.isArray(schema))
            errors.push(`${n.name}: ${key} must be a JSON object.`);
        } catch {
          errors.push(`${n.name}: ${key} is not valid JSON.`);
        }
      }
    }
    if (
      n.type === "Parallel" &&
      n.concurrency !== undefined &&
      (!Number.isInteger(n.concurrency) ||
        n.concurrency < 1 ||
        n.concurrency > 100)
    )
      errors.push(`${n.name}: concurrency must be between 1 and 100.`);
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
    const source = graph.nodes.find((n) => n.id === e.from),
      target = graph.nodes.find((n) => n.id === e.to);
    if (
      source?.outputType &&
      target?.inputType &&
      source.outputType !== "Any" &&
      target.inputType !== "Any" &&
      source.outputType !== target.inputType
    )
      errors.push(
        `Type mismatch: ${source.name} produces ${source.outputType}, but ${target.name} expects ${target.inputType}.`,
      );
    const output = source?.outputPorts?.find((p) => p.name === e.fromPort),
      input = target?.inputPorts?.find((p) => p.name === e.toPort);
    if (e.fromPort && !output)
      errors.push("Connection references a missing output port.");
    if (e.toPort && !input)
      errors.push("Connection references a missing input port.");
    if (Boolean(e.fromPort) !== Boolean(e.toPort))
      errors.push(
        "Map both source and destination ports, or leave both empty for a control dependency.",
      );
    if (
      output &&
      input &&
      output.type !== "Any" &&
      input.type !== "Any" &&
      output.type !== input.type
    )
      errors.push(`Port type mismatch: ${e.fromPort} → ${e.toPort}.`);
    const key =
      e.from + ">" + e.to + ":" + (e.fromPort || "") + ":" + (e.toPort || "");
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
