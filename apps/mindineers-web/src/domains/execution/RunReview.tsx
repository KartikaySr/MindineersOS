import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  TraceRecord,
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { replayEvents } from "./trace";
export default function RunReview({
  run,
  data,
  update,
}: {
  run: TraceRecord;
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [count, setCount] = useState(0),
    [checkpoint, setCheckpoint] = useState(""),
    [reason, setReason] = useState(""),
    [scope, setScope] = useState(""),
    [budget, setBudget] = useState(""),
    [message, setMessage] = useState("");
  const [plans, setPlans] = useCollection(data, update, "runPlans");
  const events = replayEvents(run, count),
    selected = run.checkpoints.find((c) => c.id === checkpoint);
  const incidents = (data.product?.incidents ?? []).filter((i) =>
    i.scope.split(/[\s,;]+/).includes(run.id),
  );
  return (
    <section>
      <h3>Event replay</h3>
      <p>
        Review the recorded event sequence. This does not re-execute agents or
        infer historical node state from the final trace.
      </p>
      <label className="product-field">
        Events shown: {count} / {run.events.length}
        <input
          type="range"
          min={0}
          max={run.events.length}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
      </label>
      <Button
        disabled={count === 0}
        onClick={() => setCount((n) => Math.max(0, n - 1))}
      >
        Previous event
      </Button>
      <Button
        disabled={count >= run.events.length}
        onClick={() => setCount((n) => n + 1)}
      >
        Next event
      </Button>
      {events.map((e) => (
        <article className="panel" key={e.id}>
          <small>
            {e.at} · {e.node} · {e.level}
          </small>
          <p>{e.message}</p>
        </article>
      ))}
      <h3>Checkpoint continuation plan</h3>
      <label className="product-field">
        Source checkpoint
        <select
          value={checkpoint}
          onChange={(e) => setCheckpoint(e.target.value)}
        >
          <option value="">Select checkpoint</option>
          {run.checkpoints.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.node}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Reason for continuation"
        value={reason}
        onChange={setReason}
      />
      <Field
        label="New allowed scope and approval requirements"
        type="textarea"
        value={scope}
        onChange={setScope}
      />
      <Field
        label="Budget ceiling (USD, planning only)"
        value={budget}
        onChange={setBudget}
      />
      <Button
        disabled={
          !selected ||
          !reason.trim() ||
          !scope.trim() ||
          !/^\d+(?:\.\d{1,2})?$/.test(budget) ||
          !Number.isFinite(Number(budget))
        }
        onClick={() => {
          if (!selected) return;
          setPlans((all) => [
            ...all,
            {
              id: crypto.randomUUID(),
              runId: run.id,
              checkpointId: selected.id,
              name: `Continue from ${selected.name}`,
              reason,
              scope,
              budget,
              state: "Draft",
              createdAt: new Date().toISOString(),
              sourceMode: run.mode,
            },
          ]);
          setMessage(
            "Continuation plan saved. No run was started; new authorization is required.",
          );
        }}
      >
        Save continuation plan
      </Button>
      {message && <p role="status">{message}</p>}
      {plans
        .filter((p) => p.runId === run.id)
        .map((p) => (
          <article key={p.id} className="panel">
            <strong>
              {p.name} · {p.state}
            </strong>
            <p>{p.reason}</p>
            <p>
              {p.scope} · Budget ceiling ${p.budget}
            </p>
            <small>
              Source: {p.sourceMode} · {p.createdAt}
            </small>
          </article>
        ))}
      <h3>Related incident records</h3>
      <p className="muted">
        Matches exact run identifiers entered in incident scope. These are
        local, unverified associations.
      </p>
      {incidents.length ? (
        incidents.map((i) => (
          <article className="panel" key={i.id}>
            <strong>
              {i.name} · {i.severity} · {i.state}
            </strong>
            <p>{i.evidence}</p>
            <a href="#security">Open Security to review incident records</a>
          </article>
        ))
      ) : (
        <p>No local incidents reference this run ID.</p>
      )}
      <p>
        Run identifier: <code>{run.id}</code>
      </p>
    </section>
  );
}
