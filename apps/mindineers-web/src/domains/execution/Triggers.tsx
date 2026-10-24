import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import { triggerErrors } from "./model";
import type { TriggerRecord } from "./model";
export default function Triggers({
  data,
  update,
  workflowId,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
  workflowId: string;
}) {
  const [rows, setRows] = useCollection(data, update, "workflowTriggers"),
    [id, setId] = useState(""),
    [message, setMessage] = useState(""),
    [evidence, setEvidence] = useState(""),
    [outcome, setOutcome] = useState("Observed externally");
  const items = rows.filter((r) => r.workflowId === workflowId),
    record = items.find((r) => r.id === id) ?? items[0];
  const patch = (fields: Partial<TriggerRecord>) =>
    setRows((all) =>
      all.map((r) =>
        r.id === record?.id ? { ...r, ...fields, state: "Draft" } : r,
      ),
    );
  return (
    <section>
      <div className="toolbar">
        <h3>Triggers and observed history</h3>
        <Button
          onClick={() => {
            const r: TriggerRecord = {
              id: crypto.randomUUID(),
              workflowId,
              name: "New trigger",
              kind: "Manual",
              schedule: "",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              eventType: "",
              payload: "{}",
              state: "Draft",
              history: [],
            };
            setRows((all) => [...all, r]);
            setId(r.id);
          }}
        >
          + Trigger draft
        </Button>
      </div>
      <p>
        These are local trigger definitions, not active schedules or event
        listeners. Activation and deduplication require the runtime.
      </p>
      {record && (
        <>
          <label className="product-field">
            Trigger
            <select value={record.id} onChange={(e) => setId(e.target.value)}>
              {items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Trigger name"
            value={record.name}
            onChange={(name) => patch({ name })}
          />
          <Field
            label="Trigger type"
            value={record.kind}
            options={["Manual", "Schedule", "Event"]}
            onChange={(kind) => patch({ kind: kind as TriggerRecord["kind"] })}
          />
          {record.kind === "Schedule" && (
            <>
              <Field
                label="Schedule description / expression"
                value={record.schedule}
                onChange={(schedule) => patch({ schedule })}
              />
              <Field
                label="IANA timezone"
                value={record.timezone}
                onChange={(timezone) => patch({ timezone })}
              />
              <p className="muted">
                The runtime must validate scheduling syntax and daylight-saving
                behavior before activation.
              </p>
            </>
          )}
          {record.kind === "Event" && (
            <Field
              label="Event type"
              value={record.eventType}
              onChange={(eventType) => patch({ eventType })}
            />
          )}
          <Field
            label="Input payload (JSON)"
            type="textarea"
            value={record.payload}
            onChange={(payload) => patch({ payload })}
          />
          <Button
            onClick={() => {
              const errors = triggerErrors(record);
              if (errors.length) {
                setMessage(errors.join(" "));
                return;
              }
              setRows((all) =>
                all.map((r) =>
                  r.id === record.id ? { ...r, state: "Ready for review" } : r,
                ),
              );
              setMessage("Trigger draft prepared. No trigger was activated.");
            }}
          >
            Validate trigger draft
          </Button>
          <Button disabled>Activate · runtime required</Button>
          <p>{record.state}</p>
          <h4>Manually supplied trigger evidence</h4>
          <Field
            label="Observed outcome"
            options={[
              "Observed externally",
              "Rejected externally",
              "Duplicate reported",
              "Failed externally",
            ]}
            value={outcome}
            onChange={setOutcome}
          />
          <Field
            label="External event / run reference"
            value={evidence}
            onChange={setEvidence}
          />
          <Button
            disabled={!evidence.trim()}
            onClick={() => {
              setRows((all) =>
                all.map((r) =>
                  r.id === record.id
                    ? {
                        ...r,
                        history: [
                          ...r.history,
                          {
                            id: crypto.randomUUID(),
                            at: new Date().toISOString(),
                            outcome,
                            evidence,
                          },
                        ],
                      }
                    : r,
                ),
              );
              setEvidence("");
            }}
          >
            Record supplied evidence
          </Button>
          {record.history.map((e) => (
            <article className="panel" key={e.id}>
              <strong>{e.outcome}</strong>
              <p>{e.evidence}</p>
              <small>{e.at} · entered locally, unverified</small>
            </article>
          ))}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
