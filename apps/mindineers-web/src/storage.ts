import {validatePlanning} from "./domains/planning/model";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const oneOf = (value: unknown, choices: string[]): boolean => typeof value === "string" && choices.includes(value);
import { validHttpUrl } from "./workbench-model.js";
import { validateDataTree } from "./input-safety.js";
import { validateExperience } from "./experience-model.js";
import { validateProduct } from "./product-model.js";
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 200000): v is string => typeof v === "string" && v.length <= max;
function rows(value: unknown, check: (value: unknown) => boolean): value is unknown[] {
  return Array.isArray(value) && value.length <= 10000 && value.every(check);
}
export function validateWorkspace(v: unknown) {
  validateDataTree(v);
  if (!object(v) || !object(v.settings) || !object(v.records))
    throw new Error("Invalid workspace structure");
  if (
    !text(v.settings.name, 120) ||
    !text(v.settings.workspace, 120) ||
    !oneOf(v.settings.theme, ["Light", "Dark"]) ||
    typeof v.settings.motion !== "boolean" ||
    typeof v.settings.notifications !== "boolean" ||
    !finite(v.settings.budget) ||
    v.settings.budget < 0
  )
    throw new Error("Invalid workspace preferences");
  validateExperience(v.settings);
  validatePlanning(v.planning);
  if (v.onboardingDraft != null) {
    if (!object(v.onboardingDraft)) throw new Error("Invalid setup draft");
    const { step, form } = v.onboardingDraft;
    if (
      typeof step !== "number" || !Number.isInteger(step) ||
      step < 0 ||
      step > 2 ||
      !object(form) ||
      !text(form.name, 120) ||
      !text(form.workspace, 120) ||
      !oneOf(form.theme, ["Light", "Dark"]) ||
      !oneOf(form.useCase, ["Personal", "Founder", "Team"]) ||
      typeof form.motion !== "boolean" ||
      typeof form.examples !== "boolean" ||
      typeof form.tour !== "boolean" ||
      !(
        form.budget === "" ||
        (finite(form.budget) &&
          form.budget >= 0 &&
          form.budget <= 1000000)
      ) ||
      !oneOf(form.autonomy, ["Ask before acting", "Draft and review"])
    )
      throw new Error("Invalid setup draft");
  }
  const record = (r: unknown): r is Record<string, unknown> =>
    object(r) &&
    text(r.id, 120) &&
    text(r.name, 300) &&
    text(r.description) &&
    text(r.status, 100) &&
    (r.owner === undefined || text(r.owner, 120)) &&
    [
      "createdAt",
      "review",
      "tags",
      "priority",
      "due",
      "date",
      "time",
      "endTime",
      "timezone",
      "location",
      "recurrence",
      "notes",
      "decisions",
      "followUp",
      "stage",
      "company",
      "email",
      "value",
      "currency",
      "nextContact",
      "source",
    ].every((key) => r[key] === undefined || text(r[key]));
  if (
    !rows(
      v.projects,
      (r) =>
        record(r) &&
        finite(r.progress) &&
        r.progress >= 0 &&
        r.progress <= 100 &&
        text(r.color, 30),
    )
  )
    throw new Error("Invalid projects");
  if (
    !rows(
      v.agents,
      (a) =>
        object(a) &&
        [
          "id",
          "name",
          "role",
          "description",
          "symbol",
          "status",
          "color",
        ].every((k) => text(a[k])),
    )
  )
    throw new Error("Invalid agents");
  if (!Object.values(v.records).every((a) => rows(a, record)))
    throw new Error("Invalid records");
  for (const m of (Array.isArray(v.records.missions) ? v.records.missions : [])) {
    if (m.dependsOn !== undefined && !rows(m.dependsOn, (d) => text(d, 120)))
      throw new Error("Invalid mission dependencies");
    if (
      m.criteria !== undefined &&
      !rows(
        m.criteria,
        (c) =>
          object(c) &&
          text(c.id) &&
          text(c.text) &&
          typeof c.done === "boolean",
      )
    )
      throw new Error("Invalid mission criteria");
  }
  for (const c of (Array.isArray(v.records.customers) ? v.records.customers : [])) {
    if (
      c.activities !== undefined &&
      !rows(
        c.activities,
        (a) => object(a) && text(a.id) && text(a.at) && text(a.text),
      )
    )
      throw new Error("Invalid customer activities");
  }
  for (const f of (Array.isArray(v.records.files) ? v.records.files : [])) {
    if (f.bytes !== undefined && (!finite(f.bytes) || f.bytes < 0))
      throw new Error("Invalid file size");
    if (f.mime !== undefined && !text(f.mime, 300))
      throw new Error("Invalid file type");
  }

  if (
    !rows(
      v.messages,
      (m) =>
        object(m) &&
        text(m.id) &&
        text(m.text) &&
        oneOf(m.role, ["user", "system"]),
    )
  )
    throw new Error("Invalid messages");
  if (
    !rows(
      v.posts,
      (p) =>
        object(p) &&
        ["id", "agent", "title", "body"].every((k) => text(p[k])) &&
        finite(p.likes) &&
        rows(p.comments, (c) => text(c)),
    )
  )
    throw new Error("Invalid posts");
  if (
    !rows(
      v.approvals,
      (a) =>
        object(a) && ["id", "name", "detail", "state"].every((k) => text(a[k])),
    )
  )
    throw new Error("Invalid approvals");
  if (
    v.connectionProfiles !== undefined &&
    (!object(v.connectionProfiles) ||
      !Object.values(v.connectionProfiles).every(
        (c) =>
          object(c) &&
          text(c.account, 120) &&
          text(c.notes) &&
          text(c.region, 120) &&
          rows(c.scopes, (s) => text(s, 300)),
      ))
  )
    throw new Error("Invalid connection profiles");
  if (
    v.conversations !== undefined &&
    !rows(
      v.conversations,
      (t) =>
        object(t) &&
        text(t.id) &&
        text(t.title) &&
        text(t.agent) &&
        (t.draft === undefined || text(t.draft, 200000)) &&
        rows(t.context, (c) => text(c)) &&
        rows(
          t.messages,
          (m) =>
            object(m) &&
            text(m.id) &&
            text(m.text) &&
            text(m.createdAt) &&
            typeof m.pinned === "boolean",
        ),
    )
  )
    throw new Error("Invalid conversations");
  if (v.suite !== undefined) {
    const s = v.suite;
    if (
      !object(s) ||
      !object(s.details) ||
      !object(s.settings) ||
      !object(s.localRecords) ||
      (s.runs !== undefined &&
        !rows(
          s.runs,
          (r) =>
            object(r) && text(r.id) && (r.name === undefined || text(r.name)),
        ))
    )
      throw new Error("Invalid extended workspace");
    const values = (v: unknown) =>
      object(v) && Object.values(v).every((x) => text(x, 200000));
    const ports = (p: unknown) =>
      p === undefined ||
      rows(
        p,
        (x) =>
          object(x) &&
          text(x.name, 50) &&
          oneOf(
            x.type, ["Any", "Text", "Object", "Array", "Number", "Boolean"]),
      );
    const graph = (g: unknown, depth = 0): boolean =>
      depth <= 4 &&
      object(g) &&
      rows(
        g.nodes,
        (n) =>
          object(n) &&
          text(n.id, 120) &&
          text(n.name, 300) &&
          text(n.type, 50) &&
          finite(n.timeout) &&
          finite(n.retries) &&
          (n.position === undefined ||
            (object(n.position) &&
              finite(n.position.x) &&
              finite(n.position.y) &&
              n.position.x >= 0 &&
              n.position.x <= 100000 &&
              n.position.y >= 0 &&
              n.position.y <= 100000)) &&
          [
            "inputSchema",
            "outputSchema",
            "inputType",
            "outputType",
            "failureMode",
            "idempotencyKey",
            "condition",
            "mergePolicy",
          ].every((key) => n[key] === undefined || text(n[key])) &&
          (n.concurrency === undefined || finite(n.concurrency)) &&
          ports(n.inputPorts) &&
          ports(n.outputPorts) &&
          (n.subflow === undefined || graph(n.subflow, depth + 1)),
      ) &&
      rows(
        g.edges,
        (e) =>
          object(e) &&
          text(e.from, 120) &&
          text(e.to, 120) &&
          (e.fromPort === undefined || text(e.fromPort, 50)) &&
          (e.toPort === undefined || text(e.toPort, 50)),
      );
    for (const d of Object.values(s.details)) {
      if (
        !object(d) ||
        !values(d.values) ||
        !rows(
          d.history,
          (h) =>
            object(h) &&
            text(h.id) &&
            text(h.at) &&
            values(h.values) &&
            (!h.graph || graph(h.graph)),
        ) ||
        !rows(
          d.checklist,
          (c) =>
            object(c) &&
            text(c.id) &&
            text(c.text) &&
            typeof c.done === "boolean",
        ) ||
        !rows(
          d.comments,
          (c) => object(c) && text(c.id) && text(c.text) && text(c.at),
        ) ||
        !rows(d.links, (l) => text(l))
      )
        throw new Error("Invalid record details");
      if (d.graph && !graph(d.graph)) throw new Error("Invalid workflow graph");
      if (
        d.evidence &&
        !rows(
          d.evidence,
          (e) =>
            object(e) &&
            ["id", "url", "excerpt", "assessment", "at"].every((k) =>
              text(e[k]),
            ) &&
            text(e.url) && validHttpUrl(e.url),
        )
      )
        throw new Error("Invalid evidence");
      if (
        d.trials &&
        !rows(
          d.trials,
          (t) =>
            object(t) &&
            text(t.id) &&
            text(t.name) &&
            oneOf(t.result, ["Pass", "Fail", "Excluded"]),
        )
      )
        throw new Error("Invalid trials");
      if (
        d.invoice &&
        (!object(d.invoice) ||
          !rows(
            d.invoice.rows,
            (r) =>
              object(r) &&
              text(r.id) &&
              text(r.name) &&
              finite(r.quantity) &&
              finite(r.unitMinor),
          ) ||
          (d.invoice.currency &&
            !oneOf(d.invoice.currency, ["USD", "EUR", "GBP", "INR"])))
      )
        throw new Error("Invalid invoice");
    }
    if (
      !Object.values(s.settings).every(values) ||
      !Object.values(s.localRecords).every((a) => rows(a, record))
    )
      throw new Error("Invalid extended settings or records");
  }
  // Duplicate IDs make editor updates ambiguous: one action could overwrite
  // multiple records. Check every list with record identity at the boundary.
  const conversations = Array.isArray(v.conversations) ? v.conversations : [];
  const identityLists: unknown[] = [v.projects, v.agents, ...Object.values(v.records), v.messages, v.posts, v.approvals,
    ...conversations.map((t: unknown) => object(t) ? t.messages : undefined), conversations,
    ...(object(v.suite) && object(v.suite.localRecords) ? Object.values(v.suite.localRecords) : [])];
  for (const list of identityLists) {
    if (!Array.isArray(list)) throw new Error("Invalid record list");
    const ids = list.map((record: unknown) => object(record) ? record.id : undefined);
    if (new Set(ids).size !== ids.length) throw new Error("Duplicate workspace record identifiers");
  }
  if (v.product !== undefined) validateProduct(v.product);
  return v;
}
