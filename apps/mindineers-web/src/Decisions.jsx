import ReviewRouting from "./ReviewRouting";
import React, { useState } from "react";
import { Button, Field, Dialog, Tabs, Empty, useCollection } from "./ProductUI";
import {
  uid,
  decideApproval,
  reviseApproval,
  validateApproval,
} from "./product-model";
export default function Decisions({ data, update }) {
  const [requests, setRequests] = useCollection(data, update, "decisions"),
    [filter, setFilter] = useState("Pending"),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(""),
    [message, setMessage] = useState("");
  const request = requests.find((r) => r.id === selected);
  const create = () =>
    setEditing({
      id: uid(),
      name: "",
      destination: "",
      payload: "",
      scopes: [],
      effects: "",
      rollback: "",
      expiresAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      version: 1,
      state: "Pending",
      previous: [],
      mode: "Local review",
    });
  const act = (decision) => {
    try {
      const next = decideApproval(request, decision, data.settings.name);
      setRequests((rows) => rows.map((r) => (r.id === next.id ? next : r)));
      setMessage(
        "Decision recorded for this payload version. No external action was performed.",
      );
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <section className="product-page">
      <div className="notice">
        Review the destination and exact action before deciding. Local review
        records do not authorize external execution.
      </div>
      <div className="toolbar">
        <Tabs
          values={["Pending", "Snoozed", "Approved", "Declined", "All"]}
          value={filter}
          onChange={setFilter}
        />
        <Button onClick={create}>+ Review request</Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {requests
            .filter((r) => {
              const snoozed =
                r.state === "Pending" &&
                Date.parse(r.snoozedUntil) > Date.now();
              return (
                filter === "All" ||
                (filter === "Snoozed"
                  ? snoozed
                  : r.state === filter && !snoozed)
              );
            })
            .map((r) => (
              <button
                key={r.id}
                className={selected === r.id ? "active" : ""}
                onClick={() => {
                  setSelected(r.id);
                  setMessage("");
                }}
              >
                <strong>{r.name}</strong>
                <small>
                  {r.state} · version {r.version}
                </small>
                <span>{r.destination}</span>
              </button>
            ))}
          {!requests.length && (
            <Empty title="Nothing waiting on you.">
              Create a review request to capture an exact action and decision.
            </Empty>
          )}
        </aside>
        {request ? (
          <article className="product-detail">
            <header className="wb-row">
              <div>
                <span className="eyebrow">
                  {request.mode} · V{request.version}
                </span>
                <h2>{request.name}</h2>
              </div>
              <Button onClick={() => setEditing(request)}>
                Revise request
              </Button>
            </header>
            <dl className="product-facts">
              <dt>Destination</dt>
              <dd>{request.destination}</dd>
              <dt>Access requested</dt>
              <dd>{request.scopes.join(", ") || "None specified"}</dd>
              <dt>Expires</dt>
              <dd>{new Date(request.expiresAt).toLocaleString()}</dd>
              <dt>Expected effects</dt>
              <dd>{request.effects || "Not described"}</dd>
              <dt>Rollback</dt>
              <dd>{request.rollback || "Not described"}</dd>
            </dl>
            <h3>Exact payload</h3>
            <pre className="product-code">{request.payload}</pre>
            {request.state === "Pending" ? (
              <>
                <p className="muted">
                  Revision creates a new version and invalidates any earlier
                  decision.
                </p>
                <div className="wb-actions">
                  <Button
                    disabled={!!validateApproval(request)}
                    onClick={() => act("Approved")}
                  >
                    Approve this version
                  </Button>
                  <Button
                    disabled={!!validateApproval(request)}
                    onClick={() => act("Declined")}
                  >
                    Decline
                  </Button>
                </div>
                {validateApproval(request) && (
                  <p role="alert">{validateApproval(request)}</p>
                )}
              </>
            ) : (
              <div className="notice">
                {request.state} by {request.decision?.reviewer} ·{" "}
                {new Date(request.decision?.at).toLocaleString()}
              </div>
            )}
            <ReviewRouting
              key={request.id}
              request={request}
              actor={data.settings.name}
              reviewers={[
                data.settings.name,
                ...(data.product?.members || []).map((m) => m.name),
              ]}
              save={(next) =>
                setRequests((rows) =>
                  rows.map((r) => (r.id === next.id ? next : r)),
                )
              }
            />
            {request.previous?.length > 0 && (
              <details>
                <summary>Compare latest revision</summary>
                {[
                  "destination",
                  "payload",
                  "effects",
                  "rollback",
                  "expiresAt",
                  "scopes",
                ].map((key) => {
                  const before = request.previous.at(-1)[key],
                    after = request[key];
                  return (
                    <div key={key}>
                      <h4>{key}</h4>
                      <div className="profile-fields">
                        <pre className="product-code">
                          Previous:{" "}
                          {before === undefined
                            ? "Not captured in older snapshot"
                            : Array.isArray(before)
                              ? before.join(", ")
                              : before}
                        </pre>
                        <pre className="product-code">
                          Current:{" "}
                          {Array.isArray(after) ? after.join(", ") : after}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </details>
            )}
            <details>
              <summary>
                Previous versions ({request.previous?.length || 0})
              </summary>
              {request.previous?.map((v) => (
                <article key={v.version}>
                  <h4>
                    Version {v.version} · {v.state}
                  </h4>
                  <p>{v.destination}</p>
                  <pre className="product-code">{v.payload}</pre>
                </article>
              ))}
            </details>
          </article>
        ) : (
          <Empty title="Decisions deserve context.">
            Select a request to inspect its scope, destination, and effects.
          </Empty>
        )}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {editing && (
        <RequestEditor
          request={editing}
          close={() => setEditing(null)}
          save={(draft) => {
            const old = requests.find((r) => r.id === draft.id),
              next = old ? reviseApproval(old, draft) : draft;
            setRequests((rows) =>
              old
                ? rows.map((r) => (r.id === next.id ? next : r))
                : [next, ...rows],
            );
            setSelected(next.id);
            setEditing(null);
            setFilter("Pending");
          }}
        />
      )}
    </section>
  );
}
function RequestEditor({ request, close, save }) {
  const [draft, setDraft] = useState(request),
    [error, setError] = useState("");
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Dialog title="Review request" close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = validateApproval(draft);
          if (error) {
            setError(error);
            return;
          }
          save(draft);
        }}
      >
        <Field
          label="Request title"
          value={draft.name}
          required
          onChange={(v) => set("name", v)}
        />
        <Field
          label="Destination"
          value={draft.destination}
          required
          onChange={(v) => set("destination", v)}
        />
        <Field
          label="Exact payload"
          type="textarea"
          value={draft.payload}
          required
          onChange={(v) => set("payload", v)}
        />
        <Field
          label="Requested scopes (comma separated)"
          value={draft.scopes.join(", ")}
          onChange={(v) =>
            set(
              "scopes",
              v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
        <Field
          label="Expected effects"
          type="textarea"
          value={draft.effects}
          onChange={(v) => set("effects", v)}
        />
        <Field
          label="Rollback plan"
          value={draft.rollback}
          onChange={(v) => set("rollback", v)}
        />
        <Field
          label="Expires at"
          type="datetime-local"
          value={draft.expiresAt.slice(0, 16)}
          onChange={(v) => set("expiresAt", v)}
        />
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <Button onClick={close}>Cancel</Button>
          <button className="button dark">Save request</button>
        </div>
      </form>
    </Dialog>
  );
}
