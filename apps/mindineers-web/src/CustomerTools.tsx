import type {
  Workspace,
  WorkspaceUpdate,
  ProductCollections,
  LegacyRecord,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Dialog, Field, Button } from "./ProductUI";
import {
  parseCSV,
  mapContacts,
  mergeContacts,
  contactFields,
} from "./customer-import";
export default function CustomerTools({
  items,
  update,
  data,
}: {
  items: LegacyRecord[];
  update: WorkspaceUpdate;
  data?: Workspace;
}) {
  const [mode, setMode] = useState(""),
    [text, setText] = useState(""),
    [csv, setCSV] = useState<ReturnType<typeof parseCSV> | null>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [target, setTarget] = useState(""),
    [source, setSource] = useState(""),
    [choices, setChoices] = useState<Record<string, string>>({}),
    [undo, setUndo] = useState<{
      before: LegacyRecord[];
      after: LegacyRecord[];
      beforeLinked: ProductCollections["deliveries"];
      afterLinked: ProductCollections["deliveries"];
    } | null>(null);
  const preview = csv ? mapContacts(csv, mapping, items) : [],
    valid = preview.filter((r) => !r.errors.length && !r.duplicate),
    a = items.find((x) => x.id === target),
    b = items.find((x) => x.id === source);
  const deliveries = data?.product?.deliveries || [];
  const replace = (
    next: LegacyRecord[],
    linked: ProductCollections["deliveries"],
  ) =>
    update((d) => ({
      ...d,
      records: { ...d.records, customers: next },
      ...(linked ? { product: { ...d.product, deliveries: linked } } : {}),
    }));
  const commit = (next: LegacyRecord[], sourceId = "", targetId = "") => {
    const linked = sourceId
      ? deliveries.map((r) =>
          r.customerId === sourceId
            ? {
                ...r,
                customerId: targetId,
                artifacts: r.artifacts.map((a) => ({
                  ...a,
                  customerId: targetId,
                })),
              }
            : r,
        )
      : deliveries;
    setUndo({
      before: items,
      after: next,
      beforeLinked: deliveries,
      afterLinked: linked,
    });
    replace(next, linked);
    setMode("");
  };
  const parse = () => {
    try {
      const next = parseCSV(text);
      setCSV(next);
      setMapping(
        Object.fromEntries(
          contactFields.map((f) => {
            const i = next.headers.findIndex(
              (h) => h.toLowerCase().replace(/[ -]/g, "") === f.toLowerCase(),
            );
            return [f, i < 0 ? "" : String(i)];
          }),
        ),
      );
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to complete action.");
    }
  };
  return (
    <>
      <div className="exp-actions">
        <Button
          onClick={() => {
            setMode("import");
            setMessage("");
          }}
        >
          Import contacts
        </Button>
        <Button
          disabled={items.length < 2}
          onClick={() => {
            setMode("merge");
            setMessage("");
          }}
        >
          Merge contacts
        </Button>
        {undo && (
          <Button
            onClick={() => {
              if (
                JSON.stringify(items) !== JSON.stringify(undo.after) ||
                JSON.stringify(deliveries) !== JSON.stringify(undo.afterLinked)
              ) {
                setMessage(
                  "Contacts changed after this operation. Undo is paused to preserve later edits.",
                );
                return;
              }
              replace(undo.before, undo.beforeLinked);
              setUndo(null);
              setMessage("Operation undone.");
            }}
          >
            Undo last import / merge
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {mode === "import" && (
        <Dialog
          title="Import contacts with field mapping"
          close={() => setMode("")}
        >
          <p>
            Paste CSV with column headers. Review mappings before importing.
            Existing contacts are preserved; duplicate emails and invalid rows
            are skipped.
          </p>
          <Field
            label="CSV content (up to 1 MB)"
            type="textarea"
            value={text}
            onChange={(v) => {
              setText(v);
              setCSV(null);
            }}
            maxLength={1000000}
          />
          <Button onClick={parse}>Read columns</Button>
          {csv && (
            <>
              <div className="profile-fields">
                {contactFields.map((f) => (
                  <label className="product-field" key={f}>
                    {f}
                    <select
                      value={mapping[f] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [f]: e.target.value }))
                      }
                    >
                      <option value="">Not mapped</option>
                      {csv.headers.map((h, i) => (
                        <option key={h} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <p>
                {valid.length} ready ·{" "}
                {preview.filter((r) => r.duplicate).length} duplicate emails ·{" "}
                {preview.filter((r) => r.errors.length).length} invalid rows
              </p>
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                {preview.map((r) => (
                  <div className="dashboard-row" key={r.line}>
                    <div>
                      <strong>
                        Row {r.line}: {r.record.name || "Unnamed"}
                      </strong>
                      <span>
                        {r.record.email} ·{" "}
                        {r.errors.join("; ") ||
                          (r.duplicate ? "Duplicate — will skip" : "Ready")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                disabled={!valid.length}
                onClick={() => {
                  const added = valid.map(({ record }) => ({
                    ...record,
                    id: crypto.randomUUID(),
                    status: "Lead",
                    stage: "Lead",
                    owner: record.owner || "You",
                    currency: record.currency || "USD",
                    activities: [],
                  }));
                  commit([...added, ...items]);
                  setCSV(null);
                  setText("");
                  setMessage(
                    `Imported ${added.length} contacts. Skipped rows were not changed.`,
                  );
                }}
              >
                Import {valid.length} valid contacts
              </Button>
            </>
          )}
          {message && <p role="alert">{message}</p>}
        </Dialog>
      )}
      {mode === "merge" && (
        <Dialog title="Review contact merge" close={() => setMode("")}>
          <p>
            Keep the target ID and pipeline state. Choose each field, combine
            activity history, and remove the source contact. Linked delivery
            customer references move to the target. Undo is available until
            another contact or delivery edit.
          </p>
          {(
            [
              ["Keep target", target, setTarget],
              ["Merge source", source, setSource],
            ] as const
          ).map(([label, value, set]) => (
            <label className="product-field" key={label}>
              {label}
              <select
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  setChoices({});
                }}
              >
                <option value="">Choose contact</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} · {i.email || i.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {a && b && a.id !== b.id && (
            <>
              {contactFields.map((f) => (
                <label className="product-field" key={f}>
                  {f}
                  <select
                    value={choices[f] || "target"}
                    onChange={(e) =>
                      setChoices((c) => ({ ...c, [f]: e.target.value }))
                    }
                  >
                    <option value="target">Keep: {a[f] || "(empty)"}</option>
                    <option value="source">
                      Use source: {b[f] || "(empty)"}
                    </option>
                  </select>
                </label>
              ))}
              <Button
                onClick={() => {
                  const merged = mergeContacts(a, b, choices);
                  commit(
                    items
                      .filter((i) => i.id !== b.id)
                      .map((i) => (i.id === a.id ? merged : i)),
                    b.id,
                    a.id,
                  );
                  setMessage("Contacts merged. Activity history preserved.");
                }}
              >
                Confirm reviewed merge
              </Button>
            </>
          )}
          {target && source && target === source && (
            <p role="alert">Choose two different contacts.</p>
          )}
        </Dialog>
      )}
    </>
  );
}
