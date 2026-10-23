import React, { useState, useRef } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download, cellValue } from "./product-model";
export default function DocumentsStudio({ data, update }) {
  const [docs, setDocs] = useCollection(data, update, "documents"),
    [selected, setSelected] = useState(""),
    [mode, setMode] = useState("Write"),
    [query, setQuery] = useState("");
  const doc = docs.find((d) => d.id === selected) || docs[0];
  const patch = (change) =>
    setDocs((rows) =>
      rows.map((d) =>
        d.id === doc.id
          ? { ...d, ...change, updatedAt: new Date().toISOString() }
          : d,
      ),
    );
  const create = (kind) => {
    const record = {
      id: uid(),
      name:
        kind === "Document"
          ? "Untitled document"
          : kind === "Sheet"
            ? "Untitled sheet"
            : "Untitled presentation",
      kind,
      body: "",
      rows: Array.from({ length: 8 }, () => Array(5).fill("")),
      slides: [{ id: uid(), title: "Your next idea", body: "", notes: "" }],
      comments: [],
      versions: [],
      updatedAt: new Date().toISOString(),
    };
    setDocs((rows) => [record, ...rows]);
    setSelected(record.id);
    setMode("Write");
  };
  const checkpoint = () =>
    patch({
      versions: [
        {
          id: uid(),
          at: new Date().toISOString(),
          body: doc.body,
          rows: structuredClone(doc.rows),
          slides: structuredClone(doc.slides),
        },
        ...doc.versions,
      ].slice(0, 50),
    });
  const legacy = data.records.documents || [];
  return (
    <section className="product-page">
      <div className="toolbar">
        <div className="wb-actions">
          {["Document", "Sheet", "Presentation"].map((k) => (
            <Button key={k} onClick={() => create(k)}>
              + {k}
            </Button>
          ))}
        </div>
        <span className="badge">Saved on this device</span>
      </div>
      <div className="product-split">
        <aside className="product-list">
          <input
            aria-label="Search documents"
            placeholder="Find your work…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {docs
            .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
            .map((d) => (
              <button
                className={doc?.id === d.id ? "active" : ""}
                key={d.id}
                onClick={() => {
                  setSelected(d.id);
                  setMode("Write");
                }}
              >
                <strong>{d.name}</strong>
                <small>{d.kind}</small>
              </button>
            ))}
          {!!legacy.length && (
            <details>
              <summary>Earlier documents</summary>
              {legacy.map((d) => (
                <Button
                  key={d.id}
                  onClick={() => {
                    const imported = {
                      id: uid(),
                      name: d.name,
                      kind: "Document",
                      body: d.description,
                      rows: [],
                      slides: [],
                      comments: [],
                      versions: [],
                      updatedAt: new Date().toISOString(),
                    };
                    setDocs((rows) => [imported, ...rows]);
                    setSelected(imported.id);
                  }}
                >
                  {d.name} · import copy
                </Button>
              ))}
            </details>
          )}
        </aside>
        {doc ? (
          <div className="product-detail">
            <div className="product-editor-title">
              <input
                aria-label="Document title"
                value={doc.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <div className="wb-actions">
                <Button onClick={checkpoint}>Save version</Button>
                <Button
                  onClick={() =>
                    download(
                      doc.name + (doc.kind === "Document" ? ".md" : ".json"),
                      doc.kind === "Document" ? doc.body : doc,
                      doc.kind === "Document"
                        ? "text/markdown"
                        : "application/json",
                    )
                  }
                >
                  Export
                </Button>
              </div>
            </div>
            <Tabs
              values={["Write", "Preview", "Comments", "Versions"]}
              value={mode}
              onChange={setMode}
            />
            {mode === "Comments" ? (
              <Comments doc={doc} patch={patch} />
            ) : mode === "Versions" ? (
              <Versions doc={doc} patch={patch} />
            ) : doc.kind === "Document" ? (
              <Writer doc={doc} patch={patch} preview={mode === "Preview"} />
            ) : doc.kind === "Sheet" ? (
              <Sheet doc={doc} patch={patch} preview={mode === "Preview"} />
            ) : (
              <Slides doc={doc} patch={patch} preview={mode === "Preview"} />
            )}
            <div className="product-save-state">
              Saved {new Date(doc.updatedAt).toLocaleString()} ·{" "}
              {doc.versions.length} checkpoints
            </div>
          </div>
        ) : (
          <Empty title="Make space for an idea.">
            Create a document, a working sheet, or a presentation.
          </Empty>
        )}
      </div>
    </section>
  );
}
function Writer({ doc, patch, preview }) {
  const ref = useRef();
  const wrap = (before, after = "") => {
    const el = ref.current,
      start = el.selectionStart,
      end = el.selectionEnd;
    patch({
      body:
        doc.body.slice(0, start) +
        before +
        doc.body.slice(start, end) +
        after +
        doc.body.slice(end),
    });
  };
  return preview ? (
    <article className="document-paper">
      {doc.body
        .split("\n")
        .map((line, i) =>
          line.startsWith("# ") ? (
            <h1 key={i}>{line.slice(2)}</h1>
          ) : line.startsWith("## ") ? (
            <h2 key={i}>{line.slice(3)}</h2>
          ) : line.startsWith("- ") ? (
            <p key={i}>• {line.slice(2)}</p>
          ) : (
            <p key={i}>{line || "\u00a0"}</p>
          ),
        )}
    </article>
  ) : (
    <>
      <div className="document-tools">
        <Button onClick={() => wrap("# ")}>Heading</Button>
        <Button onClick={() => wrap("## ")}>Subheading</Button>
        <Button onClick={() => wrap("- ")}>List</Button>
        <Button onClick={() => wrap("**", "**")}>Bold markup</Button>
        <Button
          onClick={() => {
            const el = ref.current,
              text = doc.body.slice(el.selectionStart, el.selectionEnd);
            if (text)
              patch({
                comments: [
                  ...doc.comments,
                  {
                    id: uid(),
                    quote: text,
                    text: "Review this passage.",
                    resolved: false,
                    at: new Date().toISOString(),
                  },
                ],
              });
          }}
        >
          Comment on selection
        </Button>
      </div>
      <textarea
        ref={ref}
        className="document-writer"
        aria-label="Document content"
        placeholder="Start with a thought…"
        value={doc.body}
        onChange={(e) => patch({ body: e.target.value })}
      />
      <p className="muted">
        {doc.body.trim() ? doc.body.trim().split(/\s+/).length : 0} words ·
        Markdown source · selected text can be attached to a comment.
      </p>
    </>
  );
}
function Sheet({ doc, patch, preview }) {
  const [cell, setCell] = useState("A1");
  const cols = Math.max(5, ...doc.rows.map((r) => r.length));
  const result = (r, c) => {
    try {
      return cellValue(doc.rows, String.fromCharCode(65 + c) + (r + 1));
    } catch (e) {
      return "#ERROR: " + e.message;
    }
  };
  return (
    <>
      <div className="document-tools">
        <span className="badge">{cell}</span>
        <Button
          disabled={doc.rows.length >= 500}
          onClick={() => patch({ rows: [...doc.rows, Array(cols).fill("")] })}
        >
          Add row
        </Button>
        <Button
          disabled={cols >= 26}
          onClick={() => patch({ rows: doc.rows.map((r) => [...r, ""]) })}
        >
          Add column
        </Button>
        <Button
          onClick={() =>
            download(
              doc.name + ".tsv",
              doc.rows
                .map((r) =>
                  r
                    .map((v) => v.replaceAll("\t", " ").replaceAll("\n", " "))
                    .join("\t"),
                )
                .join("\n"),
              "text/tab-separated-values",
            )
          }
        >
          Export TSV
        </Button>
      </div>
      <p className="muted">
        Formulas: =A1+B1, =A1*B1, =A1/B1, =SUM(A1:B3). Formulas are evaluated
        without executing code.
      </p>
      <div className="sheet-scroll">
        <table className="product-sheet">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: cols }, (_, c) => (
                <th key={c}>{String.fromCharCode(65 + c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.rows.map((row, r) => (
              <tr key={r}>
                <th>{r + 1}</th>
                {Array.from({ length: cols }, (_, c) => (
                  <td key={c}>
                    {preview ? (
                      <span>{result(r, c)}</span>
                    ) : (
                      <input
                        aria-label={String.fromCharCode(65 + c) + (r + 1)}
                        title={result(r, c)}
                        value={row[c] || ""}
                        onFocus={() =>
                          setCell(String.fromCharCode(65 + c) + (r + 1))
                        }
                        onChange={(e) =>
                          patch({
                            rows: doc.rows.map((row, i) =>
                              i === r
                                ? Array.from({ length: cols }, (_, j) =>
                                    j === c ? e.target.value : row[j] || "",
                                  )
                                : row,
                            ),
                          })
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Slides({ doc, patch, preview }) {
  const [selected, setSelected] = useState(0),
    index = Math.min(selected, doc.slides.length - 1),
    slide = doc.slides[index];
  const set = (key, value) =>
    patch({
      slides: doc.slides.map((s, i) =>
        i === index ? { ...s, [key]: value } : s,
      ),
    });
  return (
    <div className="slides-layout">
      <aside>
        {doc.slides.map((s, i) => (
          <button
            key={s.id}
            className={index === i ? "active" : ""}
            onClick={() => setSelected(i)}
          >
            <span>{i + 1}</span>
            {s.title || "Untitled"}
          </button>
        ))}
        <Button
          onClick={() => {
            patch({
              slides: [
                ...doc.slides,
                { id: uid(), title: "New slide", body: "", notes: "" },
              ],
            });
            setSelected(doc.slides.length);
          }}
        >
          + Slide
        </Button>
      </aside>
      <div>
        {preview ? (
          <article className="slide-canvas">
            <span className="eyebrow">{doc.name}</span>
            <h1>{slide.title}</h1>
            <p>{slide.body}</p>
            <small>
              {index + 1} / {doc.slides.length}
            </small>
          </article>
        ) : (
          <>
            <Field
              label="Slide title"
              value={slide.title}
              onChange={(v) => set("title", v)}
            />
            <Field
              label="Slide content"
              type="textarea"
              value={slide.body}
              onChange={(v) => set("body", v)}
            />
            <Field
              label="Speaker notes"
              type="textarea"
              value={slide.notes}
              onChange={(v) => set("notes", v)}
            />
            <div className="wb-actions">
              <Button
                disabled={!index}
                onClick={() => {
                  const slides = [...doc.slides];
                  [slides[index - 1], slides[index]] = [
                    slides[index],
                    slides[index - 1],
                  ];
                  patch({ slides });
                  setSelected(index - 1);
                }}
              >
                Move earlier
              </Button>
              <Button
                disabled={doc.slides.length === 1}
                onClick={() =>
                  patch({ slides: doc.slides.filter((_, i) => i !== index) })
                }
              >
                Remove slide
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function Comments({ doc, patch }) {
  const [text, setText] = useState("");
  return (
    <>
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          patch({
            comments: [
              ...doc.comments,
              {
                id: uid(),
                quote: "",
                text: text.trim(),
                resolved: false,
                at: new Date().toISOString(),
              },
            ],
          });
          setText("");
        }}
      >
        <input
          aria-label="New document comment"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="button">Add comment</button>
      </form>
      {doc.comments.map((c) => (
        <article className="wb-comment" key={c.id}>
          {c.quote && <blockquote>{c.quote}</blockquote>}
          <Field
            label="Comment"
            type="textarea"
            value={c.text}
            onChange={(text) =>
              patch({
                comments: doc.comments.map((x) =>
                  x.id === c.id ? { ...x, text } : x,
                ),
              })
            }
          />
          <Button
            onClick={() =>
              patch({
                comments: doc.comments.map((x) =>
                  x.id === c.id ? { ...x, resolved: !x.resolved } : x,
                ),
              })
            }
          >
            {c.resolved ? "Reopen" : "Resolve"}
          </Button>
          <small>
            {c.resolved ? "Resolved" : "Open"} ·{" "}
            {new Date(c.at).toLocaleString()}
          </small>
        </article>
      ))}
    </>
  );
}
function Versions({ doc, patch }) {
  const [compare, setCompare] = useState(null);
  return (
    <>
      {doc.versions.map((v, i) => (
        <div className="wb-row" key={v.id}>
          <span>
            Version {doc.versions.length - i} ·{" "}
            {new Date(v.at).toLocaleString()}
          </span>
          <div className="wb-actions">
            <Button onClick={() => setCompare(v)}>Compare</Button>
            <Button
              onClick={() =>
                patch({
                  body: v.body,
                  rows: structuredClone(v.rows),
                  slides: structuredClone(v.slides),
                  versions: [
                    {
                      id: uid(),
                      at: new Date().toISOString(),
                      body: doc.body,
                      rows: structuredClone(doc.rows),
                      slides: structuredClone(doc.slides),
                    },
                    ...doc.versions,
                  ].slice(0, 50),
                })
              }
            >
              Restore
            </Button>
          </div>
        </div>
      ))}
      {!doc.versions.length && (
        <Empty title="A checkpoint for your thinking.">
          Save a version before making a substantial change.
        </Empty>
      )}
      {compare && (
        <div className="wb-comparison">
          <div>
            <h3>Saved version</h3>
            <pre className="product-code">
              {doc.kind === "Document"
                ? compare.body
                : JSON.stringify(
                    doc.kind === "Sheet" ? compare.rows : compare.slides,
                    null,
                    2,
                  )}
            </pre>
          </div>
          <div>
            <h3>Current version</h3>
            <pre className="product-code">
              {doc.kind === "Document"
                ? doc.body
                : JSON.stringify(
                    doc.kind === "Sheet" ? doc.rows : doc.slides,
                    null,
                    2,
                  )}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
