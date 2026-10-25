import type {
  Workspace,
  WorkspaceUpdate,
  ProcedureRecord,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Field, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export function newProcedure(): ProcedureRecord {
  return {
    id: uid(),
    name: "Untitled procedure",
    kind: "Procedure",
    owner: "",
    due: "",
    cadence: "Once",
    supplier: "",
    source: "",
    notes: "",
    state: "Open",
    checklist: [],
    completions: [],
  };
}
export default function OperationsWorkspace({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [items, setItems] = useCollection(data, update, "procedures"),
    [selected, select] = useState(""),
    [task, setTask] = useState(""),
    [evidence, setEvidence] = useState(""),
    [filter, setFilter] = useState("All");
  const record = items.find((i) => i.id === selected) || items[0],
    patch = (fields: Partial<ProcedureRecord>) =>
      setItems((rows) =>
        rows.map((r) => (r.id === record?.id ? { ...r, ...fields } : r)),
      );
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h2>Make good work repeatable.</h2>
          <p>
            Procedures, onboarding, supplier follow-ups, and obligations with
            clear ownership.
          </p>
        </div>
        <Button
          onClick={() => {
            const r = newProcedure();
            setItems((rows) => [r, ...rows]);
            select(r.id);
          }}
        >
          + Procedure or request
        </Button>
      </div>
      <div className="notice">
        Cadence is a planning preference; reminders and recurring tasks are not
        sent automatically. Keep sensitive personnel information out of this
        local workspace until access controls are connected.
      </div>
      <Field
        label="Show"
        value={filter}
        options={["All", "Open", "Completed"]}
        onChange={setFilter}
      />
      <div className="product-split">
        <aside className="product-list">
          {items
            .filter((r) => filter === "All" || r.state === filter)
            .map((r) => (
              <button
                key={r.id}
                className={r.id === record?.id ? "active" : ""}
                onClick={() => select(r.id)}
              >
                <strong>{r.name}</strong>
                <small>
                  {r.kind} · {r.state} · {r.owner || "Unassigned"}
                </small>
              </button>
            ))}
        </aside>
        {record ? (
          <article className="product-detail">
            <div className="product-editor-title">
              <h2>{record.name}</h2>
              <Button onClick={() => download("procedure.json", record)}>
                Export
              </Button>
            </div>
            <Field
              label="Name"
              value={record.name}
              onChange={(name) => patch({ name })}
            />
            <div className="business-grid">
              <Field
                label="Category"
                value={record.kind}
                options={[
                  "Procedure",
                  "Onboarding",
                  "Obligation",
                  "Supplier review",
                  "Internal request",
                  "Policy acknowledgement",
                ]}
                onChange={(kind) => patch({ kind })}
              />
              <Field
                label="Owner"
                value={record.owner}
                onChange={(owner) => patch({ owner })}
              />
              <Field
                label="Next due date"
                type="date"
                value={record.due}
                onChange={(due) => patch({ due })}
              />
              <Field
                label="Cadence"
                value={record.cadence}
                options={[
                  "Once",
                  "Daily",
                  "Weekly",
                  "Monthly",
                  "Quarterly",
                  "Yearly",
                ]}
                onChange={(cadence) => patch({ cadence })}
              />
              <Field
                label="Supplier / team"
                value={record.supplier}
                onChange={(supplier) => patch({ supplier })}
              />
              <Field
                label="Source procedure / policy version"
                value={record.source}
                onChange={(source) => patch({ source })}
              />
            </div>
            <Field
              label="Instructions"
              type="textarea"
              value={record.notes}
              onChange={(notes) => patch({ notes })}
            />
            <h3>Execution checklist</h3>
            {record.checklist.map((c) => (
              <label className="business-check" key={c.id}>
                <input
                  type="checkbox"
                  checked={c.done}
                  disabled={record.state === "Completed"}
                  onChange={(e) =>
                    patch({
                      checklist: record.checklist.map((x) =>
                        x.id === c.id ? { ...x, done: e.target.checked } : x,
                      ),
                    })
                  }
                />
                {c.text}
              </label>
            ))}
            <Field label="Add checklist step" value={task} onChange={setTask} />
            <Button
              disabled={!task.trim() || record.state === "Completed"}
              onClick={() => {
                patch({
                  checklist: [
                    ...record.checklist,
                    { id: uid(), text: task.trim(), done: false },
                  ],
                });
                setTask("");
              }}
            >
              Add step
            </Button>
            <Field
              label="Completion / acknowledgement evidence"
              value={evidence}
              type="textarea"
              onChange={setEvidence}
            />
            <Button
              disabled={
                record.state === "Completed" ||
                !record.name.trim() ||
                !record.owner.trim() ||
                !evidence.trim() ||
                !record.checklist.length ||
                record.checklist.some((c) => !c.done)
              }
              onClick={() => {
                patch({
                  state: "Completed",
                  completions: [
                    ...record.completions,
                    {
                      id: uid(),
                      at: new Date().toISOString(),
                      actor: record.owner,
                      evidence: evidence.trim(),
                    },
                  ],
                });
                setEvidence("");
              }}
            >
              Record completion
            </Button>
            <Button
              disabled={record.state !== "Completed"}
              onClick={() =>
                patch({
                  state: "Open",
                  checklist: record.checklist.map((c) => ({
                    ...c,
                    done: false,
                  })),
                })
              }
            >
              Start next cycle
            </Button>
            <p className="muted">
              Completion requires an owner, finished checklist, and evidence.
              Starting a new cycle preserves previous evidence; set the next due
              date explicitly.
            </p>
            <h3>Completion history</h3>
            {record.completions.map((c) => (
              <article className="panel" key={c.id}>
                <strong>
                  {c.actor} · {c.at}
                </strong>
                <p>{c.evidence}</p>
              </article>
            ))}
          </article>
        ) : (
          <Empty title="Build your operating playbook.">
            Turn repeated work into a checklist with an owner, a target date,
            and completion evidence.
          </Empty>
        )}
      </div>
    </section>
  );
}
