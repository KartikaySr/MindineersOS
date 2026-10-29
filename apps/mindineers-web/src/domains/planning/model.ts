import type { LegacyRecord, Workspace } from "../../shared/contracts/workspace";
import { dependencyErrors } from "../../workbench-model";
export interface PlanSnapshot {
  id: string;
  name: string;
  at: string;
  actor: string;
  missions: LegacyRecord[];
}
export interface PlanChange {
  id: string;
  kind: "Split" | "Merge";
  at: string;
  actor: string;
  reason: string;
  before: LegacyRecord[];
  after: LegacyRecord[];
  affectedIds: string[];
}
export interface PlanningState {
  baselines: PlanSnapshot[];
  changes: PlanChange[];
}
export const planning = (data: Workspace): PlanningState =>
  data.planning || { baselines: [], changes: [] };
export function snapshotMissions(tasks: LegacyRecord[]): LegacyRecord[] {
  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status,
    owner: task.owner || "",
    priority: task.priority || "Normal",
    due: task.due || "",
    dependsOn: [...(task.dependsOn || [])],
    criteria: structuredClone(task.criteria || []),
  }));
}
export function freezePlan(data: Workspace, name: string): Workspace {
  if (!name.trim() || name.trim().length > 120)
    throw Error("Name the baseline using 1–120 characters.");
  const state = planning(data);
  if (state.baselines.length >= 30)
    throw Error(
      "The workspace already has 30 baselines. Export a backup before starting a new workspace.",
    );
  return {
    ...data,
    planning: {
      ...state,
      baselines: [
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          at: new Date().toISOString(),
          actor: data.settings.name || "Owner",
          missions: snapshotMissions(data.records.missions || []),
        },
        ...state.baselines,
      ],
    },
  };
}
export function revisePlan(
  data: Workspace,
  input: {
    kind: "Split" | "Merge";
    ids: string[];
    names: string[];
    reason: string;
    expected: string;
  },
): Workspace {
  const tasks = data.records.missions || [];
  if (JSON.stringify(tasks) !== input.expected)
    throw Error(
      "The plan changed while you reviewed it. Reopen the change and review again.",
    );
  if (!input.reason.trim() || input.reason.length > 2000)
    throw Error("Record a change reason (up to 2,000 characters).");
  const ids = new Set(input.ids),
    selected = tasks.filter((task) => ids.has(task.id));
  if (selected.length !== ids.size || ids.size !== input.ids.length)
    throw Error("Select existing, distinct missions.");
  if (selected.some((task) => task.status === "Done"))
    throw Error(
      "Completed missions are preserved. Revise unfinished work only.",
    );
  const state = planning(data);
  if (state.changes.length >= 100)
    throw Error(
      "This workspace has reached its 100 recorded plan changes limit.",
    );
  let after: LegacyRecord[], revised: LegacyRecord[];
  if (input.kind === "Split") {
    if (
      selected.length !== 1 ||
      input.names.length < 2 ||
      input.names.length > 10
    )
      throw Error("Split one mission into 2–10 named parts.");
    const parent = selected[0]!;
    after = input.names.map((name) => ({
      id: crypto.randomUUID(),
      name: name.trim(),
      description: parent.description,
      status: "Draft",
      owner: parent.owner || "You",
      priority: parent.priority || "Normal",
      due: parent.due || "",
      dependsOn: [...(parent.dependsOn || [])],
      criteria: [],
    }));
    // Keep the original acceptance criteria on the parent; completing it requires all parts.
    revised = tasks
      .map((task) =>
        task.id === parent.id
          ? {
              ...task,
              status: "Draft",
              dependsOn: after.map((part) => part.id),
            }
          : task,
      )
      .concat(after);
  } else {
    if (selected.length < 2 || selected.length > 10 || input.names.length !== 1)
      throw Error("Merge 2–10 missions into one named mission.");
    const merged: LegacyRecord = {
      id: crypto.randomUUID(),
      name: input.names[0]!.trim(),
      description: selected
        .map((task) => `${task.name}\n${task.description}`)
        .join("\n\n"),
      status: "Draft",
      owner: selected.every((task) => task.owner === selected[0]!.owner)
        ? selected[0]!.owner || "You"
        : "You",
      priority: "Normal",
      due: "",
      dependsOn: [
        ...new Set(
          selected
            .flatMap((task) => task.dependsOn || [])
            .filter((id) => !ids.has(id)),
        ),
      ],
      criteria: selected.flatMap((task) =>
        (task.criteria || []).map((criterion) => ({
          ...criterion,
          id: crypto.randomUUID(),
          text: `${task.name}: ${criterion.text}`,
          done: false,
        })),
      ),
    };
    after = [merged];
    revised = tasks
      .filter((task) => !ids.has(task.id))
      .map<LegacyRecord>((task) => ({
        ...task,
        dependsOn: [
          ...new Set(
            (task.dependsOn || []).map((id) => (ids.has(id) ? merged.id : id)),
          ),
        ],
      }))
      .concat(merged);
  }
  if (
    after.some(
      (task) =>
        !task.name ||
        task.name.length > 120 ||
        task.description.length > 200000,
    )
  )
    throw Error(
      "Use names up to 120 characters and keep merged descriptions under 200,000 characters.",
    );
  if (revised.length > 10000 || dependencyErrors(revised))
    throw Error(
      "This change would exceed limits or create a dependency cycle.",
    );
  const invalidated = new Set([...input.ids, ...after.map((task) => task.id)]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const task of revised)
      if (
        !invalidated.has(task.id) &&
        (task.dependsOn || []).some((id) => invalidated.has(id))
      ) {
        invalidated.add(task.id);
        expanded = true;
      }
  }
  revised = revised.map((task) =>
    invalidated.has(task.id)
      ? {
          ...task,
          status: "Draft",
          criteria: (task.criteria || []).map((criterion) => ({
            ...criterion,
            done: false,
          })),
        }
      : task,
  );
  const affectedIds = revised
    .filter(
      (task) =>
        !tasks.some(
          (old) =>
            old.id === task.id && JSON.stringify(old) === JSON.stringify(task),
        ),
    )
    .map((task) => task.id);
  return {
    ...data,
    records: { ...data.records, missions: revised },
    planning: {
      ...state,
      changes: [
        {
          id: crypto.randomUUID(),
          kind: input.kind,
          at: new Date().toISOString(),
          actor: data.settings.name || "Owner",
          reason: input.reason.trim(),
          before: snapshotMissions(
            tasks.filter(
              (task) => ids.has(task.id) || affectedIds.includes(task.id),
            ),
          ),
          after: snapshotMissions(
            revised.filter((task) => affectedIds.includes(task.id)),
          ),
          affectedIds,
        },
        ...state.changes,
      ],
    },
  };
}
export function validatePlanning(value: unknown): void {
  if (value === undefined) return;
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const text = (v: unknown, max = 200000) =>
    typeof v === "string" && v.length <= max;
  const records = (v: unknown) =>
    Array.isArray(v) &&
    v.length <= 10000 &&
    new Set(v.map((x) => x?.id)).size === v.length &&
    v.every(
      (t) =>
        object(t) &&
        text(t.id, 120) &&
        text(t.name, 120) &&
        text(t.description) &&
        text(t.status, 100) &&
        ["owner", "priority", "due"].every((k) => text(t[k], 120)) &&
        Array.isArray(t.dependsOn) &&
        t.dependsOn.length <= 10000 &&
        t.dependsOn.every((id) => text(id, 120)) &&
        Array.isArray(t.criteria) &&
        t.criteria.length <= 10000 &&
        t.criteria.every(
          (c) =>
            object(c) &&
            text(c.id, 120) &&
            text(c.text) &&
            typeof c.done === "boolean",
        ),
    );
  if (
    !object(value) ||
    !Array.isArray(value.baselines) ||
    value.baselines.length > 30 ||
    !Array.isArray(value.changes) ||
    value.changes.length > 100
  )
    throw Error("Invalid plan history");
  for (const list of [value.baselines, value.changes])
    if (new Set(list.map((x) => x?.id)).size !== list.length)
      throw Error("Duplicate plan history IDs");
  for (const b of value.baselines)
    if (
      !object(b) ||
      !text(b.id, 120) ||
      !text(b.name, 120) ||
      !text(b.actor, 120) ||
      !text(b.at, 100) ||
      !Number.isFinite(Date.parse(String(b.at))) ||
      !records(b.missions)
    )
      throw Error("Invalid plan baseline");
  for (const c of value.changes)
    if (
      !object(c) ||
      !text(c.id, 120) ||
      !["Split", "Merge"].includes(String(c.kind)) ||
      !text(c.actor, 120) ||
      !text(c.at, 100) ||
      !Number.isFinite(Date.parse(String(c.at))) ||
      !text(c.reason, 2000) ||
      !records(c.before) ||
      !records(c.after) ||
      !Array.isArray(c.affectedIds) ||
      !c.affectedIds.every((id) => text(id, 120))
    )
      throw Error("Invalid plan change");
}
