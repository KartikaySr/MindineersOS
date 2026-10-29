import type { DocumentRecord } from "./shared/contracts/workspace";
import { useState } from "react";
import { Button } from "./ProductUI";
import { applyProposal } from "./document-proposals";
export default function DocumentSuggestions({
  doc,
  patch,
  reviewer,
}: {
  doc: DocumentRecord;
  reviewer: string;
  patch: (value: Partial<DocumentRecord>) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <section>
      <h3>Review suggested edits</h3>
      <p>
        Suggestions capture an exact selection and document revision. Applying a
        suggestion saves a checkpoint first. Changes from an older revision
        cannot overwrite newer edits.
      </p>
      {!(doc.proposals || []).length && (
        <p>Select text in Write, then choose Suggest replacement.</p>
      )}
      {(doc.proposals || []).map((p) => (
        <article className="panel" key={p.id}>
          <strong>
            {p.state} · {p.at}
          </strong>
          <p>Proposed by {p.author || "Unspecified"} · self-reported attribution</p>
          {p.reviewedBy && <p>Reviewed by {p.reviewedBy} · {p.reviewedAt}</p>}
          <div className="business-grid">
            <div>
              <h4>Original selection</h4>
              <p className="business-prose">
                {p.baseBody.slice(p.start, p.end)}
              </p>
            </div>
            <div>
              <h4>Replacement</h4>
              <p className="business-prose">
                {p.replacement || "(Remove selection)"}
              </p>
            </div>
          </div>
          <p>{p.reason}</p>
          {p.state === "Pending" && (
            <>
              <Button
                disabled={doc.body !== p.baseBody}
                onClick={() => {
                  try {
                    const next = applyProposal(doc, p);
                    patch({...next, proposals: next.proposals?.map(item => item.id === p.id ? {...item, reviewedBy: reviewer, reviewedAt: new Date().toISOString()} : item) || []});
                    setMessage(
                      "Suggestion applied. Previous content saved in Versions.",
                    );
                  } catch (e) {
                    setMessage(
                      e instanceof Error
                        ? e.message
                        : "Unable to complete this action.",
                    );
                  }
                }}
              >
                Apply suggestion
              </Button>
              <Button
                onClick={() =>
                  patch({
                    proposals: (doc.proposals || []).map((x) =>
                      x.id === p.id ? { ...x, state: "Declined", reviewedBy: reviewer, reviewedAt: new Date().toISOString() } : x,
                    ),
                  })
                }
              >
                Decline
              </Button>
              {doc.body !== p.baseBody && (
                <p className="notice">
                  Outdated suggestion: document content changed after it was
                  created.
                </p>
              )}
            </>
          )}
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
