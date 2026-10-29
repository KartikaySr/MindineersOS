import { useState } from "react";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { Button, Field, Dialog } from "../../ProductUI";
import RevisionDiff from "../product/RevisionDiff";
import { planning, freezePlan, revisePlan, snapshotMissions } from "./model";
export default function PlanReview({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [name, setName] = useState(""),
    [baseline, setBaseline] = useState(""),
    [notice, setNotice] = useState("");
  const [change, setChange] = useState<{
    kind: "Split" | "Merge";
    ids: string[];
    names: string;
    reason: string;
    expected: string;
  } | null>(null);
  const tasks = data.records.missions || [],
    state = planning(data),
    selected =
      state.baselines.find((item) => item.id === baseline) ||
      state.baselines[0];
  const perform = (fn: (current: Workspace) => Workspace) => {
    try {
      const next = fn(data);
      update((current) => {
        if (current !== data) return current;
        return next;
      });
      setNotice(
        "Plan change submitted. Check the baseline or change history below to confirm it was saved. Review affected approvals and outputs before execution.",
      );
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to save plan.",
      );
      return false;
    }
  };
  return (
    <section className="panel" aria-label="Plan baselines and change review">
      <h2>Plan baselines and changes</h2>
      <p>
        Freeze a comparison copy or restructure unfinished missions. Local
        history is editable through workspace recovery; it is not a server audit
        log.
      </p>
      <div className="wb-actions">
        <Field
          label="Baseline name"
          value={name}
          maxLength={120}
          onChange={setName}
        />
        <Button
          disabled={!name.trim() || !tasks.length}
          onClick={() => {
            if (perform((current) => freezePlan(current, name))) setName("");
          }}
        >
          Freeze baseline
        </Button>
        {(["Split", "Merge"] as const).map((kind) => (
          <Button
            key={kind}
            disabled={
              tasks.filter((task) => task.status !== "Done").length <
              (kind === "Split" ? 1 : 2)
            }
            onClick={() =>
              setChange({
                kind,
                ids: [],
                names: "",
                reason: "",
                expected: JSON.stringify(tasks),
              })
            }
          >
            {kind} missions
          </Button>
        ))}
      </div>
      {notice && <p role="status">{notice}</p>}
      {selected && (
        <>
          <label>
            Compare baseline
            <select
              value={selected.id}
              onChange={(event) => setBaseline(event.target.value)}
            >
              {state.baselines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {new Date(item.at).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <p>
            Recorded by {selected.actor}. Comparison includes assignments,
            deadlines, dependencies and acceptance criteria.
          </p>
          <RevisionDiff
            before={Object.fromEntries(
              selected.missions.map((task) => [task.id, task]),
            )}
            after={Object.fromEntries(
              snapshotMissions(tasks).map((task) => [task.id, task]),
            )}
          />
        </>
      )}
      <details>
        <summary>Plan change history ({state.changes.length})</summary>
        {state.changes.map((item) => (
          <article key={item.id}>
            <h3>
              {item.kind} · {new Date(item.at).toLocaleString()}
            </h3>
            <p>
              {item.actor} · {item.reason}
            </p>
            <p>Affected mission IDs: {item.affectedIds.join(", ")}</p>
            <RevisionDiff before={item.before} after={item.after} />
          </article>
        ))}
      </details>
      {change && (
        <Dialog title={`${change.kind} missions`} close={() => setChange(null)}>
          {notice && <p role="alert">{notice}</p>}
          <fieldset>
            <legend>
              {change.kind === "Split"
                ? "Select one unfinished mission"
                : "Select 2–10 unfinished missions"}
            </legend>
            {tasks
              .filter((task) => task.status !== "Done")
              .map((task) => (
                <label key={task.id}>
                  <input
                    type={change.kind === "Split" ? "radio" : "checkbox"}
                    name="change-missions"
                    checked={change.ids.includes(task.id)}
                    onChange={(event) =>
                      setChange({
                        ...change,
                        ids:
                          change.kind === "Split"
                            ? [task.id]
                            : event.target.checked
                              ? [...change.ids, task.id]
                              : change.ids.filter((id) => id !== task.id),
                      })
                    }
                  />
                  {task.name}
                </label>
              ))}
          </fieldset>
          <Field
            label={
              change.kind === "Split"
                ? "New part names (one per line, 2–10)"
                : "Merged mission name"
            }
            type="textarea"
            value={change.names}
            maxLength={1210}
            onChange={(names) => setChange({ ...change, names })}
          />
          <Field
            label="Reason for scope change"
            type="textarea"
            value={change.reason}
            maxLength={2000}
            onChange={(reason) => setChange({ ...change, reason })}
          />
          <div className="notice">
            <strong>Review the impact</strong>
            <p>
              {change.kind === "Split"
                ? "The original mission retains its acceptance criteria and waits for every new part. Each part inherits the original prerequisites and begins as Draft."
                : "Selected missions are replaced by a new Draft. Their acceptance criteria are retained but reopened, and mission dependencies are redirected. The new mission uses normal priority, no deadline, and You as owner when owners differ. Original records remain in plan history."}
            </p>
            <p>
              Affected downstream missions and acceptance criteria return to
              Draft for revalidation. Review related approvals, linked records
              and existing outputs manually. This local operation cannot revoke
              remote approvals or validate generated work.
            </p>
          </div>
          <Button
            disabled={!change.reason.trim() || !change.names.trim()}
            onClick={() => {
              if (
                perform((current) =>
                  revisePlan(current, {
                    ...change,
                    names: change.names
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  }),
                )
              )
                setChange(null);
            }}
          >
            Confirm {change.kind.toLowerCase()}
          </Button>
        </Dialog>
      )}
    </section>
  );
}
