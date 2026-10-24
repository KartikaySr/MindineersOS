import React, { useState } from "react";
import { Button, Field } from "./ProductUI";
import { applyProposal } from "./document-proposals";
export default function DocumentSuggestions({ doc, patch }) {
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
                    patch(applyProposal(doc, p));
                    setMessage(
                      "Suggestion applied. Previous content saved in Versions.",
                    );
                  } catch (e) {
                    setMessage(e.message);
                  }
                }}
              >
                Apply suggestion
              </Button>
              <Button
                onClick={() =>
                  patch({
                    proposals: doc.proposals.map((x) =>
                      x.id === p.id ? { ...x, state: "Declined" } : x,
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
