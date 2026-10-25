import type {
  Workspace,
  WorkspaceUpdate,
  ChecklistItem,
} from "./shared/contracts/workspace";
import type { Graph } from "./domains/execution/model";
import type {
  Suite,
  Detail,
  Version,
  InvoiceDraft,
  EvidenceDraft,
  TrialDraft,
} from "./domains/settings/workbench-contracts";
import type { ReactNode, ButtonHTMLAttributes, FormEvent } from "react";
import ScopeSettings from "./domains/settings/ScopeSettings";
import Triggers from "./domains/execution/Triggers";
import WorkflowCanvas from "./domains/execution/WorkflowCanvas";
import ConfigurationDiff from "./domains/execution/ConfigurationDiff";
import { useState } from "react";
import { schema } from "./workbench-schema";
import {
  makeGraph,
  nodeTypes,
  validateGraph,
  invoiceTotal,
  validHttpUrl,
} from "./workbench-model";
import "./workbench.css";
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function download(name: string, value: unknown, type = "application/json") {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value?: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  options?: string[];
}) {
  return (
    <label className="wb-field">
      <span>{label}</span>
      {options ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          rows={5}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
const Btn = ({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className="button" type="button" {...props}>
    {children}
  </button>
);
function Empty({ children }: { children: ReactNode }) {
  return <div className="wb-empty">{children}</div>;
}
export default function Workbench({
  route,
  data,
  update,
}: {
  route: string;
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [selected, setSelected] = useState(""),
    [tab, setTab] = useState(""),
    [search, setSearch] = useState(""),
    [notice, setNotice] = useState("");
  const suite = data.suite || {
    details: {},
    runs: [],
    settings: {},
    localRecords: {},
  };
  const change = (fn: (suite: Suite) => Suite) =>
    update((d) => ({
      ...d,
      suite: fn(
        d.suite || { details: {}, runs: [], settings: {}, localRecords: {} },
      ),
    }));
  if (route === "runs") return <RunControl />;
  if (route === "settings")
    return (
      <ScopeSettings
        suite={suite}
        change={change}
        entities={{
          Project: data.projects || [],
          Agent: data.agents || [],
          Run: suite.runs || [],
        }}
      />
    );
  const definitions = (
    schema as Record<string, { tabs: Record<string, string[]> }>
  )[route] || {
    tabs: {
      Configuration: ["Objective", "Configuration", "Acceptance criteria"],
    },
  };
  const list =
    route === "projects"
      ? data.projects
      : route === "agents"
        ? data.agents
        : data.records[route] || suite.localRecords?.[route] || [];
  const record = list.find((r) => r.id === selected) || list[0],
    key = route + ":" + record?.id;
  const detail = suite.details?.[key] || {
    values: {},
    history: [],
    checklist: [],
    comments: [],
    links: [],
  };
  const edit = (patch: Partial<Detail>) =>
    change((s) => ({
      ...s,
      details: {
        ...s.details,
        [key]: { ...detail, ...patch, updatedAt: now() },
      },
    }));
  const tabs = [
    ...Object.keys(definitions.tabs),
    "Checklist",
    "Links",
    "Versions",
    "Activity",
  ];
  const active = tabs.includes(tab) ? tab : tabs[0] || "";
  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") || "").trim();
    if (!name) return;
    const item = {
      id: id(),
      name,
      description: "",
      owner: "You",
      status: "Draft",
    };
    update((d) => {
      if (route === "projects")
        return {
          ...d,
          projects: [{ ...item, progress: 0, color: "#b9d6bd" }, ...d.projects],
        };
      if (route === "agents")
        return {
          ...d,
          agents: [
            {
              ...item,
              role: "Specialist",
              symbol: name[0] || "✳",
              color: "#b9d6bd",
              tools: "",
              autonomy: "Draft only",
            },
            ...d.agents,
          ],
        };
      if (d.records[route])
        return {
          ...d,
          records: { ...d.records, [route]: [item, ...d.records[route]] },
        };
      const s = d.suite || {
        details: {},
        runs: [],
        settings: {},
        localRecords: {},
      };
      return {
        ...d,
        suite: {
          ...s,
          localRecords: {
            ...s.localRecords,
            [route]: [item, ...(s.localRecords?.[route] || [])],
          },
        },
      };
    });
    setSelected(item.id);
    setTab("");
    e.currentTarget.reset();
  };
  const checkpoint = () => {
    edit({
      history: [
        {
          id: id(),
          at: now(),
          values: structuredClone(detail.values),
          graph: detail.graph ? structuredClone(detail.graph) : undefined,
        },
        ...detail.history,
      ].slice(0, 100),
    });
    setNotice("Version saved locally.");
  };
  const start = () => {
    edit({
      publishedGraph: structuredClone(detail.graph || makeGraph()),
      publishedAt: now(),
    });
    setNotice("Workflow version saved. Connect the backend to execute it.");
  };
  return (
    <section className="wb">
      <div className="wb-banner">
        <span className="wb-dot" />
        <strong>Workspace</strong>
        <span>
          Saved on this device. Cloud sync and agent execution will become
          available when your backend is connected.
        </span>
      </div>
      <div className="wb-toolbar">
        <Field label="Find records" value={search} onChange={setSearch} />
      </div>
      <div className="wb-layout">
        <aside className="wb-records">
          <form onSubmit={create}>
            <input
              aria-label="New record name"
              name="name"
              placeholder="Name your next item"
              required
              maxLength={120}
            />
            <button className="button dark">Create</button>
          </form>
          <div role="list" aria-label="Workbench records">
            {list
              .filter((r) =>
                r.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((r) => (
                <button
                  key={r.id}
                  className={record?.id === r.id ? "active" : ""}
                  onClick={() => {
                    setSelected(r.id);
                    setTab("");
                    setNotice("");
                  }}
                >
                  <strong>{r.name}</strong>
                  <small>
                    {r.status} · {("owner" in r ? r.owner : "You") || "You"}
                  </small>
                </button>
              ))}
          </div>
          {!list.length && (
            <p className="muted">
              Create an item to open its detailed workspace.
            </p>
          )}
        </aside>
        {record ? (
          <div className="wb-detail">
            <header className="wb-heading">
              <div>
                <span className="eyebrow">
                  {route} /{" "}
                  {("owner" in record ? record.owner : "You") || "You"}
                </span>
                <h2>{record.name}</h2>
                <p>{record.description}</p>
              </div>
              <div className="wb-actions">
                <Btn onClick={checkpoint}>Save version</Btn>
                <Btn
                  onClick={() =>
                    download("mindineers-" + route + ".json", {
                      record,
                      detail,
                      storage: "device",
                    })
                  }
                >
                  Export
                </Btn>
              </div>
            </header>
            <div className="wb-tabs" role="group" aria-label="Record sections">
              {tabs.map((t) => (
                <button
                  aria-pressed={active === t}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div
              className="wb-body"
              role="region"
              aria-label={active}
              key={key + active}
            >
              {active === "Checklist" ? (
                <Checklist
                  items={detail.checklist}
                  setItems={(checklist) => edit({ checklist })}
                />
              ) : active === "Links" ? (
                <Links
                  items={detail.links}
                  setItems={(links) => edit({ links })}
                  data={data}
                />
              ) : active === "Versions" ? (
                <Versions
                  detail={detail}
                  restore={(v) => {
                    edit({
                      values: structuredClone(v.values),
                      graph: v.graph ? structuredClone(v.graph) : detail.graph,
                      history: [
                        {
                          id: id(),
                          at: now(),
                          values: structuredClone(detail.values),
                          graph: detail.graph,
                        },
                        ...detail.history,
                      ].slice(0, 100),
                    });
                    setNotice(
                      "Version restored; previous draft preserved as a checkpoint.",
                    );
                  }}
                />
              ) : active === "Activity" ? (
                <Comments
                  comments={detail.comments}
                  save={(comments) => edit({ comments })}
                />
              ) : (
                <>
                  {route === "workflows" && active === "Studio" && (
                    <>
                      <Workflow
                        graph={detail.graph || makeGraph()}
                        save={(graph) => edit({ graph })}
                        onRun={start}
                      />
                      <Triggers
                        data={data}
                        update={update}
                        workflowId={record.id}
                      />
                    </>
                  )}
                  <div className="wb-fields">
                    {(definitions.tabs[active] || []).map((label) => (
                      <Field
                        key={label}
                        label={label}
                        type="textarea"
                        value={detail.values[label]}
                        onChange={(value) =>
                          edit({ values: { ...detail.values, [label]: value } })
                        }
                      />
                    ))}
                  </div>
                  {route === "documents" && active === "Editor" && (
                    <DocumentPreview
                      value={
                        detail.values["Document body"] || record.description
                      }
                    />
                  )}{" "}
                  {route === "finance" && active === "Invoice" && (
                    <Invoice
                      value={detail.invoice}
                      save={(invoice) => edit({ invoice })}
                    />
                  )}{" "}
                  {["research", "knowledge"].includes(route) &&
                    active ===
                      (route === "research" ? "Evidence" : "Sources") && (
                      <Evidence
                        items={detail.evidence || []}
                        save={(evidence) => edit({ evidence })}
                      />
                    )}{" "}
                  {route === "evaluations" && active === "Trials" && (
                    <Trials
                      items={detail.trials || []}
                      save={(trials) => edit({ trials })}
                    />
                  )}{" "}
                </>
              )}
            </div>
            <div className="wb-inspector">
              <span>Scope: this browser</span>
              <span>{detail.history.length} saved versions</span>
              <span>
                Modified:{" "}
                {detail.updatedAt
                  ? new Date(detail.updatedAt).toLocaleString()
                  : "No local edits"}
              </span>
              <span>External execution: unavailable</span>
            </div>
          </div>
        ) : (
          <Empty>
            Select or create an item to begin. Your original records remain
            available in Overview.
          </Empty>
        )}
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
    </section>
  );
}
function Checklist({
  items,
  setItems,
}: {
  items: ChecklistItem[];
  setItems: (items: ChecklistItem[]) => void;
}) {
  return (
    <div>
      <h3>Acceptance checklist</h3>
      <p>
        Track evidence-backed completion independently from the record’s status.
      </p>
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const text = String(
            new FormData(e.currentTarget).get("text") || "",
          ).trim();
          if (text) setItems([...items, { id: id(), text, done: false }]);
          e.currentTarget.reset();
        }}
      >
        <input
          name="text"
          aria-label="Checklist item"
          required
          placeholder="What must be true?"
        />
        <button className="button">Add criterion</button>
      </form>
      {items.map((item) => (
        <div className="wb-check" key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) =>
                setItems(
                  items.map((i) =>
                    i.id === item.id ? { ...i, done: e.target.checked } : i,
                  ),
                )
              }
            />
            {item.text}
          </label>
          <Btn
            aria-label={"Remove " + item.text}
            onClick={() => setItems(items.filter((i) => i.id !== item.id))}
          >
            Remove
          </Btn>
        </div>
      ))}
      {!items.length && <Empty>No criteria yet.</Empty>}
      <progress
        max={items.length || 1}
        value={items.filter((i) => i.done).length}
      />
      <p>
        {items.filter((i) => i.done).length} / {items.length} complete
      </p>
    </div>
  );
}
function Links({
  items,
  setItems,
  data,
}: {
  items: string[];
  setItems: (items: string[]) => void;
  data: Workspace;
}) {
  const targets = [
    ...data.projects.map((r) => ({ ...r, domain: "projects" })),
    ...Object.entries(data.records).flatMap(([domain, rows]) =>
      rows.map((r) => ({ ...r, domain })),
    ),
  ];
  return (
    <>
      <h3>Related work</h3>
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(
            new FormData(e.currentTarget).get("target") || "",
          );
          if (value && !items.includes(value)) setItems([...items, value]);
        }}
      >
        <select name="target" aria-label="Related record">
          {targets.map((r) => (
            <option key={r.domain + ":" + r.id} value={r.domain + ":" + r.id}>
              {r.domain} / {r.name}
            </option>
          ))}
        </select>
        <button className="button">Link</button>
      </form>
      {items.map((key) => {
        const t = targets.find((r) => r.domain + ":" + r.id === key);
        return (
          <div className="wb-row" key={key}>
            <a href={"#" + (t?.domain || "home")}>
              {t?.name || "Unavailable record"}
            </a>
            <Btn onClick={() => setItems(items.filter((i) => i !== key))}>
              Unlink
            </Btn>
          </div>
        );
      })}
    </>
  );
}
function Versions({
  detail,
  restore,
}: {
  detail: Detail;
  restore: (version: Version) => void;
}) {
  const [compare, setCompare] = useState("");
  const v = detail.history.find((v) => v.id === compare);
  return (
    <>
      <ConfigurationDiff
        current={{ fields: detail.values, graph: detail.graph }}
        versions={detail.history}
      />
      <h3>Saved versions</h3>
      <p>
        Restoring changes the local draft. Previously saved versions remain
        available.
      </p>
      {detail.history.map((v, i) => (
        <div key={v.id} className="wb-row">
          <span>
            Version {detail.history.length - i} ·{" "}
            {new Date(v.at).toLocaleString()}
          </span>
          <div>
            <Btn onClick={() => setCompare(v.id)}>Compare</Btn>
            <Btn onClick={() => restore(v)}>Restore</Btn>
          </div>
        </div>
      ))}
      {!detail.history.length && (
        <Empty>Use Save version to create a checkpoint.</Empty>
      )}
      {v && (
        <div className="wb-comparison">
          <section>
            <h4>Saved version</h4>
            <pre>
              {JSON.stringify({ fields: v.values, graph: v.graph }, null, 2)}
            </pre>
          </section>
          <section>
            <h4>Current draft</h4>
            <pre>
              {JSON.stringify(
                { fields: detail.values, graph: detail.graph },
                null,
                2,
              )}
            </pre>
          </section>
        </div>
      )}
    </>
  );
}
function Comments({
  comments,
  save,
}: {
  comments: Detail["comments"];
  save: (comments: Detail["comments"]) => void;
}) {
  return (
    <>
      <h3>Review discussion</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = String(
            new FormData(e.currentTarget).get("comment") || "",
          ).trim();
          if (text) save([...comments, { id: id(), text, at: now() }]);
          e.currentTarget.reset();
        }}
      >
        <label>
          Comment
          <textarea name="comment" required rows={3} />
        </label>
        <button className="button">Add comment</button>
      </form>
      {comments.map((c) => (
        <article className="wb-comment" key={c.id}>
          <strong>You</strong>
          <small>{new Date(c.at).toLocaleString()}</small>
          <p>{c.text}</p>
        </article>
      ))}
    </>
  );
}
function DocumentPreview({ value }: { value: string }) {
  const lines = value.split("\n");
  return (
    <div className="wb-document">
      <div className="wb-row">
        <h3>Document preview</h3>
        <Btn onClick={() => download("document.md", value, "text/markdown")}>
          Export Markdown
        </Btn>
      </div>
      <p className="muted">
        Plain text and heading preview. Embedded HTML is not executed.
      </p>
      {lines.map((line, i) =>
        line.startsWith("# ") ? (
          <h2 key={i}>{line.slice(2)}</h2>
        ) : line.startsWith("## ") ? (
          <h3 key={i}>{line.slice(3)}</h3>
        ) : (
          <p key={i}>{line || "\u00a0"}</p>
        ),
      )}
    </div>
  );
}
function Invoice({
  value,
  save,
}: {
  value: InvoiceDraft | undefined;
  save: (value: InvoiceDraft) => void;
}) {
  const rows = value?.rows || [],
    currency = value?.currency || "USD",
    tax = value?.taxBps || 0;
  let totals, error;
  try {
    totals = invoiceTotal(rows, tax);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to calculate invoice.";
  }
  const format = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency }).format(
      n / 100,
    );
  return (
    <section className="wb-calculator">
      <h3>Invoice calculator</h3>
      <p>
        Integer minor-unit arithmetic. USD, EUR, GBP, and INR use two decimal
        places. This is a draft, not an issued invoice.
      </p>
      <div className="wb-inline">
        <Field
          label="Currency"
          value={currency}
          options={["USD", "EUR", "GBP", "INR"]}
          onChange={(currency) => save({ ...value, rows, currency })}
        />
        <Field
          label="Tax (%)"
          type="number"
          value={tax / 100}
          onChange={(v) =>
            save({ ...value, rows, taxBps: Math.round(Number(v) * 100) })
          }
        />
      </div>
      {rows.map((r, index) => (
        <div className="wb-invoice-row" key={r.id}>
          <Field
            label="Description"
            value={r.name}
            onChange={(v) =>
              save({
                ...value,
                rows: rows.map((x, i) => (i === index ? { ...x, name: v } : x)),
              })
            }
          />
          <Field
            label="Quantity"
            type="number"
            value={r.quantity}
            onChange={(v) =>
              save({
                ...value,
                rows: rows.map((x, i) =>
                  i === index ? { ...x, quantity: Number(v) } : x,
                ),
              })
            }
          />
          <Field
            label="Unit amount"
            type="number"
            value={r.unitMinor / 100}
            onChange={(v) =>
              save({
                ...value,
                rows: rows.map((x, i) =>
                  i === index
                    ? { ...x, unitMinor: Math.round(Number(v) * 100) }
                    : x,
                ),
              })
            }
          />
          <Btn
            onClick={() =>
              save({ ...value, rows: rows.filter((_, i) => i !== index) })
            }
          >
            Remove
          </Btn>
        </div>
      ))}
      <Btn
        onClick={() =>
          save({
            ...value,
            rows: [
              ...rows,
              { id: id(), name: "Line item", quantity: 1, unitMinor: 0 },
            ],
          })
        }
      >
        Add line item
      </Btn>
      {error ? (
        <p role="alert">{error}</p>
      ) : totals ? (
        <div className="wb-totals">
          <span>Subtotal {format(totals.subtotal)}</span>
          <span>Tax {format(totals.tax)}</span>
          <strong>Total {format(totals.total)}</strong>
        </div>
      ) : null}
    </section>
  );
}
function Evidence({
  items,
  save,
}: {
  items: EvidenceDraft[];
  save: (items: EvidenceDraft[]) => void;
}) {
  const [error, setError] = useState("");
  return (
    <section>
      <h3>Evidence register</h3>
      <form
        className="wb-evidence-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          if (!validHttpUrl(f.url)) {
            setError("Enter an HTTP or HTTPS source URL.");
            return;
          }
          save([
            ...items,
            {
              url: String(f.url || ""),
              excerpt: String(f.excerpt || ""),
              assessment: String(f.assessment || ""),
              id: id(),
              at: now(),
            },
          ]);
          e.currentTarget.reset();
          setError("");
        }}
      >
        <label>
          Source URL
          <input type="url" name="url" required />
        </label>
        <label>
          Excerpt
          <textarea name="excerpt" required />
        </label>
        <label>
          Assessment
          <select name="assessment">
            <option>Supports</option>
            <option>Contradicts</option>
            <option>Uncertain</option>
          </select>
        </label>
        <button className="button">Add evidence</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {items.map((i) => (
        <article className="wb-comment" key={i.id}>
          <a href={i.url} target="_blank" rel="noreferrer">
            {i.url}
          </a>
          <p>{i.excerpt}</p>
          <small>
            {i.assessment} · entered {new Date(i.at).toLocaleDateString()} · not
            independently verified
          </small>
          <Btn onClick={() => save(items.filter((x) => x.id !== i.id))}>
            Remove
          </Btn>
        </article>
      ))}
    </section>
  );
}
function Trials({
  items,
  save,
}: {
  items: TrialDraft[];
  save: (items: TrialDraft[]) => void;
}) {
  const counted = items.filter((i) => i.result !== "Excluded"),
    passes = counted.filter((i) => i.result === "Pass").length;
  return (
    <section>
      <h3>Manually entered trials</h3>
      <p>No benchmark has run. These records describe results you enter.</p>
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          save([
            ...items,
            {
              name: String(f.name || ""),
              result: String(f.result || ""),
              id: id(),
            },
          ]);
          e.currentTarget.reset();
        }}
      >
        <input
          name="name"
          aria-label="Trial name"
          placeholder="Trial / evidence reference"
          required
        />
        <select name="result" aria-label="Trial result">
          <option>Pass</option>
          <option>Fail</option>
          <option>Excluded</option>
        </select>
        <button className="button">Record trial</button>
      </form>
      <p>
        {passes} passes / {counted.length} counted trials ·{" "}
        {items.length - counted.length} exclusions ·{" "}
        {counted.length
          ? Math.round((passes / counted.length) * 100) + "% observed pass rate"
          : "No rate available"}
      </p>
      {items.map((i) => (
        <div className="wb-row" key={i.id}>
          <span>
            {i.name} — {i.result}
          </span>
          <Btn onClick={() => save(items.filter((x) => x.id !== i.id))}>
            Remove
          </Btn>
        </div>
      ))}
    </section>
  );
}
export function Workflow({
  graph,
  save,
  onRun,
  depth = 0,
}: {
  graph: Graph;
  save: (graph: Graph) => void;
  onRun: () => void;
  depth?: number;
}) {
  const [selected, setSelected] = useState(graph.nodes[0]?.id || ""),
    [mode, setMode] = useState("Graph");
  const node = graph.nodes.find((n) => n.id === selected),
    errors: string[] = validateGraph(graph);
  return (
    <section className="wb-workflow">
      <header className="wb-row">
        <div>
          <h3>Workflow studio</h3>
          <p>
            Explicit dependencies, bounded retries, and saved configuration
            versions.
          </p>
        </div>
        <Btn onClick={() => setMode(mode === "Graph" ? "List" : "Graph")}>
          {mode === "Graph" ? "List view" : "Graph view"}
        </Btn>
      </header>
      <div className="wb-actions">
        <Btn
          onClick={() => {
            const n = {
              id: id(),
              name: "New step",
              type: "Agent",
              timeout: 60,
              retries: 0,
            };
            save({ ...graph, nodes: [...graph.nodes, n] });
            setSelected(n.id);
          }}
        >
          Add node
        </Btn>
        <Btn disabled={!!errors.length || depth > 0} onClick={onRun}>
          {depth > 0 ? "Save from parent workflow" : "Save workflow version"}
        </Btn>
      </div>
      {mode === "Graph" && (
        <WorkflowCanvas
          graph={graph}
          selected={selected}
          select={setSelected}
          save={save}
        />
      )}
      <div
        className={"wb-graph " + (mode === "List" ? "list" : "")}
        aria-label="Workflow nodes"
      >
        {graph.nodes.map((n, i) => (
          <button
            key={n.id}
            className={selected === n.id ? "active" : ""}
            onClick={() => setSelected(n.id)}
          >
            <span className="wb-node-type">{n.type}</span>
            <strong>
              {i + 1}. {n.name}
            </strong>
            <small>
              {graph.edges
                .filter((e) => e.to === n.id)
                .map((e) => graph.nodes.find((x) => x.id === e.from)?.name)
                .join(" + ") || "Entry node"}{" "}
              → {n.name}
            </small>
          </button>
        ))}
      </div>
      {node && (
        <div className="wb-node-editor">
          <Field
            label="Step name"
            value={node.name}
            onChange={(name) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, name } : n,
                ),
              })
            }
          />
          <Field
            label="Node type"
            value={node.type}
            options={
              depth >= 4 ? nodeTypes.filter((t) => t !== "Subflow") : nodeTypes
            }
            onChange={(type) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id
                    ? {
                        ...n,
                        type,
                        ...(type === "Subflow" && !n.subflow
                          ? { subflow: makeGraph() }
                          : {}),
                      }
                    : n,
                ),
              })
            }
          />
          {(["inputPorts", "outputPorts"] as const).map((key) => (
            <section key={key} className="exp-panel">
              <h4>
                {key === "inputPorts"
                  ? "Named input ports"
                  : "Named output ports"}
              </h4>
              {(node[key] || []).map((p, index) => (
                <div className="profile-fields" key={index}>
                  <Field
                    label={`Port ${index + 1} name`}
                    value={p.name}
                    onChange={(name) =>
                      save({
                        ...graph,
                        nodes: graph.nodes.map((n) =>
                          n.id === node.id
                            ? {
                                ...n,
                                [key]: (n[key] || []).map((port, i) =>
                                  i === index ? { ...port, name } : port,
                                ),
                              }
                            : n,
                        ),
                      })
                    }
                  />
                  <Field
                    label={`Port ${index + 1} type`}
                    value={p.type}
                    options={[
                      "Any",
                      "Text",
                      "Object",
                      "Array",
                      "Number",
                      "Boolean",
                    ]}
                    onChange={(type) =>
                      save({
                        ...graph,
                        nodes: graph.nodes.map((n) =>
                          n.id === node.id
                            ? {
                                ...n,
                                [key]: (n[key] || []).map((port, i) =>
                                  i === index ? { ...port, type } : port,
                                ),
                              }
                            : n,
                        ),
                      })
                    }
                  />
                  <Btn
                    onClick={() =>
                      save({
                        ...graph,
                        nodes: graph.nodes.map((n) =>
                          n.id === node.id
                            ? {
                                ...n,
                                [key]: (n[key] || []).filter(
                                  (_, i) => i !== index,
                                ),
                              }
                            : n,
                        ),
                      })
                    }
                  >
                    Remove port {index + 1}
                  </Btn>
                </div>
              ))}
              <Btn
                disabled={(node[key] || []).length >= 50}
                onClick={() =>
                  save({
                    ...graph,
                    nodes: graph.nodes.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            [key]: [
                              ...(n[key] || []),
                              { name: "port_" + id().slice(0, 8), type: "Any" },
                            ],
                          }
                        : n,
                    ),
                  })
                }
              >
                Add {key === "inputPorts" ? "input" : "output"} port
              </Btn>
            </section>
          ))}
          {(["inputSchema", "outputSchema"] as const).map((key) => (
            <Field
              key={key}
              label={
                key === "inputSchema"
                  ? "Input schema (JSON)"
                  : "Output schema (JSON)"
              }
              type="textarea"
              value={node[key] || ""}
              onChange={(value) =>
                save({
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === node.id ? { ...n, [key]: value } : n,
                  ),
                })
              }
            />
          ))}
          <Field
            label="Input type"
            options={["Any", "Text", "Object", "Array", "Number", "Boolean"]}
            value={node.inputType || "Any"}
            onChange={(inputType) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, inputType } : n,
                ),
              })
            }
          />
          <Field
            label="Output type"
            options={["Any", "Text", "Object", "Array", "Number", "Boolean"]}
            value={node.outputType || "Any"}
            onChange={(outputType) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, outputType } : n,
                ),
              })
            }
          />
          <Field
            label="Failure behavior"
            options={[
              "Stop workflow",
              "Request human review",
              "Retry then stop",
              "Continue with failure output",
            ]}
            value={node.failureMode || "Stop workflow"}
            onChange={(failureMode) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, failureMode } : n,
                ),
              })
            }
          />
          <Field
            label="Idempotency key template"
            value={node.idempotencyKey || ""}
            onChange={(idempotencyKey) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, idempotencyKey } : n,
                ),
              })
            }
          />
          {node.type === "Branch" && (
            <Field
              label="Branch condition (expression draft)"
              value={node.condition || ""}
              onChange={(condition) =>
                save({
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === node.id ? { ...n, condition } : n,
                  ),
                })
              }
            />
          )}
          {node.type === "Parallel" && (
            <Field
              label="Concurrency limit"
              type="number"
              value={node.concurrency || 2}
              onChange={(v) =>
                save({
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === node.id ? { ...n, concurrency: Number(v) } : n,
                  ),
                })
              }
            />
          )}
          {node.type === "Merge" && (
            <Field
              label="Merge policy"
              options={[
                "Wait for all",
                "First successful",
                "Collect available",
              ]}
              value={node.mergePolicy || "Wait for all"}
              onChange={(mergePolicy) =>
                save({
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === node.id ? { ...n, mergePolicy } : n,
                  ),
                })
              }
            />
          )}
          {(["timeout", "retries"] as const).map((k) => (
            <Field
              key={k}
              label={k === "timeout" ? "Timeout (seconds)" : "Retries"}
              type="number"
              value={node[k]}
              onChange={(v) =>
                save({
                  ...graph,
                  nodes: graph.nodes.map((n) =>
                    n.id === node.id ? { ...n, [k]: Number(v) } : n,
                  ),
                })
              }
            />
          ))}
          <Btn
            onClick={() => {
              save({
                ...graph,
                nodes: graph.nodes.filter((n) => n.id !== node.id),
                edges: graph.edges.filter(
                  (e) => e.from !== node.id && e.to !== node.id,
                ),
              });
              setSelected("");
            }}
          >
            Delete step
          </Btn>
        </div>
      )}
      {node?.type === "Subflow" && node.subflow && depth < 4 && (
        <details className="exp-panel" open>
          <summary>Edit nested subflow · {node.name}</summary>
          <p>
            Contained configuration, saved with its parent. No execution occurs.
          </p>
          <Workflow
            key={node.id}
            graph={node.subflow}
            depth={depth + 1}
            onRun={onRun}
            save={(subflow) =>
              save({
                ...graph,
                nodes: graph.nodes.map((n) =>
                  n.id === node.id ? { ...n, subflow } : n,
                ),
              })
            }
          />
        </details>
      )}
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          const f = Object.fromEntries(new FormData(e.currentTarget));
          save({
            ...graph,
            edges: [
              ...graph.edges,
              {
                from: String(f.from || ""),
                to: String(f.to || ""),
                fromPort: String(f.fromPort || ""),
                toPort: String(f.toPort || ""),
              },
            ],
          });
        }}
      >
        <label>
          From
          <select name="from">
            {graph.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select name="to">
            {graph.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Output port (optional)
          <input
            name="fromPort"
            maxLength={50}
            placeholder="Leave blank for control flow"
          />
        </label>
        <label>
          Input port (optional)
          <input
            name="toPort"
            maxLength={50}
            placeholder="Exact destination port name"
          />
        </label>
        <button className="button" disabled={graph.nodes.length < 2}>
          Add dependency
        </button>
      </form>
      {graph.edges.map((e, i) => (
        <div className="wb-row" key={e.from + e.to + i}>
          <span>
            {graph.nodes.find((n) => n.id === e.from)?.name} →{" "}
            {graph.nodes.find((n) => n.id === e.to)?.name}
            {e.fromPort
              ? ` · ${e.fromPort} → ${e.toPort}`
              : " · control dependency"}
          </span>
          <Btn
            onClick={() =>
              save({ ...graph, edges: graph.edges.filter((_, j) => j !== i) })
            }
          >
            Remove edge
          </Btn>
        </div>
      ))}
      <div role="status" className={errors.length ? "wb-errors" : "notice"}>
        {errors.length
          ? errors.map((e) => <p key={e}>{e}</p>)
          : "Graph valid. Ready to save as a workflow version."}
      </div>
    </section>
  );
}
export function RunControl() {
  return (
    <section className="wb">
      <div className="wb-connection-empty">
        <span className="eyebrow">EXECUTION CENTER</span>
        <div className="wb-connection-symbol">↗</div>
        <h2>Give your work a place to run.</h2>
        <p>
          Your workflows and agent configurations are ready to shape here.
          Connect the Mindineers backend to start runs, inspect real outputs,
          review tool requests, and control execution.
        </p>
        <div className="wb-actions">
          <a className="button dark" href="#workflows">
            Build a workflow
          </a>
          <a className="button" href="#integrations">
            Connection settings
          </a>
        </div>
        <div className="wb-capability-grid">
          {[
            ["Run timeline", "Trace actual task progress and tool activity."],
            ["Human decisions", "Review the exact action before approval."],
            [
              "Pause and recovery",
              "Control execution through acknowledged server actions.",
            ],
          ].map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
              <span className="badge">Backend required</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
