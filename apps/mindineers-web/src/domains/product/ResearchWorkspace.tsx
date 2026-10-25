import { useState } from "react";
import { Button, Field, Empty, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import type { ResearchBrief, ResearchClaim } from "./model";
import { researchDocument, researchErrors, researchSnapshot } from "./model";
export default function ResearchWorkspace({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [briefs, setBriefs] = useCollection(data, update, "researchBriefs"),
    [selected, select] = useState(""),
    [message, setMessage] = useState("");
  const brief = briefs.find((b) => b.id === selected) ?? briefs[0],
    sources = data.product?.sources ?? [];
  const patch = (fields: Partial<ResearchBrief>) =>
    setBriefs((all) =>
      all.map((b) =>
        b.id === brief?.id
          ? { ...b, ...fields, state: "Draft", snapshot: "" }
          : b,
      ),
    );
  const errors = brief ? researchErrors(brief, sources) : [],
    current = brief ? researchSnapshot(brief, sources) : "";
  const claimPatch = (id: string, fields: Partial<ResearchClaim>) =>
    brief &&
    patch({
      claims: brief.claims.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    });
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">RESEARCH DESK</span>
          <h2>Turn evidence into a defensible brief.</h2>
          <p>
            Trace conclusions to exact source excerpts, expose contradictions,
            and preserve the reviewed version in Documents.
          </p>
        </div>
        <Button
          onClick={() => {
            const b: ResearchBrief = {
              id: crypto.randomUUID(),
              name: "Untitled research brief",
              question: "",
              conclusion: "",
              limitations: "",
              claims: [],
              state: "Draft",
              snapshot: "",
            };
            setBriefs((all) => [b, ...all]);
            select(b.id);
          }}
        >
          + Research brief
        </Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {briefs.map((b) => (
            <button
              key={b.id}
              onClick={() => select(b.id)}
              className={b.id === brief?.id ? "active" : ""}
            >
              <strong>{b.name}</strong>
              <small>{b.state}</small>
            </button>
          ))}
        </aside>
        {brief ? (
          <article className="product-detail">
            <Field
              label="Brief title"
              value={brief.name}
              onChange={(name) => patch({ name })}
            />
            <Field
              label="Research question"
              type="textarea"
              value={brief.question}
              onChange={(question) => patch({ question })}
            />
            <h3>Claims and evidence</h3>
            <p>
              Quotes must match current source text exactly. Source changes
              invalidate the previous review.
            </p>
            <a href="#knowledge">Manage or ingest sources in Knowledge</a>
            {brief.claims.map((c) => (
              <section className="panel" key={c.id}>
                <Field
                  label="Claim"
                  value={c.text}
                  onChange={(text) => claimPatch(c.id, { text })}
                />
                <label className="product-field">
                  Source
                  <select
                    value={c.sourceId}
                    onChange={(e) =>
                      claimPatch(c.id, { sourceId: e.target.value, quote: "" })
                    }
                  >
                    <option value="">Select source</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.state === "Archived" ? " (archived)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <blockquote className="knowledge-excerpt">
                  {sources.find((s) => s.id === c.sourceId)?.excerpt ||
                    "Source missing or not selected."}
                </blockquote>
                <Field
                  label="Exact quoted evidence"
                  type="textarea"
                  value={c.quote}
                  onChange={(quote) => claimPatch(c.id, { quote })}
                />
                <Field
                  label="Relationship to conclusion"
                  options={["Supports", "Contradicts", "Context"]}
                  value={c.stance}
                  onChange={(stance) =>
                    claimPatch(c.id, {
                      stance: stance as ResearchClaim["stance"],
                    })
                  }
                />
                <Button
                  onClick={() =>
                    patch({ claims: brief.claims.filter((x) => x.id !== c.id) })
                  }
                >
                  Remove claim
                </Button>
              </section>
            ))}
            <Button
              onClick={() =>
                patch({
                  claims: [
                    ...brief.claims,
                    {
                      id: crypto.randomUUID(),
                      text: "",
                      sourceId: "",
                      quote: "",
                      stance: "Supports",
                    },
                  ],
                })
              }
            >
              + Claim
            </Button>
            <Field
              label="Conclusion / synthesis"
              type="textarea"
              value={brief.conclusion}
              onChange={(conclusion) => patch({ conclusion })}
            />
            <Field
              label="Limitations, conflicting evidence and unresolved questions"
              type="textarea"
              value={brief.limitations}
              onChange={(limitations) => patch({ limitations })}
            />
            {errors.length > 0 && (
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <p>
              {brief.state === "Reviewed" && brief.snapshot !== current
                ? "Review is stale: source evidence changed."
                : brief.state}{" "}
              · {brief.claims.filter((c) => c.stance === "Contradicts").length}{" "}
              contradictory evidence entries
            </p>
            <Button
              disabled={errors.length > 0}
              onClick={() => {
                setBriefs((all) =>
                  all.map((b) =>
                    b.id === brief.id
                      ? { ...b, state: "Reviewed", snapshot: current }
                      : b,
                  ),
                );
                setMessage(
                  "Current evidence and brief marked reviewed locally.",
                );
              }}
            >
              Mark current revision reviewed
            </Button>
            <Button
              disabled={
                brief.state !== "Reviewed" ||
                brief.snapshot !== current ||
                errors.length > 0
              }
              onClick={() => {
                try {
                  const doc = researchDocument(brief, sources);
                  update((old) => ({
                    ...old,
                    product: {
                      ...old.product,
                      documents: [...(old.product?.documents ?? []), doc],
                    },
                  }));
                  setMessage(
                    "A separate evidence snapshot was created in Documents.",
                  );
                } catch (e) {
                  setMessage(
                    e instanceof Error
                      ? e.message
                      : "Unable to create document.",
                  );
                }
              }}
            >
              Create document from reviewed brief
            </Button>
            <p className="muted">
              This workspace does not perform web searches or generate
              conclusions automatically.
            </p>
          </article>
        ) : (
          <Empty title="Start with a question.">
            Create a brief, add sources and review your evidence before handing
            off a document.
          </Empty>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
