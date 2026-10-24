import React, { useState } from "react";
import { Button, Field, Empty, useCollection } from "./ProductUI";
import { uid } from "./product-model";
export default function EvidenceMap({ data, update }) {
  const sources = (data.product?.sources || []).filter(
      (s) => s.state !== "Archived",
    ),
    [links, setLinks] = useCollection(data, update, "evidenceLinks"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [relation, setRelation] = useState("Supports"),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [focus, setFocus] = useState("All");
  const nodes = sources.slice(0, 20),
    positions = new Map(
      nodes.map((s, i) => [
        s.id,
        {
          x: 300 + 230 * Math.cos((2 * Math.PI * i) / nodes.length),
          y: 220 + 160 * Math.sin((2 * Math.PI * i) / nodes.length),
        },
      ]),
    );
  const active = links.filter(
    (l) =>
      sources.some((s) => s.id === l.from) &&
      sources.some((s) => s.id === l.to) &&
      (focus === "All" || l.relation === focus),
  );
  return (
    <section>
      <h2>Evidence relationships</h2>
      <p>
        Connect supporting and conflicting sources with a reason. Links
        represent your assessment; they do not establish that a claim is true.
      </p>
      <Field
        label="Relationship filter"
        value={focus}
        options={["All", "Supports", "Contradicts", "Related"]}
        onChange={setFocus}
      />
      {sources.length ? (
        <>
          <svg
            className="evidence-map"
            viewBox="0 0 600 440"
            role="img"
            aria-label="Evidence relationship map. Full source names and relationship descriptions appear below."
          >
            {active.map((l) => {
              const a = positions.get(l.from),
                b = positions.get(l.to);
              return a && b ? (
                <line
                  key={l.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={
                    l.relation === "Contradicts" ? "#bf594a" : "currentColor"
                  }
                  strokeDasharray={l.relation === "Related" ? "5 5" : undefined}
                />
              ) : null;
            })}
            {nodes.map((s, i) => {
              const p = positions.get(s.id);
              return (
                <g key={s.id}>
                  <circle cx={p.x} cy={p.y} r="18" />
                  <text x={p.x} y={p.y + 5} textAnchor="middle">
                    {i + 1}
                  </text>
                  <text
                    className="evidence-label"
                    x={p.x}
                    y={p.y + 36}
                    textAnchor="middle"
                  >
                    {s.name.length > 20 ? s.name.slice(0, 19) + "…" : s.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="muted">
            Map shows the first 20 active sources; the list includes all
            matching relationships. Contradictions use red lines; related
            sources use dashed lines.
          </p>
        </>
      ) : (
        <Empty title="Add sources to connect evidence.">
          Create at least two sources in the Sources tab.
        </Empty>
      )}
      <div className="business-grid">
        {[
          ["From source", from, setFrom],
          ["To source", to, setTo],
        ].map(([label, value, set]) => (
          <label className="product-field" key={label}>
            {label}
            <select value={value} onChange={(e) => set(e.target.value)}>
              <option value="">Select source</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <Field
        label="Relationship"
        value={relation}
        options={["Supports", "Contradicts", "Related"]}
        onChange={setRelation}
      />
      <Field
        label="Reason and relevant excerpts"
        type="textarea"
        value={reason}
        onChange={setReason}
      />
      <Button
        onClick={() => {
          if (
            !sources.some((s) => s.id === from) ||
            !sources.some((s) => s.id === to) ||
            from === to ||
            !reason.trim()
          ) {
            setMessage(
              "Choose two different active sources and explain the relationship.",
            );
            return;
          }
          if (
            links.some(
              (l) => l.from === from && l.to === to && l.relation === relation,
            )
          ) {
            setMessage("That relationship already exists.");
            return;
          }
          setLinks((rows) => [
            ...rows,
            {
              id: uid(),
              from,
              to,
              relation,
              reason,
              at: new Date().toISOString(),
              resolved: false,
              resolution: "",
            },
          ]);
          setReason("");
          setMessage("Evidence relationship saved.");
        }}
      >
        Save relationship
      </Button>
      {message && <p role="status">{message}</p>}
      {active.map((l) => (
        <article className="panel" key={l.id}>
          <h3>
            {sources.find((s) => s.id === l.from)?.name} →{" "}
            {l.relation.toLowerCase()} →{" "}
            {sources.find((s) => s.id === l.to)?.name}
          </h3>
          <p>{l.reason}</p>
          <small>{l.at}</small>
          {l.relation === "Contradicts" && (
            <>
              <Field
                label="Resolution / further evidence"
                value={l.resolution}
                onChange={(resolution) =>
                  setLinks((rows) =>
                    rows.map((x) =>
                      x.id === l.id
                        ? {
                            ...x,
                            resolution,
                            ...(!resolution.trim() ? { resolved: false } : {}),
                          }
                        : x,
                    ),
                  )
                }
              />
              <label className="business-check">
                <input
                  type="checkbox"
                  checked={l.resolved}
                  disabled={!l.resolution.trim()}
                  onChange={(e) =>
                    setLinks((rows) =>
                      rows.map((x) =>
                        x.id === l.id
                          ? { ...x, resolved: e.target.checked }
                          : x,
                      ),
                    )
                  }
                />
                Resolution documented
              </label>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
