import CustomerTools from "./CustomerTools";
import React, { useState, useRef, useEffect } from "react";
const stages = ["Lead", "Qualified", "Proposal", "Won", "Lost"];
export default function Customers({ data, update }) {
  const [view, setView] = useState("Pipeline"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(null),
    [notice, setNotice] = useState("");
  const items = data.records.customers || [],
    filtered = items.filter((i) =>
      (i.name + " " + (i.company || "") + " " + (i.email || ""))
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const stage = (i) =>
    i.stage || { Active: "Won", Archived: "Lost" }[i.status] || "Lead";
  const save = (record) => {
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        customers: items.some((i) => i.id === record.id)
          ? items.map((i) => (i.id === record.id ? record : i))
          : [record, ...items],
      },
    }));
    setEditing(null);
  };
  const create = () =>
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      owner: "You",
      status: "Lead",
      stage: "Lead",
      company: "",
      email: "",
      value: "",
      currency: "USD",
      nextContact: "",
      source: "",
      activities: [],
    });
  const exportCSV = () => {
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replaceAll('"', '""')
        .replace(/^[=+@-]/, "'$&") +
      '"';
    const csv = [
      ["Name", "Company", "Email", "Stage", "Value", "Currency", "Follow-up"],
      ...items.map((i) => [
        i.name,
        i.company,
        i.email,
        stage(i),
        i.value,
        i.currency,
        i.nextContact,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindineers-customers.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const card = (i) => (
    <button
      key={i.id}
      className="customer-card"
      onClick={() => setEditing({ ...i, stage: stage(i) })}
    >
      <span className="customer-avatar">{i.name[0]}</span>
      <h3>{i.name}</h3>
      <p>{i.company || "Independent contact"}</p>
      {i.value && (
        <strong className="customer-value">
          {i.currency || "USD"} {i.value}
        </strong>
      )}
      <div>
        <span>{i.owner}</span>
        <span>{i.nextContact ? "↗ " + i.nextContact : "No follow-up"}</span>
      </div>
    </button>
  );
  return (
    <section>
      <div className="mission-summary">
        <div>
          <strong>{items.length}</strong>
          <span>Relationships</span>
        </div>
        <div>
          <strong>{items.filter((i) => stage(i) === "Proposal").length}</strong>
          <span>Proposals</span>
        </div>
        <div>
          <strong>{items.filter((i) => stage(i) === "Won").length}</strong>
          <span>Won</span>
        </div>
        <div>
          <strong>
            {
              items.filter(
                (i) =>
                  i.nextContact &&
                  i.nextContact <= new Date().toLocaleDateString("en-CA") &&
                  !["Won", "Lost"].includes(stage(i)),
              ).length
            }
          </strong>
          <span>Follow-ups due</span>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs">
          {["Pipeline", "Contacts"].map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="wb-actions">
          <button className="button" onClick={exportCSV}>
            Export CSV
          </button>
          <button className="button dark" onClick={create}>
            + Add customer
          </button>
        </div>
      </div>
      <CustomerTools items={items} update={update} />
      <div className="mission-filters">
        <input
          aria-label="Search customers"
          placeholder="Search people, organizations, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {view === "Pipeline" ? (
        <div className="mission-board">
          {stages.map((s) => (
            <section key={s} className="mission-column">
              <h2>
                {s}
                <small>{filtered.filter((i) => stage(i) === s).length}</small>
              </h2>
              {filtered.filter((i) => stage(i) === s).map(card)}
              {!filtered.some((i) => stage(i) === s) && (
                <p className="mission-column-empty">
                  No relationships in this stage.
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="record-grid">{filtered.map(card)}</div>
      )}
      {notice && <p role="status">{notice}</p>}
      {editing && (
        <CustomerEditor
          customer={editing}
          items={items}
          agents={data.agents}
          save={save}
          close={() => setEditing(null)}
        />
      )}
    </section>
  );
}
function CustomerEditor({ customer, items, agents, save, close }) {
  const ref = useRef(),
    [draft, setDraft] = useState({
      ...customer,
      activities: customer.activities || [],
    }),
    [note, setNote] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const duplicate =
    draft.email &&
    items.some(
      (i) =>
        i.id !== draft.id &&
        i.email?.trim().toLowerCase() === draft.email.trim().toLowerCase(),
    );
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label="Customer details"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">RELATIONSHIPS WITH CONTEXT</span>
          <h2>{customer.name || "Meet someone new."}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close customer"
          onClick={close}
        >
          ×
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save({
            ...draft,
            status:
              draft.stage === "Won"
                ? "Active"
                : draft.stage === "Lost"
                  ? "Archived"
                  : "Lead",
          });
        }}
      >
        <div className="form-two">
          <label>
            Name
            <input
              required
              maxLength={120}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label>
            Organization
            <input
              value={draft.company || ""}
              onChange={(e) => set("company", e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={draft.email || ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label>
            Stage
            <select
              value={draft.stage}
              onChange={(e) => set("stage", e.target.value)}
            >
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        {duplicate && (
          <p className="notice">
            Another contact has this email. Review the existing relationship
            before adding a duplicate.
          </p>
        )}
        <label>
          Requirements and relationship notes
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="form-two">
          <label>
            Opportunity value
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.value || ""}
              onChange={(e) => set("value", e.target.value)}
            />
          </label>
          <label>
            Currency
            <select
              value={draft.currency || "USD"}
              onChange={(e) => set("currency", e.target.value)}
            >
              {["USD", "EUR", "GBP", "INR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Follow-up date
            <input
              type="date"
              value={draft.nextContact || ""}
              onChange={(e) => set("nextContact", e.target.value)}
            />
          </label>
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
        </div>
        <label>
          Source
          <input
            value={draft.source || ""}
            onChange={(e) => set("source", e.target.value)}
            placeholder="Referral, inbound, event…"
          />
        </label>
        <h3>Relationship timeline</h3>
        {draft.activities.map((a) => (
          <article className="wb-comment" key={a.id}>
            <small>{new Date(a.at).toLocaleString()}</small>
            <p>{a.text}</p>
          </article>
        ))}
        <label>
          Log an interaction
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button"
          disabled={!note.trim()}
          onClick={() => {
            set("activities", [
              ...draft.activities,
              {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                text: note.trim(),
              },
            ]);
            setNote("");
          }}
        >
          Add to timeline
        </button>
        <div className="dialog-actions">
          <button type="button" className="button" onClick={close}>
            Cancel
          </button>
          <button className="button dark">Save customer</button>
        </div>
      </form>
    </dialog>
  );
}
