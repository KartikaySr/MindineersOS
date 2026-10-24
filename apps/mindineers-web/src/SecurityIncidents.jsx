import React, { useState } from "react";
import { Button, Field, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export const newIncident = () => ({
  id: uid(),
  name: "Untitled incident",
  severity: "Medium",
  state: "Open",
  owner: "",
  detectedAt: new Date().toISOString(),
  scope: "",
  evidence: "",
  containment: "",
  recovery: "",
  rootCause: "",
  timeline: [],
});
export default function SecurityIncidents({ data, update }) {
  const [items, setItems] = useCollection(data, update, "incidents"),
    [selected, select] = useState(""),
    [state, setState] = useState("Investigating"),
    [note, setNote] = useState(""),
    [message, setMessage] = useState("");
  const r = items.find((i) => i.id === selected) || items[0],
    patch = (fields) =>
      setItems((rows) =>
        rows.map((i) => (i.id === r.id ? { ...i, ...fields } : i)),
      );
  return (
    <section>
      <div className="toolbar">
        <h2>Incident workspace</h2>
        <Button
          onClick={() => {
            const i = newIncident();
            setItems((rows) => [i, ...rows]);
            select(i.id);
          }}
        >
          + Incident record
        </Button>
      </div>
      <div className="notice">
        Manually recorded response work. No monitoring, credential revocation,
        containment, or external notifications are performed here. Do not paste
        credentials or sensitive log payloads.
      </div>
      <div className="product-split">
        <aside className="product-list">
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                select(i.id);
                setMessage("");
              }}
            >
              <strong>{i.name}</strong>
              <small>
                {i.severity} · {i.state}
              </small>
            </button>
          ))}
        </aside>
        {r ? (
          <article className="product-detail">
            <Field
              label="Incident title"
              value={r.name}
              onChange={(name) => patch({ name })}
            />
            <div className="business-grid">
              <Field
                label="Severity"
                value={r.severity}
                options={["Low", "Medium", "High", "Critical"]}
                onChange={(severity) => patch({ severity })}
              />
              <Field
                label="Response owner"
                value={r.owner}
                onChange={(owner) => patch({ owner })}
              />
            </div>
            {[
              ["scope", "Affected scope and related run IDs"],
              ["evidence", "Evidence references (redacted)"],
              ["containment", "Containment actions and confirmation evidence"],
              ["recovery", "Recovery and verification plan"],
              ["rootCause", "Root cause and prevention"],
            ].map(([k, label]) => (
              <Field
                key={k}
                label={label}
                type="textarea"
                value={r[k]}
                onChange={(value) => patch({ [k]: value })}
              />
            ))}
            <h3>Current state: {r.state}</h3>
            <Field
              label="Record response state"
              value={state}
              options={["Open", "Investigating", "Contained", "Resolved"]}
              onChange={setState}
            />
            <Field
              label="Timeline note"
              value={note}
              type="textarea"
              onChange={setNote}
            />
            <Button
              onClick={() => {
                if (!r.owner.trim() || !note.trim() || !r.evidence.trim()) {
                  setMessage(
                    "An owner, evidence reference, and timeline note are required.",
                  );
                  return;
                }
                if (
                  ["Contained", "Resolved"].includes(state) &&
                  !r.containment.trim()
                ) {
                  setMessage("Document containment evidence first.");
                  return;
                }
                if (
                  state === "Resolved" &&
                  (!r.recovery.trim() || !r.rootCause.trim())
                ) {
                  setMessage(
                    "Document recovery and root cause before resolution.",
                  );
                  return;
                }
                patch({
                  state,
                  timeline: [
                    ...r.timeline,
                    {
                      id: uid(),
                      at: new Date().toISOString(),
                      actor: data.settings.name || "Owner",
                      state,
                      note,
                    },
                  ],
                });
                setNote("");
                setMessage("Response state recorded.");
              }}
            >
              Record response update
            </Button>
            <Button onClick={() => download("incident-record.json", r)}>
              Export incident
            </Button>
            {message && <p role="status">{message}</p>}
            <h3>Response timeline</h3>
            {r.timeline.map((t) => (
              <article className="panel" key={t.id}>
                <strong>
                  {t.state} · {t.actor}
                </strong>
                <p>{t.note}</p>
                <small>{t.at}</small>
              </article>
            ))}
          </article>
        ) : (
          <Empty title="A clear record when it matters.">
            Capture the scope, evidence, response owner, and recovery actions.
          </Empty>
        )}
      </div>
    </section>
  );
}
