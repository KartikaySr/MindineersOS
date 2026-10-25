import type { DecisionRecord } from "./shared/contracts/workspace";
import { useState } from "react";
import { Field, Button } from "./ProductUI";
import { routeReview } from "./review-routing";
export default function ReviewRouting({
  request,
  reviewers,
  actor,
  save,
}: {
  request: DecisionRecord;
  reviewers: string[];
  actor: string;
  save: (request: DecisionRecord) => void;
}) {
  const [reviewer, setReviewer] = useState(""),
    [reason, setReason] = useState(""),
    [until, setUntil] = useState(""),
    [error, setError] = useState("");
  const act = (action: string) => {
    try {
      save(routeReview(request, action, actor, { reviewer, reason, until }));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to complete this action.",
      );
    }
  };
  return (
    <section className="exp-panel">
      <h3>Review ownership & reminders</h3>
      <p>
        Local coordination only. No notification is sent and this does not grant
        approval permissions.
      </p>
      <p>
        Assigned to: <strong>{request.assignedReviewer || "Unassigned"}</strong>
        {request.escalated ? " · Escalated" : ""}
      </p>
      {request.state === "Pending" && (
        <>
          <Field
            label="Reviewer"
            value={reviewer}
            onChange={setReviewer}
            list="reviewer-names"
            maxLength={120}
          />
          <datalist id="reviewer-names">
            {[...new Set(reviewers)].map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <Field
            label="Handoff reason"
            type="textarea"
            value={reason}
            onChange={setReason}
            maxLength={2000}
          />
          <div className="exp-actions">
            <Button onClick={() => act("Delegate")}>Delegate review</Button>
            <Button onClick={() => act("Escalate")}>
              Escalate for attention
            </Button>
          </div>
          <Field
            label="Remind me at"
            type="datetime-local"
            value={until}
            onChange={setUntil}
          />
          <div className="exp-actions">
            <Button onClick={() => act("Snooze")}>Snooze pending queue</Button>
            {request.snoozedUntil && (
              <Button onClick={() => act("Wake")}>
                Return to pending queue
              </Button>
            )}
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <details>
        <summary>Routing history ({request.routing?.length || 0})</summary>
        {request.routing?.map((e) => (
          <div key={e.id} className="dashboard-row">
            <div>
              <strong>
                {e.action} · {e.reviewer || e.actor}
              </strong>
              <span>
                {e.reason || e.until} · {new Date(e.at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </details>
    </section>
  );
}
