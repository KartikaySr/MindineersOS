import RevisionDiff from "./RevisionDiff";
import { useState } from "react";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import type {
  Workspace,
  WorkspaceUpdate,
} from "../../shared/contracts/workspace";
import type { ProductReview } from "./model";
import { canonical, prepareReview, reviewDecision, routeProductReview } from "./model";
export default function ReviewPanel({
  data,
  update,
  domain,
  entityId,
  content,
  errors = [],
}: {
  data: Workspace;
  update: WorkspaceUpdate;
  domain: ProductReview["domain"];
  entityId: string;
  content: unknown;
  errors?: string[];
}) {
  const [reviews, setReviews] = useCollection(data, update, "productReviews");
  const [author, setAuthor] = useState(""),
    [reviewers, setReviewers] = useState(""),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [handoff, setHandoff] = useState(""),
    [deadline, setDeadline] = useState("");
  const snapshot = canonical(content),
    items = reviews.filter(
      (r) => r.domain === domain && r.entityId === entityId,
    );
  const attempt = (work: () => void) => {
    try {
      work();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save review.");
    }
  };
  return (
    <section className="panel">
      <span className="eyebrow">{domain.toUpperCase()} REVIEW</span>
      <h3>Review the exact current revision</h3>
      <p>
        Local review records preserve a content snapshot. Names and decisions
        are self-reported, not authenticated approvals. No external action is
        performed.
      </p>
      {errors.length > 0 && (
        <ul>
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="product-form-grid">
        <Field label="Author / proposer" value={author} onChange={setAuthor} />
        <Field
          label="Reviewers in order (one per line)"
          type="textarea"
          value={reviewers}
          onChange={setReviewers}
        />
      </div>
      <Button
        disabled={errors.length > 0}
        onClick={() =>
          attempt(() => {
            const review = prepareReview(
              domain,
              entityId,
              snapshot,
              author,
              reviewers.split("\n"),
            );
            setReviews((all) => [review, ...all]);
            setMessage("Review prepared for this revision.");
          })
        }
      >
        Prepare review
      </Button>
      <Field
        label="Decision evidence / rationale"
        type="textarea"
        value={reason}
        onChange={setReason}
      />
      {items.map((r) => {
        const stale = r.snapshot !== snapshot,
          next = r.reviewers[r.decisions.length];
        return (
          <article className="panel" key={r.id}>
            <h4>
              {r.state}
              {stale ? " · Stale revision" : ""}
            </h4>
            <p>
              Proposed by {r.author} · {r.createdAt}
            </p>
            <p>Review order: {r.reviewers.join(" → ")}</p>
            {r.dueAt && <p>Review deadline: {new Date(r.dueAt).toLocaleString()} {Date.parse(r.dueAt) < Date.now() && r.state === "In review" ? "· Overdue" : ""}</p>}
            {r.routing?.map((event,i) => <p key={i}>{event.action}: {event.from} → {event.to} · {event.reason} · {event.at}</p>)}
            {r.decisions.map((d, i) => (
              <p key={i}>
                {d.reviewer}: {d.decision} · {d.reason} · {d.at}
              </p>
            ))}
            {r.state === "In review" && (
              <>
                <p>Next reviewer: {next}</p>
                <details><summary>Route this review step</summary>
                  <Field label="New reviewer" value={handoff} onChange={setHandoff} />
                  <p>Use the decision rationale above to explain the handoff. Delegation and escalation affect only the next uncompleted step. Previous decisions remain unchanged.</p>
                  {(["Delegate", "Escalate"] as const).map(action => <Button key={action} disabled={stale || !handoff.trim() || !reason.trim()} onClick={() => attempt(() => {const nextReview = routeProductReview(r,snapshot,action,handoff,reason); setReviews(all => all.map(x => x.id === r.id ? nextReview : x)); setMessage("Review routing recorded locally. No notification was sent.");})}>{action} next step</Button>)}
                  <Field label="Review deadline" type="datetime-local" value={deadline} onChange={setDeadline} />
                  <Button disabled={stale || !deadline || !reason.trim()} onClick={() => attempt(() => {const nextReview = routeProductReview(r,snapshot,"Schedule",deadline,reason); setReviews(all => all.map(x => x.id === r.id ? nextReview : x)); setMessage("Deadline saved. Background reminders require the notification service.");})}>Set review deadline</Button>
                </details>
                <Button
                  disabled={stale || !reason.trim() || errors.length > 0}
                  onClick={() =>
                    attempt(() => {
                      setReviews((all) =>
                        all.map((x) =>
                          x.id === r.id
                            ? reviewDecision(
                                x,
                                snapshot,
                                next ?? "",
                                "Accept",
                                reason,
                              )
                            : x,
                        ),
                      );
                      setReason("");
                      setMessage(
                        "Local acceptance recorded; external authorization is still required.",
                      );
                    })
                  }
                >
                  Record acceptance
                </Button>
                <Button
                  disabled={stale || !reason.trim()}
                  onClick={() =>
                    attempt(() => {
                      setReviews((all) =>
                        all.map((x) =>
                          x.id === r.id
                            ? reviewDecision(
                                x,
                                snapshot,
                                next ?? "",
                                "Request changes",
                                reason,
                              )
                            : x,
                        ),
                      );
                      setReason("");
                    })
                  }
                >
                  Request changes
                </Button>
                <Button
                  onClick={() =>
                    setReviews((all) =>
                      all.map((x) =>
                        x.id === r.id ? { ...x, state: "Withdrawn" } : x,
                      ),
                    )
                  }
                >
                  Withdraw review
                </Button>
              </>
            )}
            {stale && <RevisionDiff before={readSnapshot(r.snapshot)} after={content} />}
            <details>
              <summary>Exact reviewed snapshot</summary>
              <pre className="product-code">{r.snapshot}</pre>
            </details>
          </article>
        );
      })}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

function readSnapshot(value: string): unknown { try { return JSON.parse(value); } catch { return value; } }
