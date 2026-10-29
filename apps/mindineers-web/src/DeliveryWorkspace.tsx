import type {
  Workspace,
  WorkspaceUpdate,
  DeliveryRecord,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
import { portalSnapshot, acceptanceReady } from "./business-model";
export function newDelivery(): DeliveryRecord {
  return {
    id: uid(),
    name: "Untitled delivery",
    customerId: "",
    projectId: "",
    owner: "",
    priority: "Normal",
    due: "",
    state: "Intake",
    requirements: "",
    source: "",
    escalation: "",
    response: "",
    acceptanceEvidence: "",
    checklist: [],
    updates: [],
    artifacts: [],
  };
}
export default function DeliveryWorkspace({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [items, setItems] = useCollection(data, update, "deliveries"),
    [selected, select] = useState(""),
    [tab, setTab] = useState("Intake"),
    [task, setTask] = useState(""),
    [post, setPost] = useState(""),
    [message, setMessage] = useState(""),
    [docId, setDocId] = useState("");
  const customers = data.records.customers || [],
    docs = data.product?.documents || [],
    record = items.find((i) => i.id === selected) || items[0],
    customer = customers.find((c) => c.id === record?.customerId);
  const patch = (fields: Partial<DeliveryRecord>) =>
    setItems((rows) =>
      rows.map((r) => (r.id === record?.id ? { ...r, ...fields } : r)),
    );
  const scopeChange = (customerId: string) => {
    if (!record) return;
    patch({
      customerId,
      artifacts: [],
      updates: record.updates.map((u) => ({ ...u, visible: false })),
      state: "Intake",
      acceptanceEvidence: "",
    });
  };
  const resetAcceptance = (fields: Partial<DeliveryRecord>) => {
    if (!record) return;
    patch({
      ...fields,
      ...(["Awaiting acceptance", "Accepted"].includes(record.state)
        ? { state: "In progress", acceptanceEvidence: "" }
        : {}),
    });
  };
  let snapshot;
  if (customer && record) snapshot = portalSnapshot(record, customer, docs);
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">DELIVERY & SUPPORT</span>
          <h2>Make the handoff feel effortless.</h2>
          <p>From customer intake to a reviewed, clearly scoped delivery.</p>
        </div>
        <Button
          onClick={() => {
            const r = newDelivery();
            setItems((rows) => [r, ...rows]);
            select(r.id);
            setTab("Intake");
          }}
        >
          + Delivery
        </Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {items.map((r) => (
            <button
              key={r.id}
              className={r.id === record?.id ? "active" : ""}
              onClick={() => {
                select(r.id);
                setMessage("");
              }}
            >
              <strong>{r.name}</strong>
              <small>
                {r.state} · {r.priority}
                {r.due ? " · " + r.due : ""}
              </small>
            </button>
          ))}
        </aside>
        {record ? (
          <article className="product-detail">
            <h2>{record.name}</h2>
            <Tabs
              values={[
                "Intake",
                "Checklist",
                "Updates & response",
                "Portal preview",
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Intake" ? (
              <>
                <Field
                  label="Delivery title"
                  value={record.name}
                  onChange={(name) => patch({ name })}
                />
                <label className="product-field">
                  Customer
                  <select
                    value={record.customerId}
                    onChange={(e) => scopeChange(e.target.value)}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="muted">
                  Changing the customer clears shared artifacts, hides previous
                  updates, and resets acceptance.{" "}
                  <a href="#customers">Manage customers</a>
                </p>
                <label className="product-field">
                  Linked project
                  <select
                    value={record.projectId}
                    onChange={(e) => patch({ projectId: e.target.value })}
                  >
                    <option value="">No linked project</option>
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="business-grid">
                  <Field
                    label="Assigned owner"
                    value={record.owner}
                    onChange={(owner) => patch({ owner })}
                  />
                  <Field
                    label="Priority"
                    value={record.priority}
                    options={["Normal", "High", "Urgent"]}
                    onChange={(priority) => patch({ priority })}
                  />
                  <Field
                    label="Service target / due"
                    type="datetime-local"
                    value={record.due}
                    onChange={(due) => patch({ due })}
                  />
                  <Field
                    label="Work status"
                    value={record.state}
                    options={[
                      "Intake",
                      "Assigned",
                      "In progress",
                      "Escalated",
                      ...(["Awaiting acceptance", "Accepted"].includes(
                        record.state,
                      )
                        ? [record.state]
                        : []),
                    ]}
                    onChange={(state) =>
                      patch({ state, acceptanceEvidence: "" })
                    }
                  />
                </div>
                <Field
                  label="Contractual requirements / acceptance criteria"
                  type="textarea"
                  value={record.requirements}
                  onChange={(requirements) => resetAcceptance({ requirements })}
                />
                <Field
                  label="Source for requirements"
                  value={record.source}
                  onChange={(source) => resetAcceptance({ source })}
                />
                <Field
                  label="Internal escalation and next action"
                  type="textarea"
                  value={record.escalation}
                  onChange={(escalation) => patch({ escalation })}
                />
              </>
            ) : tab === "Checklist" ? (
              <>
                <h3>Delivery acceptance</h3>
                {record.checklist.map((c) => (
                  <label className="business-check" key={c.id}>
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={(e) =>
                        resetAcceptance({
                          checklist: record.checklist.map((x) =>
                            x.id === c.id
                              ? { ...x, done: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />
                    <span>{c.text}</span>
                    <Button
                      aria-label={`Remove ${c.text}`}
                      onClick={() =>
                        resetAcceptance({
                          checklist: record.checklist.filter(
                            (x) => x.id !== c.id,
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </label>
                ))}
                <Field
                  label="New checklist item"
                  value={task}
                  onChange={setTask}
                />
                <Button
                  disabled={!task.trim()}
                  onClick={() => {
                    resetAcceptance({
                      checklist: [
                        ...record.checklist,
                        { id: uid(), text: task.trim(), done: false },
                      ],
                    });
                    setTask("");
                  }}
                >
                  Add item
                </Button>
                <p>
                  Acceptance needs a customer, sourced requirements, and a
                  completed checklist.
                </p>
                <Button
                  disabled={
                    !customer ||
                    !acceptanceReady(record) ||
                    record.state === "Accepted"
                  }
                  onClick={() => patch({ state: "Awaiting acceptance" })}
                >
                  Prepare acceptance request
                </Button>
                <Field
                  label="Customer acceptance evidence"
                  type="textarea"
                  value={record.acceptanceEvidence}
                  disabled={record.state === "Accepted"}
                  onChange={(acceptanceEvidence) =>
                    patch({ acceptanceEvidence })
                  }
                />
                <Button
                  disabled={
                    record.state !== "Awaiting acceptance" ||
                    !record.acceptanceEvidence.trim() ||
                    !customer ||
                    !acceptanceReady(record)
                  }
                  onClick={() => patch({ state: "Accepted" })}
                >
                  Record documented acceptance
                </Button>
                <p className="muted">
                  This records evidence locally; it does not contact or
                  authenticate the customer.
                </p>
              </>
            ) : tab === "Updates & response" ? (
              <>
                <Field
                  label="Customer response draft"
                  type="textarea"
                  value={record.response}
                  onChange={(response) => patch({ response })}
                />
                <Button disabled>Send response · connection required</Button>
                <Field
                  label="New progress update"
                  type="textarea"
                  value={post}
                  onChange={setPost}
                />
                <Button
                  disabled={!post.trim()}
                  onClick={() => {
                    patch({
                      updates: [
                        ...record.updates,
                        {
                          id: uid(),
                          text: post.trim(),
                          at: new Date().toISOString(),
                          visible: false,
                        },
                      ],
                    });
                    setPost("");
                  }}
                >
                  Save internal update
                </Button>
                {record.updates.map((u) => (
                  <article className="panel" key={u.id}>
                    <p>{u.text}</p>
                    <small>{u.at}</small>
                    <label className="business-check">
                      <input
                        type="checkbox"
                        checked={u.visible}
                        disabled={!customer}
                        onChange={(e) =>
                          patch({
                            updates: record.updates.map((x) =>
                              x.id === u.id
                                ? { ...x, visible: e.target.checked }
                                : x,
                            ),
                          })
                        }
                      />
                      Include in this customer's preview
                    </label>
                  </article>
                ))}
              </>
            ) : (
              <>
                <div className="notice">
                  Local preview and export only. Review document content for
                  customer suitability. Public links and authenticated customer
                  access require the backend. <a href="#portal">Open the customer portal entry</a>
                </div>
                <label className="product-field">
                  Document to include
                  <select
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                  >
                    <option value="">Choose a document</option>
                    {docs.map((d) => (
                      <option value={d.id} key={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  disabled={
                    !customer ||
                    !docId ||
                    record.artifacts.some((a) => a.documentId === docId)
                  }
                  onClick={() => {
                    if (!customer) return;
                    patch({
                      artifacts: [
                        ...record.artifacts,
                        {
                          id: uid(),
                          documentId: docId,
                          customerId: customer.id,
                          visible: true,
                        },
                      ],
                    });
                    setDocId("");
                  }}
                >
                  Include selected document
                </Button>
                {record.artifacts.map((a) => (
                  <label className="business-check" key={a.id}>
                    <input
                      type="checkbox"
                      checked={a.visible}
                      onChange={(e) =>
                        patch({
                          artifacts: record.artifacts.map((x) =>
                            x.id === a.id
                              ? { ...x, visible: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />
                    {docs.find((d) => d.id === a.documentId)?.name ||
                      "Deleted document (excluded)"}
                  </label>
                ))}
                {snapshot ? (
                  <div className="portal-preview">
                    <span className="eyebrow">
                      PREVIEW FOR {snapshot.customer.name}
                    </span>
                    <h2>{snapshot.delivery.name}</h2>
                    <p>
                      {snapshot.delivery.status} ·{" "}
                      {snapshot.delivery.due || "No due date shared"}
                    </p>
                    <h3>Updates</h3>
                    {snapshot.updates.length ? (
                      snapshot.updates.map((u, i) => <p key={i}>{u.text}</p>)
                    ) : (
                      <p>No updates selected.</p>
                    )}
                    <h3>Shared documents</h3>
                    {snapshot.artifacts.map((d, i) => (
                      <details key={i}>
                        <summary>
                          {d.name} · {d.kind}
                        </summary>
                        <pre>
                          {d.kind === "Sheet"
                            ? d.rows.map((r) => r.join("\t")).join("\n")
                            : d.kind === "Presentation"
                              ? d.slides
                                  .map((s) => s.title + "\n" + s.body)
                                  .join("\n\n")
                              : d.body}
                        </pre>
                      </details>
                    ))}
                    <Button
                      onClick={() => {
                        download("customer-delivery.json", snapshot);
                        setMessage("Exported the reviewed customer snapshot.");
                      }}
                    >
                      Export this preview
                    </Button>
                  </div>
                ) : (
                  <p>
                    Select an existing customer in Intake to prepare a scoped
                    preview.
                  </p>
                )}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </article>
        ) : (
          <Empty title="Give your next delivery a home.">
            Track customer requirements, owners, acceptance, and carefully
            selected updates.
          </Empty>
        )}
      </div>
    </section>
  );
}
