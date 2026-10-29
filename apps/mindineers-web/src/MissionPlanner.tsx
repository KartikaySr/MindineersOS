import PlanReview from "./domains/planning/PlanReview";
import MissionViews from "./MissionViews";
import type {
  Workspace,
  WorkspaceUpdate,
  LegacyRecord,
  AgentRecord,
} from "./shared/contracts/workspace";
import { useState, useEffect, useRef } from "react";
const statuses = ["Draft", "Planned", "In progress", "In review", "Done"];
import { dependencyErrors } from "./workbench-model";
export default function MissionPlanner({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [view, setView] = useState("Board"),
    [query, setQuery] = useState(""),
    [owner, setOwner] = useState("All owners"),
    [selected, setSelected] = useState<LegacyRecord | null>(null),
    [warning, setWarning] = useState("");
  const tasks = data.records.missions || [];
  const save = (record: LegacyRecord) => {
    if (
      record.status === "Done" &&
      ((record.criteria || []).some((c) => !c.done) ||
        (record.dependsOn || []).some(
          (id) => tasks.find((t) => t.id === id)?.status !== "Done",
        ))
    ) {
      setWarning(
        "Complete acceptance criteria and dependencies before marking this mission done.",
      );
      return;
    }
    setWarning("");
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        missions: tasks.some((t) => t.id === record.id)
          ? tasks.map((t) => (t.id === record.id ? record : t))
          : [record, ...tasks],
      },
    }));
  };
  const filtered = tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) &&
      (owner === "All owners" || t.owner === owner),
  );
  const blocked = (t: LegacyRecord) =>
    (t.dependsOn || []).some(
      (id) => tasks.find((x) => x.id === id)?.status !== "Done",
    );
  const newTask = () =>
    setSelected({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      status: "Draft",
      owner: "You",
      priority: "Normal",
      due: "",
      dependsOn: [],
      criteria: [],
    });
  const card = (t: LegacyRecord) => (
    <article
      key={t.id}
      className="mission-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/mindineers-task", t.id)}
    >
      <button className="mission-card-main" onClick={() => setSelected(t)}>
        <span
          className={
            "priority priority-" + (t.priority || "Normal").toLowerCase()
          }
        >
          {t.priority || "Normal"}
        </span>
        <h3>{t.name}</h3>
        <p>{t.description}</p>
        <div className="mission-meta">
          <span>{t.owner}</span>
          {t.due && <time>{t.due}</time>}
        </div>
        {blocked(t) && <span className="badge">Waiting on dependencies</span>}
        {!!t.criteria?.length && (
          <small>
            {t.criteria.filter((c) => c.done).length}/{t.criteria.length}{" "}
            criteria complete
          </small>
        )}
      </button>
      <select
        aria-label={"Status for " + t.name}
        value={t.status}
        onChange={(e) => save({ ...t, status: e.target.value })}
      >
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </article>
  );
  return (
    <section className="mission-planner">
      {warning && (
        <p className="notice" role="alert">
          {warning}
        </p>
      )}
      <details>
        <summary>Plan baselines, split and merge</summary>
        <PlanReview data={data} update={update} />
      </details>
      <div className="mission-summary">
        <div>
          <strong>{tasks.length}</strong>
          <span>Total missions</span>
        </div>
        <div>
          <strong>
            {tasks.filter((t) => t.status === "In progress").length}
          </strong>
          <span>In progress</span>
        </div>
        <div>
          <strong>
            {tasks.filter((t) => blocked(t) && t.status !== "Done").length}
          </strong>
          <span>Dependencies pending</span>
        </div>
        <div>
          <strong>{tasks.filter((t) => t.status === "Done").length}</strong>
          <span>Completed</span>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Mission view">
          {["Board", "List", "Timeline", "Dependencies", "Workload"].map(
            (v) => (
              <button
                key={v}
                aria-pressed={view === v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ),
          )}
        </div>
        <button className="button dark" onClick={newTask}>
          + New mission
        </button>
      </div>
      <div className="mission-filters">
        <input
          aria-label="Search missions"
          placeholder="Find a mission…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter by owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          {["All owners", "You", ...data.agents.map((a) => a.name)].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span>{filtered.length} missions</span>
      </div>
      {view === "Dependencies" || view === "Workload" ? (
        <MissionViews
          view={view}
          tasks={filtered}
          allTasks={tasks}
          select={setSelected}
        />
      ) : view === "Board" ? (
        <div className="mission-board">
          {statuses.map((status) => (
            <section
              key={status}
              className="mission-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const task = tasks.find(
                  (t) =>
                    t.id === e.dataTransfer.getData("text/mindineers-task"),
                );
                if (task) save({ ...task, status });
              }}
            >
              <h2>
                <span>{status}</span>
                <small>
                  {filtered.filter((t) => t.status === status).length}
                </small>
              </h2>
              {filtered.filter((t) => t.status === status).map(card)}
              {!filtered.some((t) => t.status === status) && (
                <p className="mission-column-empty">
                  Drop a mission here
                  <br />
                  or change its status.
                </p>
              )}
            </section>
          ))}
        </div>
      ) : view === "List" ? (
        <div className="mission-list">{filtered.map(card)}</div>
      ) : (
        <div className="mission-agenda">
          {[...new Set(filtered.map((t) => t.due || "Unscheduled"))]
            .sort()
            .map((date) => (
              <section key={date}>
                <h3>{date}</h3>
                <div>
                  {filtered
                    .filter((t) => (t.due || "Unscheduled") === date)
                    .map(card)}
                </div>
              </section>
            ))}
        </div>
      )}
      {!filtered.length && view !== "Board" && (
        <div className="empty">
          <h2>Make room for the next step.</h2>
          <p>Create a mission with a clear objective and a finish line.</p>
          <button className="button" onClick={newTask}>
            Create a mission
          </button>
        </div>
      )}
      {selected && (
        <MissionEditor
          key={selected.id}
          task={selected}
          tasks={tasks}
          agents={data.agents}
          close={() => setSelected(null)}
          save={save}
        />
      )}
    </section>
  );
}
export function MissionEditor({
  task,
  tasks,
  agents,
  close,
  save,
}: {
  task: LegacyRecord;
  tasks: LegacyRecord[];
  agents: AgentRecord[];
  close: () => void;
  save: (record: LegacyRecord) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [draft, setDraft] = useState({
      ...task,
      dependsOn: task.dependsOn || [],
      criteria: task.criteria || [],
    }),
    [error, setError] = useState(""),
    [criterion, setCriterion] = useState("");
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.showModal();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);
  const set = <K extends keyof LegacyRecord>(key: K, value: LegacyRecord[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <dialog
      ref={ref}
      className="dialog mission-editor"
      aria-label="Mission details"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">MISSION CONTROL</span>
          <h2>{task.name || "A clear next step."}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close mission"
          onClick={close}
        >
          ×
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = { ...draft, name: draft.name.trim() };
          if (!next.name) {
            setError("Give this mission a name.");
            return;
          }
          const candidates = [...tasks.filter((t) => t.id !== draft.id), next];
          if (dependencyErrors(candidates)) {
            setError(
              "These dependencies form a cycle. Remove one before saving.",
            );
            return;
          }
          if (
            next.status === "Done" &&
            (next.criteria.some((c) => !c.done) ||
              next.dependsOn.some(
                (id) => candidates.find((t) => t.id === id)?.status !== "Done",
              ))
          ) {
            setError(
              "Complete acceptance criteria and dependencies before marking this mission done.",
            );
            return;
          }
          save(next);
          close();
        }}
      >
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label>
          Objective
          <textarea
            required
            rows={3}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="form-two">
          <label>
            Owner
            <select
              value={draft.owner}
              onChange={(e) => set("owner", e.target.value)}
            >
              {["You", ...agents.map((a) => a.name)].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={draft.priority || "Normal"}
              onChange={(e) => set("priority", e.target.value)}
            >
              {["Low", "Normal", "High", "Urgent"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={draft.due || ""}
              onChange={(e) => set("due", e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="mission-dependencies">
          <legend>Depends on</legend>
          {tasks
            .filter((t) => t.id !== draft.id)
            .map((t) => (
              <label key={t.id}>
                <input
                  type="checkbox"
                  checked={draft.dependsOn.includes(t.id)}
                  onChange={(e) =>
                    set(
                      "dependsOn",
                      e.target.checked
                        ? [...draft.dependsOn, t.id]
                        : draft.dependsOn.filter((id) => id !== t.id),
                    )
                  }
                />
                {t.name}
                <small>{t.status}</small>
              </label>
            ))}
          {tasks.length <= 1 && <p>No other missions yet.</p>}
        </fieldset>
        <h3>Acceptance criteria</h3>
        {draft.criteria.map((c) => (
          <div className="mission-criterion" key={c.id}>
            <label>
              <input
                type="checkbox"
                checked={c.done}
                onChange={(e) =>
                  set(
                    "criteria",
                    draft.criteria.map((x) =>
                      x.id === c.id ? { ...x, done: e.target.checked } : x,
                    ),
                  )
                }
              />
              {c.text}
            </label>
            <button
              type="button"
              aria-label={"Remove criterion " + c.text}
              onClick={() =>
                set(
                  "criteria",
                  draft.criteria.filter((x) => x.id !== c.id),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
        <div className="wb-inline">
          <input
            aria-label="New acceptance criterion"
            value={criterion}
            onChange={(e) => setCriterion(e.target.value)}
            placeholder="What does done look like?"
          />
          <button
            type="button"
            className="button"
            disabled={!criterion.trim()}
            onClick={() => {
              set("criteria", [
                ...draft.criteria,
                {
                  id: crypto.randomUUID(),
                  text: criterion.trim(),
                  done: false,
                },
              ]);
              setCriterion("");
            }}
          >
            Add
          </button>
        </div>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={close}>
            Cancel
          </button>
          <button className="button dark">Save mission</button>
        </div>
      </form>
    </dialog>
  );
}
