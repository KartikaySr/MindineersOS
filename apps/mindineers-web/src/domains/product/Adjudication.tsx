import { useState } from "react";
import type {
  Workspace,
  WorkspaceUpdate,
  EvaluationRecord,
} from "../../shared/contracts/workspace";
import { Button, Field, useCollection } from "../../shared/ui/controls";
import { canonical, adjudicate } from "./model";
import type { AdjudicationRecord } from "./model";
export default function Adjudication({
  data,
  update,
  evaluation,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
  evaluation: EvaluationRecord;
}) {
  const [records, setRecords] = useCollection(data, update, "adjudications"),
    [selected, select] = useState(""),
    [author, setAuthor] = useState(""),
    [reviewer, setReviewer] = useState(""),
    [reason, setReason] = useState(""),
    [outcome, setOutcome] =
      useState<AdjudicationRecord["outcome"]>("Inconclusive"),
    [revealed, setRevealed] = useState(false),
    [message, setMessage] = useState("");
  const trial =
    evaluation.trials.find((t) => t.id === selected) ?? evaluation.trials[0];
  const snapshot = trial
    ? canonical({
        trial,
        rubric: evaluation.rubric,
        dataset: evaluation.dataset,
        holdout: evaluation.holdout,
      })
    : "";
  return (
    <section className="panel">
      <h3>Independent adjudication record</h3>
      <p>
        Reported variant and outcome are masked initially to reduce priming.
        This is not secure blind evaluation: evidence may reveal identity, and
        local users can inspect all records. Author and reviewer identities are
        self-reported.
      </p>
      <Field label="Evaluation author" value={author} onChange={setAuthor} />
      <Field
        label="Independent reviewer"
        value={reviewer}
        onChange={setReviewer}
      />
      <label className="product-field">
        Case
        <select
          value={trial?.id ?? ""}
          onChange={(e) => {
            select(e.target.value);
            setRevealed(false);
            setReason("");
            setMessage("");
          }}
        >
          <option value="">Choose case</option>
          {evaluation.trials.map((t, i) => (
            <option key={t.id} value={t.id}>
              Case {i + 1} · {t.caseId}
            </option>
          ))}
        </select>
      </label>
      {trial ? (
        <>
          <h4>Rubric</h4>
          <p>{evaluation.rubric || "No rubric recorded."}</p>
          <h4>Supplied evidence</h4>
          <pre className="product-code">{trial.evidence}</pre>
          <p>
            Excluded from original aggregate: {trial.excluded ? "Yes" : "No"}
          </p>
          {revealed ? (
            <p>
              Reported variant: {trial.variant} · Reported outcome:{" "}
              {trial.outcome}
            </p>
          ) : (
            <Button onClick={() => setRevealed(true)}>
              Reveal original labels (recorded with decision)
            </Button>
          )}
          <Field
            label="Independent finding"
            value={outcome}
            options={["Pass", "Fail", "Inconclusive"]}
            onChange={(v) => setOutcome(v as AdjudicationRecord["outcome"])}
          />
          <Field
            label="Rationale and evidence reference"
            type="textarea"
            value={reason}
            onChange={setReason}
          />
          <Button
            disabled={!evaluation.rubric.trim() || !reason.trim()}
            onClick={() => {
              try {
                const record = adjudicate(
                  evaluation.id,
                  trial.id,
                  snapshot,
                  author,
                  reviewer,
                  outcome,
                  reason,
                  revealed,
                );
                setRecords((all) => [record, ...all]);
                setReason("");
                setMessage(
                  "Adjudication recorded independently. Original trial and aggregate results were preserved.",
                );
              } catch (e) {
                setMessage(
                  e instanceof Error
                    ? e.message
                    : "Unable to record adjudication.",
                );
              }
            }}
          >
            Record adjudication
          </Button>
          {records
            .filter(
              (r) => r.evaluationId === evaluation.id && r.trialId === trial.id,
            )
            .map((r) => (
              <article className="panel" key={r.id}>
                <strong>
                  {r.outcome} · {r.reviewer}
                  {r.snapshot !== snapshot ? " · Stale evidence" : ""}
                </strong>
                <p>{r.reason}</p>
                <small>
                  {r.at} · Original labels{" "}
                  {r.revealed ? "revealed" : "masked in this view"}
                </small>
              </article>
            ))}
        </>
      ) : (
        <p>Record evidence-backed trials before adjudication.</p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
