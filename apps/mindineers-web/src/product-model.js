import { experimentValidators } from "./experiment-model.js";
import { businessValidators } from "./business-model.js";
export const uid = () => crypto.randomUUID();
export function validateApproval(request) {
  if (!request.destination?.trim()) return "A destination is required.";
  if (!request.payload?.trim()) return "An exact payload is required.";
  if (!request.expiresAt || !Number.isFinite(Date.parse(request.expiresAt)))
    return "A valid expiry is required.";
  if (Date.parse(request.expiresAt) <= Date.now())
    return "This request has expired.";
  return null;
}
export function decideApproval(
  request,
  decision,
  reviewer,
  now = new Date().toISOString(),
) {
  if (!["Approved", "Declined"].includes(decision))
    throw new Error("Invalid review decision");
  const error = validateApproval(request);
  if (error) throw new Error(error);
  if (request.state !== "Pending")
    throw new Error("This version has already been reviewed.");
  return {
    ...request,
    state: decision,
    decision: {
      decision,
      reviewer,
      at: now,
      version: request.version,
      payload: request.payload,
      destination: request.destination,
      scopes: [...request.scopes],
    },
  };
}
export function reviseApproval(request, changes) {
  return {
    ...request,
    ...changes,
    id: request.id,
    version: request.version + 1,
    state: "Pending",
    snoozedUntil: "",
    decision: null,
    previous: [
      ...(request.previous || []),
      {
        version: request.version,
        payload: request.payload,
        destination: request.destination,
        scopes: [...request.scopes],
        effects: request.effects || "",
        rollback: request.rollback || "",
        expiresAt: request.expiresAt,
        state: request.state,
        decision: request.decision,
      },
    ],
  };
}
export function parseTable(text) {
  const rows = text
    .trim()
    .split("\n")
    .map((line) => line.split("\t"));
  if (rows.length > 500 || rows.some((r) => r.length > 26))
    throw new Error("Use at most 500 rows and 26 columns.");
  return rows;
}
export function cellValue(rows, reference, visited = new Set()) {
  if (visited.has(reference)) throw new Error("Circular cell reference");
  const match = /^([A-Z])([1-9]\d*)$/.exec(reference);
  if (!match) throw new Error("Invalid cell reference");
  const r = Number(match[2]) - 1,
    c = match[1].charCodeAt(0) - 65,
    raw = rows[r]?.[c] || "";
  if (!raw.startsWith("=")) return raw;
  const next = new Set(visited).add(reference);
  const numeric = (ref) => {
    const value = Number(cellValue(rows, ref, next));
    if (!Number.isFinite(value))
      throw new Error("Formula references a non-number");
    return value;
  };
  const sum = /^=SUM\(([A-Z][1-9]\d*):([A-Z][1-9]\d*)\)$/.exec(
    raw.toUpperCase(),
  );
  if (sum) {
    const a = /([A-Z])(\d+)/.exec(sum[1]),
      b = /([A-Z])(\d+)/.exec(sum[2]);
    if (Number(a[2]) > Number(b[2]) || a[1] > b[1])
      throw new Error("Range must run from top-left to bottom-right");
    let total = 0;
    if (Number(b[2]) - Number(a[2]) > 500) throw new Error("Range too large");
    for (let row = Number(a[2]); row <= Number(b[2]); row++)
      for (let col = a[1].charCodeAt(0); col <= b[1].charCodeAt(0); col++)
        total += numeric(String.fromCharCode(col) + row);
    if (!Number.isFinite(total)) throw new Error("Numeric overflow");
    return String(total);
  }
  const expression =
    /^=([A-Z][1-9]\d*|\d+(?:\.\d+)?)([+*/-])([A-Z][1-9]\d*|\d+(?:\.\d+)?)$/.exec(
      raw.toUpperCase(),
    );
  if (!expression)
    throw new Error(
      "Supported: =A1+B1, subtraction, multiplication, division, or =SUM(A1:B3)",
    );
  const val = (x) => (/^[A-Z]/.test(x) ? numeric(x) : Number(x));
  const a = val(expression[1]),
    b = val(expression[3]);
  if (expression[2] === "/" && b === 0) throw new Error("Division by zero");
  const result = {
    "+": () => a + b,
    "-": () => a - b,
    "*": () => a * b,
    "/": () => a / b,
  }[expression[2]]();
  if (!Number.isFinite(result)) throw new Error("Numeric overflow");
  return String(result);
}
export function validateProduct(value) {
  const object = (x) =>
      x !== null && typeof x === "object" && !Array.isArray(x),
    text = (x) => typeof x === "string" && x.length <= 200000;
  const fields = (x, keys) => object(x) && keys.every((k) => text(x[k]));
  const rows = (x, check, max = 10000) =>
    Array.isArray(x) && x.length <= max && x.every(check);
  const slide = (s) => fields(s, ["id", "title", "body", "notes"]);
  const grid = (x) => rows(x, (r) => rows(r, text, 26), 500);
  const comment = (c) =>
    fields(c, ["id", "quote", "text", "at"]) && typeof c.resolved === "boolean";
  const validators = {
    ...businessValidators,
    ...experimentValidators,
    accessReviews: (r) =>
      fields(r, [
        "id",
        "memberId",
        "memberName",
        "roleName",
        "decision",
        "reason",
        "due",
        "actor",
        "at",
      ]) &&
      rows(r.permissions, text) &&
      ["Retain", "Change requested", "Revoke requested"].includes(r.decision),
    evidenceLinks: (l) =>
      fields(l, [
        "id",
        "from",
        "to",
        "relation",
        "reason",
        "at",
        "resolution",
      ]) &&
      ["Supports", "Contradicts", "Related"].includes(l.relation) &&
      typeof l.resolved === "boolean",
    incidents: (i) =>
      fields(i, [
        "id",
        "name",
        "severity",
        "state",
        "owner",
        "detectedAt",
        "scope",
        "evidence",
        "containment",
        "recovery",
        "rootCause",
      ]) &&
      ["Open", "Investigating", "Contained", "Resolved"].includes(i.state) &&
      rows(i.timeline, (t) =>
        fields(t, ["id", "at", "actor", "state", "note"]),
      ),
    traces: (t) =>
      fields(t, ["id", "name", "mode", "status", "startedAt"]) &&
      rows(
        t.nodes,
        (n) =>
          fields(n, ["id", "name", "agent", "state"]) &&
          rows(n.dependencies, text),
        500,
      ) &&
      rows(t.events, (e) =>
        fields(e, ["id", "at", "level", "node", "message"]),
      ) &&
      rows(t.artifacts, (a) => fields(a, ["id", "name", "type", "content"])) &&
      rows(t.checkpoints, (c) => fields(c, ["id", "name", "at", "node"])),
    campaigns: (c) =>
      fields(c, [
        "id",
        "name",
        "audience",
        "message",
        "brand",
        "channel",
        "rights",
        "origin",
        "schedule",
        "account",
        "status",
      ]) &&
      rows(c.variants, (v) =>
        fields(v, [
          "id",
          "name",
          "headline",
          "body",
          "alt",
          "locale",
          "status",
        ]),
      ),
    modelProfiles: (p) =>
      fields(p, [
        "id",
        "name",
        "provider",
        "model",
        "endpoint",
        "region",
        "context",
        "fallback",
        "transfer",
      ]) && typeof p.enabled === "boolean",
    devices: (p) =>
      fields(p, [
        "id",
        "name",
        "endpoint",
        "directories",
        "memory",
        "concurrency",
        "permissions",
      ]) && typeof p.enabled === "boolean",

    documents: (d) =>
      fields(d, ["id", "name", "kind", "body", "updatedAt"]) &&
      ["Document", "Sheet", "Presentation"].includes(d.kind) &&
      grid(d.rows) &&
      rows(d.slides, slide) &&
      rows(d.comments, comment) &&
      rows(
        d.versions,
        (v) =>
          fields(v, ["id", "at", "body"]) &&
          grid(v.rows) &&
          rows(v.slides, slide),
      ) &&
      (d.kind !== "Presentation" || d.slides.length > 0) &&
      (d.proposals === undefined ||
        rows(
          d.proposals,
          (p) =>
            fields(p, [
              "id",
              "baseBody",
              "replacement",
              "reason",
              "state",
              "at",
            ]) &&
            ["Pending", "Applied", "Declined"].includes(p.state) &&
            Number.isInteger(p.start) &&
            Number.isInteger(p.end) &&
            p.start >= 0 &&
            p.end > p.start &&
            p.end <= p.baseBody.length,
        )),
    decisions: (d) =>
      fields(d, [
        "id",
        "name",
        "destination",
        "payload",
        "effects",
        "rollback",
        "expiresAt",
        "state",
        "mode",
      ]) &&
      Number.isSafeInteger(d.version) &&
      d.version > 0 &&
      rows(d.scopes, text) &&
      (d.assignedReviewer === undefined || text(d.assignedReviewer)) &&
      (d.snoozedUntil === undefined || text(d.snoozedUntil)) &&
      (d.escalated === undefined || typeof d.escalated === "boolean") &&
      (d.routing === undefined ||
        rows(d.routing, (e) =>
          fields(e, [
            "id",
            "action",
            "actor",
            "at",
            "reviewer",
            "reason",
            "until",
          ]),
        )) &&
      rows(
        d.previous,
        (v) =>
          fields(v, ["payload", "destination", "state"]) &&
          Number.isSafeInteger(v.version),
      ) &&
      (!d.decision ||
        (fields(d.decision, [
          "decision",
          "reviewer",
          "at",
          "payload",
          "destination",
        ]) &&
          rows(d.decision.scopes, text))),
    members: (m) => fields(m, ["id", "name", "email", "role", "state"]),
    roles: (r) => fields(r, ["id", "name"]) && rows(r.permissions, text),
    policies: (p) =>
      fields(p, [
        "id",
        "retention",
        "sso",
        "domain",
        "approval",
        "accessReview",
        "breakGlass",
        "exportPolicy",
      ]),
    subscription: (p) =>
      fields(p, [
        "id",
        "plan",
        "cycle",
        "currency",
        "budget",
        "alert",
        "contact",
      ]),
    sources: (s) =>
      fields(s, [
        "id",
        "kind",
        "name",
        "url",
        "excerpt",
        "collection",
        "scope",
        "state",
        "retrievedAt",
        "notes",
      ]),
    memories: (m) =>
      fields(m, [
        "id",
        "kind",
        "name",
        "statement",
        "type",
        "scope",
        "evidence",
        "state",
        "expires",
      ]),
    changes: (c) =>
      fields(c, [
        "id",
        "name",
        "repository",
        "branch",
        "release",
        "rollback",
        "status",
      ]) &&
      rows(c.files, (f) => fields(f, ["id", "path", "before", "after"])) &&
      c.files.length > 0 &&
      rows(c.checks, (k) => fields(k, ["id", "name", "status", "evidence"])) &&
      rows(c.comments, object),
  };
  if (!object(value)) throw new Error("Invalid product workspace");
  for (const [key, items] of Object.entries(value)) {
    if (
      !Object.hasOwn(validators, key) ||
      !rows(items, validators[key]) ||
      items.some((i) => !i.id || i.id.length > 120) ||
      new Set(items.map((i) => i.id)).size !== items.length
    )
      throw new Error("Invalid " + key + " collection");
  }
  return value;
}
export function download(name, data, type = "application/json") {
  const url = URL.createObjectURL(
    new Blob(
      [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
      { type },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
