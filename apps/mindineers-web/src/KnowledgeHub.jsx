import React, { useState } from "react";
import { Button, Field, Dialog, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
import { validHttpUrl } from "./workbench-model";
export default function KnowledgeHub({ data, update }) {
  const [sources, setSources] = useCollection(data, update, "sources"),
    [memories, setMemories] = useCollection(data, update, "memories"),
    [tab, setTab] = useState("Sources"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState("");
  const source = sources.find((s) => s.id === selected);
  const create = () =>
    setEditing(
      tab === "Memory"
        ? {
            id: uid(),
            kind: "memory",
            name: "",
            statement: "",
            type: "Preference",
            scope: "Workspace",
            evidence: "",
            state: "Needs confirmation",
            expires: "",
          }
        : {
            id: uid(),
            kind: "source",
            name: "",
            url: "",
            excerpt: "",
            collection: "General",
            scope: "Workspace",
            state: "Reference only",
            retrievedAt: new Date().toISOString().slice(0, 10),
            notes: "",
          },
    );
  const searchText = query.trim().toLowerCase();
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">CONTEXT WITH PROVENANCE</span>
          <h2>Know where an answer comes from.</h2>
          <p>
            Organize sources, inspect evidence, and decide what your workspace
            should remember.
          </p>
        </div>
        <Button onClick={create}>
          + {tab === "Memory" ? "Memory" : "Source"}
        </Button>
      </div>
      <Tabs
        values={["Sources", "Search", "Memory"]}
        value={tab}
        onChange={setTab}
      />
      <input
        className="product-search"
        aria-label="Search knowledge"
        placeholder="Search titles, excerpts, statements…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {tab === "Memory" ? (
        <div className="product-cards">
          {memories
            .filter(
              (m) =>
                m.state !== "Forgotten" &&
                (m.name + " " + m.statement).toLowerCase().includes(searchText),
            )
            .map((m) => (
              <article className="panel" key={m.id}>
                <span className="badge">
                  {m.type} · {m.state}
                </span>
                <h3>{m.name}</h3>
                <p>{m.statement}</p>
                <small>
                  {m.scope} · {m.expires ? "Expires " + m.expires : "No expiry"}
                </small>
                <details>
                  <summary>Evidence</summary>
                  <p>{m.evidence || "No evidence attached"}</p>
                </details>
                <div className="wb-actions">
                  <Button onClick={() => setEditing(m)}>Correct</Button>
                  {m.state !== "Confirmed" && (
                    <Button
                      onClick={() =>
                        setMemories((rows) =>
                          rows.map((x) =>
                            x.id === m.id ? { ...x, state: "Confirmed" } : x,
                          ),
                        )
                      }
                    >
                      Confirm
                    </Button>
                  )}
                  <Button
                    onClick={() =>
                      setMemories((rows) =>
                        rows.map((x) =>
                          x.id === m.id
                            ? {
                                ...x,
                                state: "Forgotten",
                                statement: "",
                                evidence: "",
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    Forget locally
                  </Button>
                </div>
              </article>
            ))}
        </div>
      ) : tab === "Search" ? (
        <>
          <p className="muted">
            Searches text stored on this device. Semantic retrieval and
            permission-filtered cloud search require the backend.
          </p>
          {sources
            .filter(
              (s) =>
                s.state !== "Archived" &&
                (s.name + " " + s.excerpt).toLowerCase().includes(searchText),
            )
            .map((s) => (
              <article className="panel knowledge-result" key={s.id}>
                <span className="badge">
                  {s.collection} · {s.scope}
                </span>
                <h3>{s.name}</h3>
                <p>{s.excerpt}</p>
                <div className="wb-row">
                  <span>Source entered {s.retrievedAt}</span>
                  {validHttpUrl(s.url) && (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      Open source ↗
                    </a>
                  )}
                </div>
                <small>
                  Match reason:{" "}
                  {searchText
                    ? "title or excerpt contains “" + query + "”"
                    : "all stored references"}
                </small>
              </article>
            ))}
        </>
      ) : (
        <div className="product-split">
          <aside className="product-list">
            {sources
              .filter((s) =>
                (s.name + " " + s.excerpt).toLowerCase().includes(searchText),
              )
              .map((s) => (
                <button
                  key={s.id}
                  className={s.id === selected ? "active" : ""}
                  onClick={() => setSelected(s.id)}
                >
                  <strong>{s.name}</strong>
                  <small>
                    {s.collection} · {s.state}
                  </small>
                </button>
              ))}
          </aside>
          {source ? (
            <article className="product-detail">
              <header className="wb-row">
                <h2>{source.name}</h2>
                <Button onClick={() => setEditing(source)}>Edit source</Button>
              </header>
              <dl className="product-facts">
                <dt>Collection</dt>
                <dd>{source.collection}</dd>
                <dt>Scope</dt>
                <dd>{source.scope}</dd>
                <dt>State</dt>
                <dd>{source.state}</dd>
                <dt>Retrieval date</dt>
                <dd>{source.retrievedAt}</dd>
                <dt>URL</dt>
                <dd>
                  {validHttpUrl(source.url) ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  ) : (
                    source.url || "No URL"
                  )}
                </dd>
              </dl>
              <h3>Source excerpt</h3>
              <blockquote className="knowledge-excerpt">
                {source.excerpt}
              </blockquote>
              <h3>Notes and limitations</h3>
              <p>{source.notes || "No notes added."}</p>
              <div className="wb-actions">
                <Button
                  onClick={() =>
                    setSources((rows) =>
                      rows.map((s) =>
                        s.id === source.id
                          ? {
                              ...s,
                              state:
                                s.state === "Archived"
                                  ? "Reference only"
                                  : "Archived",
                            }
                          : s,
                      ),
                    )
                  }
                >
                  {source.state === "Archived"
                    ? "Restore source"
                    : "Archive source"}
                </Button>
                <Button
                  onClick={() => download("knowledge-source.json", source)}
                >
                  Export source
                </Button>
              </div>
              <p className="notice">
                This reference is stored locally. No crawler, indexing job, or
                external sync has run.
              </p>
            </article>
          ) : (
            <Empty title="Context you can inspect.">
              Select a source to review its text, provenance, and access scope.
            </Empty>
          )}
        </div>
      )}
      {!sources.length && tab !== "Memory" && (
        <p className="muted">
          Add your first source to create a searchable reference.
        </p>
      )}
      {!memories.length && tab === "Memory" && (
        <Empty title="Memory should be intentional.">
          Record a preference, fact, or inference, then confirm its scope and
          evidence.
        </Empty>
      )}
      {editing && (
        <KnowledgeEditor
          record={editing}
          close={() => setEditing(null)}
          save={(record) => {
            const setter = record.kind === "memory" ? setMemories : setSources;
            setter((rows) =>
              rows.some((r) => r.id === record.id)
                ? rows.map((r) => (r.id === record.id ? record : r))
                : [record, ...rows],
            );
            setSelected(record.id);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
function KnowledgeEditor({ record, close, save }) {
  const [draft, setDraft] = useState(record),
    [error, setError] = useState("");
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <Dialog
      title={
        record.kind === "memory" ? "Memory and evidence" : "Source reference"
      }
      close={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.url && !validHttpUrl(draft.url)) {
            setError("Use an HTTP or HTTPS source URL.");
            return;
          }
          save(draft);
        }}
      >
        <Field
          label="Title"
          value={draft.name}
          required
          onChange={(v) => set("name", v)}
        />
        {record.kind === "memory" ? (
          <>
            <Field
              label="Statement"
              type="textarea"
              value={draft.statement}
              required
              onChange={(v) => set("statement", v)}
            />
            <Field
              label="Memory type"
              options={["Preference", "Fact", "Inference", "Temporary context"]}
              value={draft.type}
              onChange={(v) => set("type", v)}
            />
            <Field
              label="Evidence"
              type="textarea"
              value={draft.evidence}
              onChange={(v) => set("evidence", v)}
            />
            <Field
              label="Expires"
              type="date"
              value={draft.expires}
              onChange={(v) => set("expires", v)}
            />
          </>
        ) : (
          <>
            <Field
              label="Source URL"
              type="url"
              value={draft.url}
              onChange={(v) => set("url", v)}
            />
            <Field
              label="Excerpt"
              type="textarea"
              value={draft.excerpt}
              required
              onChange={(v) => set("excerpt", v)}
            />
            <Field
              label="Collection"
              value={draft.collection}
              onChange={(v) => set("collection", v)}
            />
            <Field
              label="Retrieved on"
              type="date"
              value={draft.retrievedAt}
              onChange={(v) => set("retrievedAt", v)}
            />
            <Field
              label="Notes and limitations"
              type="textarea"
              value={draft.notes}
              onChange={(v) => set("notes", v)}
            />
          </>
        )}
        <Field
          label="Scope"
          options={["Personal", "Workspace", "Project"]}
          value={draft.scope}
          onChange={(v) => set("scope", v)}
        />
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <Button onClick={close}>Cancel</Button>
          <button className="button dark">Save</button>
        </div>
      </form>
    </Dialog>
  );
}
