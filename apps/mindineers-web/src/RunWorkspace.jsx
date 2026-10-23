import React, { useState } from "react";
import { Button, Tabs, Empty, useCollection } from "./ProductUI";
import { download } from "./product-model";
export const exampleRun = {
  id: "example-run",
  name: "Research brief · example",
  mode: "Example trace",
  status: "Awaiting review",
  startedAt: "2026-10-23T09:00:00Z",
  nodes: [
    {
      id: "n1",
      name: "Collect sources",
      agent: "Atlas",
      state: "Completed",
      dependencies: [],
    },
    {
      id: "n2",
      name: "Draft brief",
      agent: "Nova",
      state: "Completed",
      dependencies: ["n1"],
    },
    {
      id: "n3",
      name: "Review evidence",
      agent: "Human reviewer",
      state: "Awaiting review",
      dependencies: ["n2"],
    },
    {
      id: "n4",
      name: "Deliver brief",
      agent: "Sage",
      state: "Not started",
      dependencies: ["n3"],
    },
  ],
  events: [
    {
      id: "e1",
      at: "2026-10-23T09:00:00Z",
      level: "Info",
      node: "n1",
      message: "Example: source collection started.",
    },
    {
      id: "e2",
      at: "2026-10-23T09:02:00Z",
      level: "Info",
      node: "n1",
      message: "Example: references collected.",
    },
    {
      id: "e3",
      at: "2026-10-23T09:04:00Z",
      level: "Info",
      node: "n2",
      message: "Example: brief draft created.",
    },
    {
      id: "e4",
      at: "2026-10-23T09:05:00Z",
      level: "Review",
      node: "n3",
      message: "Example: waiting for human evidence review.",
    },
  ],
  artifacts: [
    {
      id: "a1",
      name: "Research brief draft",
      type: "Document",
      content:
        "# Example research brief\n\nThis sample illustrates how run artifacts will appear. It is not a generated research result.",
    },
  ],
  checkpoints: [
    {
      id: "c1",
      name: "After source collection",
      at: "2026-10-23T09:02:00Z",
      node: "n1",
    },
  ],
};
export function validateTrace(v) {
  const str = (x) => typeof x === "string";
  if (
    !v ||
    !["id", "name", "mode", "status", "startedAt"].every((k) => str(v[k]))
  )
    throw new Error("Trace metadata is invalid.");
  if (
    !Array.isArray(v.nodes) ||
    v.nodes.length > 500 ||
    !v.nodes.every(
      (n) =>
        ["id", "name", "agent", "state"].every((k) => str(n[k])) &&
        Array.isArray(n.dependencies) &&
        n.dependencies.every(str),
    )
  )
    throw new Error("Trace nodes are invalid.");
  if (
    !Array.isArray(v.events) ||
    v.events.length > 10000 ||
    !v.events.every((e) =>
      ["id", "at", "level", "node", "message"].every((k) => str(e[k])),
    )
  )
    throw new Error("Trace events are invalid.");
  if (
    !Array.isArray(v.artifacts) ||
    !v.artifacts.every((a) =>
      ["id", "name", "type", "content"].every((k) => str(a[k])),
    )
  )
    throw new Error("Trace artifacts are invalid.");
  if (
    !Array.isArray(v.checkpoints) ||
    !v.checkpoints.every((c) =>
      ["id", "name", "at", "node"].every((k) => str(c[k])),
    )
  )
    throw new Error("Trace checkpoints are invalid.");
  return v;
}
export default function RunWorkspace({ data, update, route }) {
  const [traces, setTraces] = useCollection(data, update, "traces"),
    [example, setExample] = useState(false),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("Graph"),
    [node, setNode] = useState(""),
    [query, setQuery] = useState(""),
    [level, setLevel] = useState("All"),
    [error, setError] = useState("");
  const run = example
      ? exampleRun
      : traces.find((t) => t.id === selected) || traces[0],
    worker = run?.nodes.find((n) => n.id === node);
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">
            {route === "observability" ? "OBSERVABILITY" : "RUN CONTROL"}
          </span>
          <h2>Follow the work, step by step.</h2>
          <p>
            Inspect task dependencies, worker states, events, artifacts, and
            checkpoints.
          </p>
        </div>
        <div className="wb-actions">
          <Button
            onClick={() => {
              setExample(!example);
              setNode("");
            }}
          >
            {example ? "Leave example" : "View example trace"}
          </Button>
          <label className="button">
            Import trace
            <input
              hidden
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files[0];
                e.target.value = "";
                if (!file) return;
                try {
                  if (file.size > 5 * 1024 * 1024)
                    throw new Error("Trace must be smaller than 5 MB.");
                  const trace = validateTrace(JSON.parse(await file.text()));
                  const imported = { ...trace, mode: "Imported trace" };
                  setTraces((rows) => [
                    imported,
                    ...rows.filter((r) => r.id !== trace.id),
                  ]);
                  setSelected(trace.id);
                  setExample(false);
                  setError("");
                } catch (err) {
                  setError(err.message);
                }
              }}
            />
          </label>
        </div>
      </div>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {run ? (
        <>
          <div className="run-status-bar">
            <div>
              <span className="badge">{run.mode}</span>
              <h2>{run.name}</h2>
              <span>
                {run.status} · started{" "}
                {new Date(run.startedAt).toLocaleString()}
              </span>
            </div>
            <div className="wb-actions">
              <Button disabled>Pause</Button>
              <Button disabled>Resume</Button>
              <Button disabled>Cancel</Button>
              <Button onClick={() => download("run-trace.json", run)}>
                Export trace
              </Button>
            </div>
          </div>
          <p className="notice">
            {example
              ? "This is an illustrative trace. No agents executed these steps."
              : "Imported records are supplied evidence and have not been authenticated."}{" "}
            Live controls require an authorized runtime connection.
          </p>
          <Tabs
            values={["Graph", "Events", "Artifacts", "Checkpoints"]}
            value={tab}
            onChange={setTab}
          />
          {tab === "Graph" ? (
            <>
              <div className="run-graph">
                {run.nodes.map((n, i) => (
                  <button
                    key={n.id}
                    className={"run-node " + (node === n.id ? "active" : "")}
                    onClick={() => setNode(n.id)}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <h3>{n.name}</h3>
                    <small>{n.agent}</small>
                    <p className="badge">{n.state}</p>
                    <small>
                      Depends on:{" "}
                      {n.dependencies
                        .map(
                          (id) =>
                            run.nodes.find((n) => n.id === id)?.name || id,
                        )
                        .join(", ") || "Entry point"}
                    </small>
                  </button>
                ))}
              </div>
              {worker && (
                <article className="panel">
                  <div className="wb-row">
                    <h3>{worker.name}</h3>
                    <Button
                      onClick={() => {
                        setQuery(worker.id);
                        setTab("Events");
                      }}
                    >
                      Inspect events
                    </Button>
                  </div>
                  <p>Assigned worker: {worker.agent}</p>
                  <p>Recorded state: {worker.state}</p>
                </article>
              )}
            </>
          ) : tab === "Events" ? (
            <>
              <div className="mission-filters">
                <input
                  aria-label="Search events"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search event text or node ID…"
                />
                <select
                  aria-label="Event level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {["All", ...new Set(run.events.map((e) => e.level))].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </div>
              {run.events
                .filter(
                  (e) =>
                    (level === "All" || level === e.level) &&
                    (e.message + " " + e.node)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map((e) => (
                  <div className="run-event" key={e.id}>
                    <time>{new Date(e.at).toLocaleTimeString()}</time>
                    <span className="badge">{e.level}</span>
                    <div>
                      <strong>
                        {run.nodes.find((n) => n.id === e.node)?.name || e.node}
                      </strong>
                      <p>{e.message}</p>
                    </div>
                  </div>
                ))}
            </>
          ) : tab === "Artifacts" ? (
            <div className="product-cards">
              {run.artifacts.map((a) => (
                <article className="panel" key={a.id}>
                  <span className="badge">{a.type}</span>
                  <h3>{a.name}</h3>
                  <pre className="product-code">{a.content}</pre>
                  <Button
                    onClick={() =>
                      download(a.name + ".txt", a.content, "text/plain")
                    }
                  >
                    Download artifact
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            run.checkpoints.map((c) => (
              <div className="panel wb-row" key={c.id}>
                <div>
                  <h3>{c.name}</h3>
                  <small>
                    {new Date(c.at).toLocaleString()} · {c.node}
                  </small>
                </div>
                <Button disabled>Fork from checkpoint</Button>
              </div>
            ))
          )}
        </>
      ) : (
        <Empty title="Your execution history starts here.">
          View the example trace or import a run record. Live activity will
          arrive through the backend.
        </Empty>
      )}
      {!!traces.length && (
        <div className="document-tools">
          {traces.map((t) => (
            <Button
              key={t.id}
              onClick={() => {
                setSelected(t.id);
                setExample(false);
                setNode("");
              }}
            >
              {t.name}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
