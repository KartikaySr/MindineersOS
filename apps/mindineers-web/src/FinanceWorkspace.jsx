import React, { useState } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
import {
  currencies,
  financeStates,
  financeTotals,
  money,
  transitionFinance,
} from "./business-model";
export function newLedger() {
  return {
    id: uid(),
    name: "Untitled invoice",
    kind: "Invoice",
    counterparty: "",
    currency: "USD",
    tax: "0",
    due: "",
    state: "Draft",
    matchReference: "",
    matchedAmount: "",
    notes: "",
    lines: [{ id: uid(), description: "", quantity: "1", price: "0" }],
    history: [],
  };
}
export default function FinanceWorkspace({ data, update }) {
  const [items, setItems] = useCollection(data, update, "ledger"),
    [selected, select] = useState(""),
    [tab, setTab] = useState("Document"),
    [filter, setFilter] = useState("All"),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [next, setNext] = useState("Submitted"),
    [evidence, setEvidence] = useState("");
  const record = items.find((i) => i.id === selected) || items[0];
  const patch = (fields) =>
    setItems((rows) =>
      rows.map((r) => (r.id === record.id ? { ...r, ...fields } : r)),
    );
  let totals, error;
  if (record) {
    try {
      totals = financeTotals(record);
    } catch (e) {
      error = e.message;
    }
  }
  const locked = record && record.state !== "Draft";
  const create = () => {
    const r = newLedger();
    setItems((rows) => [r, ...rows]);
    select(r.id);
    setTab("Document");
    setMessage("");
  };
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">FINANCE & PROCUREMENT</span>
          <h2>Every amount, accounted for.</h2>
          <p>
            Prepare invoices, track expenses, and reconcile against documented
            evidence.
          </p>
        </div>
        <Button onClick={create}>+ Financial document</Button>
      </div>
      <div className="notice">
        Workspace records only. Statuses are manually recorded; your payment
        provider and accounting system remain authoritative. No money is moved.
      </div>
      <div className="business-toolbar">
        <Field label="Search documents" value={query} onChange={setQuery} />
        <Field
          label="Status filter"
          value={filter}
          options={["All", ...financeStates]}
          onChange={setFilter}
        />
      </div>
      <div className="product-split">
        <aside className="product-list">
          {items
            .filter(
              (r) =>
                (filter === "All" || r.state === filter) &&
                (r.name + " " + r.counterparty)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .map((r) => (
              <button
                key={r.id}
                className={r.id === record?.id ? "active" : ""}
                onClick={() => {
                  select(r.id);
                  setMessage("");
                  setEvidence("");
                }}
              >
                <strong>{r.name}</strong>
                <small>
                  {r.kind} · {r.state} · {r.currency}
                </small>
              </button>
            ))}
        </aside>
        {record ? (
          <article className="product-detail">
            <div className="product-editor-title">
              <h2>{record.name}</h2>
              <Button onClick={() => download("financial-record.json", record)}>
                Export record
              </Button>
            </div>
            <Tabs
              values={["Document", "Reconciliation", "History"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Document" ? (
              <>
                <div className="business-grid">
                  <Field
                    label="Reference / title"
                    value={record.name}
                    disabled={locked}
                    onChange={(name) => patch({ name })}
                  />
                  <Field
                    label="Document type"
                    value={record.kind}
                    disabled={locked}
                    options={["Invoice", "Expense", "Purchase request"]}
                    onChange={(kind) => patch({ kind })}
                  />
                  <Field
                    label="Customer or supplier"
                    value={record.counterparty}
                    disabled={locked}
                    onChange={(counterparty) => patch({ counterparty })}
                  />
                  <Field
                    label="Currency"
                    value={record.currency}
                    disabled={locked}
                    options={Object.keys(currencies)}
                    onChange={(currency) => patch({ currency })}
                  />
                  <Field
                    label="Due date"
                    type="date"
                    value={record.due}
                    disabled={locked}
                    onChange={(due) => patch({ due })}
                  />
                  <Field
                    label="Tax % (exclusive, rounded once)"
                    value={record.tax}
                    disabled={locked}
                    onChange={(tax) => patch({ tax })}
                  />
                </div>
                <h3>Line items</h3>
                {record.lines.map((line, index) => (
                  <div className="business-line" key={line.id}>
                    {[
                      ["description", "Description"],
                      ["quantity", "Quantity"],
                      ["price", "Unit price"],
                    ].map(([key, label]) => (
                      <Field
                        key={key}
                        label={`${label} ${index + 1}`}
                        value={line[key]}
                        disabled={locked}
                        onChange={(v) =>
                          patch({
                            lines: record.lines.map((l) =>
                              l.id === line.id ? { ...l, [key]: v } : l,
                            ),
                          })
                        }
                      />
                    ))}
                    <Button
                      disabled={locked}
                      aria-label={`Remove line ${index + 1}`}
                      onClick={() =>
                        patch({
                          lines: record.lines.filter((l) => l.id !== line.id),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  disabled={locked}
                  onClick={() =>
                    patch({
                      lines: [
                        ...record.lines,
                        {
                          id: uid(),
                          description: "",
                          quantity: "1",
                          price: "0",
                        },
                      ],
                    })
                  }
                >
                  + Line item
                </Button>
                {error ? (
                  <p role="alert">{error}</p>
                ) : (
                  <div className="business-totals">
                    <span>
                      Subtotal{" "}
                      <strong>{money(totals.subtotal, record.currency)}</strong>
                    </span>
                    <span>
                      Tax <strong>{money(totals.tax, record.currency)}</strong>
                    </span>
                    <span>
                      Total{" "}
                      <strong>{money(totals.total, record.currency)}</strong>
                    </span>
                  </div>
                )}
                <Field
                  label="Tax assumptions, source documents, and notes"
                  type="textarea"
                  value={record.notes}
                  disabled={locked}
                  onChange={(notes) => patch({ notes })}
                />
                {locked && (
                  <div className="notice">
                    Document values are locked after submission. Create a
                    revised draft to change amounts while preserving this
                    record.
                  </div>
                )}
                <Button
                  onClick={() => {
                    const copy = {
                      ...record,
                      id: uid(),
                      name: record.name + " · revision",
                      state: "Draft",
                      history: [],
                      matchReference: "",
                      matchedAmount: "",
                    };
                    setItems((rows) => [copy, ...rows]);
                    select(copy.id);
                  }}
                >
                  Create revised draft
                </Button>
              </>
            ) : tab === "Reconciliation" ? (
              <>
                <p>
                  Match this document to a statement or purchase order in the
                  same currency. A reference and an exact amount match are
                  required for reconciliation.
                </p>
                <Field
                  label="Statement / purchase-order reference"
                  disabled={record.state === "Reconciled"}
                  value={record.matchReference}
                  onChange={(matchReference) => patch({ matchReference })}
                />
                <Field
                  label={`Matched amount (${record.currency})`}
                  disabled={record.state === "Reconciled"}
                  value={record.matchedAmount}
                  onChange={(matchedAmount) => patch({ matchedAmount })}
                />
                <Field
                  label="Record next status"
                  value={next}
                  options={financeStates.filter((s) => s !== "Draft")}
                  onChange={setNext}
                />
                <Field
                  label="Evidence / source for status"
                  type="textarea"
                  value={evidence}
                  onChange={setEvidence}
                />
                <Button
                  onClick={() => {
                    try {
                      const changed = transitionFinance(
                        record,
                        next,
                        evidence,
                        data.settings.name || "Workspace owner",
                      );
                      setItems((rows) =>
                        rows.map((r) => (r.id === record.id ? changed : r)),
                      );
                      setMessage(
                        `Recorded ${next}. No external action was taken.`,
                      );
                      setEvidence("");
                    } catch (e) {
                      setMessage(e.message);
                    }
                  }}
                >
                  Record status with evidence
                </Button>
                <p>
                  Current: <strong>{record.state}</strong>. Normal sequence:
                  Draft → Submitted → Accepted → Paid → Reconciled. Disputes can
                  reopen submitted records.
                </p>
              </>
            ) : (
              <>
                <h3>Evidence trail</h3>
                {record.history.length ? (
                  record.history.map((h) => (
                    <article className="panel" key={h.id}>
                      <strong>
                        {h.from} → {h.to}
                      </strong>
                      <p>{h.evidence}</p>
                      <small>
                        {h.actor} · {h.at}
                      </small>
                    </article>
                  ))
                ) : (
                  <p>No status changes recorded.</p>
                )}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </article>
        ) : (
          <Empty title="Start with a financial document.">
            Add a draft invoice, expense, or purchase request. Totals use
            currency-specific minor units.
          </Empty>
        )}
      </div>
    </section>
  );
}
