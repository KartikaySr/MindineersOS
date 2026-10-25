import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import type { IngestionDraft } from "./model";
import { ingestionChunks, importIngestion } from "./model";
export default function Ingestion({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [drafts, setDrafts] = useCollection(data, update, "ingestionDrafts"),
    [selected, select] = useState(""),
    [message, setMessage] = useState("");
  const draft = drafts.find((d) => d.id === selected) ?? drafts[0];
  const patch = (fields: Partial<IngestionDraft>) =>
    setDrafts((all) =>
      all.map((d) =>
        d.id === draft?.id && d.state === "Draft" ? { ...d, ...fields } : d,
      ),
    );
  const create = () => {
    const d: IngestionDraft = {
      id: crypto.randomUUID(),
      name: "New text source",
      origin: "",
      scope: "Workspace",
      content: "",
      state: "Draft",
      sourceIds: [],
      at: new Date().toISOString(),
    };
    setDrafts((all) => [d, ...all]);
    select(d.id);
  };
  let chunks: string[] = [],
    error = "";
  try {
    if (draft) chunks = ingestionChunks(draft.content);
  } catch (e) {
    error = e instanceof Error ? e.message : "Invalid text";
  }
  return (
    <section>
      <div className="toolbar">
        <h3>Ingest supplied text</h3>
        <Button onClick={create}>+ Ingestion draft</Button>
      </div>
      <p>
        Review plain text or Markdown before adding searchable excerpts. This
        imports locally; crawling, embeddings and provider sync require a
        connected backend.
      </p>
      <div className="document-tools">
        {drafts.map((d) => (
          <Button key={d.id} onClick={() => select(d.id)}>
            {d.name} · {d.state}
          </Button>
        ))}
      </div>
      {draft && (
        <>
          <Field
            label="Source title"
            value={draft.name}
            disabled={draft.state !== "Draft"}
            onChange={(name) => patch({ name })}
          />
          <Field
            label="Source URL (optional)"
            value={draft.origin}
            disabled={draft.state !== "Draft"}
            onChange={(origin) => patch({ origin })}
          />
          <Field
            label="Scope"
            value={draft.scope}
            options={["Personal", "Workspace", "Project"]}
            disabled={draft.state !== "Draft"}
            onChange={(scope) => patch({ scope })}
          />
          {draft.state === "Draft" && (
            <label className="product-field">
              Load .txt or .md (maximum 100 KB)
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const targetId = draft.id;
                  try {
                    if (file.size > 100000 || !/\.(txt|md)$/i.test(file.name))
                      throw new Error(
                        "Choose a .txt or .md file no larger than 100 KB.",
                      );
                    const content = await file.text();
                    ingestionChunks(content);
                    setDrafts((all) =>
                      all.map((d) =>
                        d.id === targetId &&
                        d.state === "Draft" &&
                        d.content === draft.content
                          ? { ...d, content, name: file.name }
                          : d,
                      ),
                    );
                    setMessage(
                      "File loaded into a draft. Review excerpts before importing.",
                    );
                  } catch (err) {
                    setMessage(
                      err instanceof Error
                        ? err.message
                        : "Unable to read file.",
                    );
                  }
                }}
              />
            </label>
          )}
          <Field
            label="Supplied content"
            type="textarea"
            rows={12}
            maxLength={100000}
            value={draft.content}
            disabled={draft.state !== "Draft"}
            onChange={(content) => patch({ content })}
          />
          <p>
            {chunks.length} excerpt(s) · {draft.content.length.toLocaleString()}{" "}
            characters
          </p>
          {error && <p role="status">{error}</p>}
          <details>
            <summary>Preview excerpt boundaries</summary>
            {chunks.map((c, i) => (
              <pre className="product-code" key={i}>
                {i + 1}. {c}
              </pre>
            ))}
          </details>
          <Button
            disabled={draft.state !== "Draft" || !!error}
            onClick={() => {
              try {
                const result = importIngestion(
                  draft,
                  data.product?.sources ?? [],
                );
                update((old) => {
                  const current = old.product?.ingestionDrafts?.find(
                    (d) => d.id === draft.id,
                  );
                  if (
                    !current ||
                    current.state !== "Draft" ||
                    current.content !== draft.content ||
                    current.origin !== draft.origin
                  )
                    return old;
                  return {
                    ...old,
                    product: {
                      ...old.product,
                      sources: [
                        ...(old.product?.sources ?? []),
                        ...result.sources.filter(
                          (s) =>
                            result.draft.sourceIds.includes(s.id) &&
                            !(old.product?.sources ?? []).some(
                              (existing) =>
                                existing.excerpt === s.excerpt &&
                                existing.url === s.url,
                            ),
                        ),
                      ],
                      ingestionDrafts: (old.product?.ingestionDrafts ?? []).map(
                        (d) => (d.id === draft.id ? result.draft : d),
                      ),
                    },
                  };
                });
                setMessage("Excerpts imported locally. No external sync ran.");
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Unable to import.",
                );
              }
            }}
          >
            Import reviewed excerpts
          </Button>
          {draft.state === "Imported" && (
            <p>
              {draft.sourceIds.length} excerpts were created. Original sources
              remain independently editable.
            </p>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
