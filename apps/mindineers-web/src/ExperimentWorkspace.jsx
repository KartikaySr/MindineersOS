import React, { useState } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
import { trialSummary, validateTrial, changeStage } from "./experiment-model";
export const newEvaluation = () => ({
  id: uid(),
  name: "Untitled evaluation",
  dataset: "",
  rubric: "",
  baseline: "",
  candidate: "",
  grader: "",
  holdout: "",
  acceptance: "",
  trials: [],
});
export const newScenario = () => ({
  id: uid(),
  name: "Untitled scenario",
  parentId: "",
  seed: "",
  environment: "",
  inputs: "",
  roster: "",
  constraints: "",
  assumptions: "",
  outcome: "",
  uncertainty: "",
  events: [],
});
export const newImprovement = () => ({
  id: uid(),
  name: "Untitled proposal",
  failure: "",
  before: "",
  after: "",
  regression: "",
  holdout: "",
  compatibility: "",
  rollback: "",
  monitoring: "",
  stage: "Draft",
  history: [],
});
const newTrial = () => ({
  id: uid(),
  caseId: "",
  variant: "Candidate",
  outcome: "Pass",
  cost: "0",
  latency: "0",
  violations: "0",
  interventions: "0",
  evidence: "",
  excluded: false,
  exclusion: "",
  adjudication: "",
});
function Report({ trials, label }) {
  const s = trialSummary(trials);
  return (
    <article className="panel">
      <h3>{label}</h3>
      <p>
        {s.n} included · {s.excluded} excluded · {s.passed} passed
      </p>
      {s.n > 0 ? (
        <>
          <strong>{(s.rate * 100).toFixed(1)}% recorded pass rate</strong>
          <p>
            95% Wilson interval: {(s.interval[0] * 100).toFixed(1)}–
            {(s.interval[1] * 100).toFixed(1)}%
          </p>
          <p>
            Mean latency {s.latency.toFixed(2)} ms · Recorded cost $
            {s.cost.toFixed(4)} USD · {s.violations} policy violations
          </p>
        </>
      ) : (
        <p>Add evidence-backed trial records to see a report.</p>
      )}
    </article>
  );
}
export default function ExperimentWorkspace({ data, update, route }) {
  const key =
    route === "simulation"
      ? "scenarios"
      : route === "improvement"
        ? "improvements"
        : "evaluations";
  const [items, setItems] = useCollection(data, update, key),
    [selected, select] = useState(""),
    [tab, setTab] = useState("Design"),
    [message, setMessage] = useState(""),
    [trial, setTrial] = useState(newTrial),
    [compare, setCompare] = useState(""),
    [intervention, setIntervention] = useState(""),
    [observation, setObservation] = useState(""),
    [evidence, setEvidence] = useState(""),
    [stage, setStage] = useState("In review");
  const record = items.find((i) => i.id === selected) || items[0],
    patch = (fields) =>
      setItems((rows) =>
        rows.map((r) => (r.id === record.id ? { ...r, ...fields } : r)),
      );
  const create = () => {
    const r = (
      key === "scenarios"
        ? newScenario
        : key === "improvements"
          ? newImprovement
          : newEvaluation
    )();
    setItems((rows) => [r, ...rows]);
    select(r.id);
    setTab("Design");
  };
  const title = {
    scenarios: "Explore the alternatives.",
    evaluations: "Measure what actually matters.",
    improvements: "Improve with evidence.",
  }[key];
  const form = (fields, disabled = false) =>
    fields.map(([k, label]) => (
      <Field
        key={k}
        label={label}
        type="textarea"
        value={record[k]}
        disabled={disabled}
        onChange={(v) => patch({ [k]: v })}
      />
    ));
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">{key.toUpperCase()}</span>
          <h2>{title}</h2>
          <p>
            {key === "scenarios"
              ? "Explicit assumptions, alternative branches, and documented outcomes."
              : key === "evaluations"
                ? "Versioned context and repeated trials, with exclusions visible."
                : "Review proposed changes, stage them, and preserve rollback evidence."}
          </p>
        </div>
        <Button onClick={create}>
          +{" "}
          {key === "scenarios"
            ? "Scenario"
            : key === "evaluations"
              ? "Evaluation"
              : "Proposal"}
        </Button>
      </div>
      <div className="notice">
        {key === "scenarios"
          ? "Scenario records are hypothetical. They do not execute agents, predict demand, or authorize live actions."
          : key === "evaluations"
            ? "Results are manually supplied evidence, not independently verified execution. Error trials count as non-passes. Statistical intervals assume independent, representative trials."
            : "This is a local change-review record. Promotion and rollback records do not deploy code or change policies."}
      </div>
      <div className="product-split">
        <aside className="product-list">
          {items.map((r) => (
            <button
              key={r.id}
              className={r.id === record?.id ? "active" : ""}
              onClick={() => {
                select(r.id);
                setMessage("");
              }}
            >
              <strong>{r.name}</strong>
              <small>
                {r.stage ||
                  (r.parentId
                    ? "Branched scenario"
                    : key === "evaluations"
                      ? `${r.trials.length} trials`
                      : "Scenario")}
              </small>
            </button>
          ))}
        </aside>
        {record ? (
          <article className="product-detail">
            <div className="product-editor-title">
              <h2>{record.name}</h2>
              <Button onClick={() => download(`${key}-record.json`, record)}>
                Export
              </Button>
            </div>
            <Tabs
              values={
                key === "evaluations"
                  ? ["Design", "Trials", "Report"]
                  : key === "scenarios"
                    ? ["Design", "Timeline", "Compare"]
                    : ["Design", "Review", "History"]
              }
              value={tab}
              onChange={setTab}
            />
            {tab === "Design" ? (
              <>
                <Field
                  label="Name"
                  value={record.name}
                  onChange={(name) => patch({ name })}
                />
                {key === "evaluations" ? (
                  <>
                    {record.trials.length > 0 && (
                      <p className="notice">
                        Evaluation context is locked once trials exist.
                        Duplicate the design to compare a new configuration.
                      </p>
                    )}
                    {form(
                      [
                        ["dataset", "Dataset reference and version"],
                        ["rubric", "Grading rubric and version"],
                        ["baseline", "Baseline configuration / model version"],
                        [
                          "candidate",
                          "Candidate configuration / model version",
                        ],
                        ["grader", "Grading method and evaluator version"],
                        [
                          "holdout",
                          "Holdout partition and contamination controls",
                        ],
                        [
                          "acceptance",
                          "Acceptance thresholds and exclusions policy",
                        ],
                      ],
                      record.trials.length > 0,
                    )}
                    <Button
                      onClick={() => {
                        const r = {
                          ...record,
                          id: uid(),
                          name: record.name + " · new configuration",
                          trials: [],
                        };
                        setItems((rows) => [r, ...rows]);
                        select(r.id);
                      }}
                    >
                      Duplicate design without trials
                    </Button>
                  </>
                ) : key === "scenarios" ? (
                  <>
                    {form([
                      ["seed", "Seed / reproducibility reference"],
                      ["environment", "Environment snapshot and version"],
                      ["inputs", "Scenario inputs"],
                      ["roster", "Agent roster and model versions"],
                      ["constraints", "Constraints and limits"],
                      ["assumptions", "Assumptions and evidence"],
                      ["outcome", "Observed or hypothetical outcomes"],
                      ["uncertainty", "Uncertainty and limitations"],
                    ])}
                    <Button
                      onClick={() => {
                        const r = {
                          ...record,
                          id: uid(),
                          name: record.name + " · branch",
                          parentId: record.id,
                          events: record.events.map((e) => ({ ...e })),
                          outcome: "",
                          uncertainty: "",
                        };
                        setItems((rows) => [r, ...rows]);
                        select(r.id);
                      }}
                    >
                      Branch this scenario
                    </Button>
                  </>
                ) : (
                  <>
                    {form(
                      [
                        ["failure", "Failure pattern and source evidence"],
                        ["before", "Current configuration"],
                        ["after", "Proposed configuration"],
                        ["regression", "Regression results and references"],
                        ["holdout", "Holdout results and references"],
                        ["compatibility", "Compatibility / migration notes"],
                        ["rollback", "Rollback procedure and target version"],
                        ["monitoring", "Monitoring plan and stop conditions"],
                      ],
                      record.stage !== "Draft",
                    )}
                    <p className="muted">
                      Configuration fields lock during review. Return to Draft
                      to revise; start a new proposal after deployment.
                      Protected policies and evaluation authority require
                      separate review.
                    </p>
                  </>
                )}
              </>
            ) : key === "evaluations" && tab === "Trials" ? (
              <>
                <div className="business-grid">
                  {[
                    ["caseId", "Case / repetition identifier"],
                    ["cost", "Cost (USD)"],
                    ["latency", "Latency (ms)"],
                    ["violations", "Policy violations"],
                    ["interventions", "Human interventions"],
                  ].map(([k, label]) => (
                    <Field
                      key={k}
                      label={label}
                      value={trial[k]}
                      onChange={(v) => setTrial((t) => ({ ...t, [k]: v }))}
                    />
                  ))}
                  <Field
                    label="Configuration"
                    value={trial.variant}
                    options={["Baseline", "Candidate"]}
                    onChange={(variant) => setTrial((t) => ({ ...t, variant }))}
                  />
                  <Field
                    label="Outcome"
                    value={trial.outcome}
                    options={["Pass", "Fail", "Error"]}
                    onChange={(outcome) => setTrial((t) => ({ ...t, outcome }))}
                  />
                </div>
                <Field
                  label="Evidence source / run reference"
                  value={trial.evidence}
                  onChange={(evidence) => setTrial((t) => ({ ...t, evidence }))}
                />
                <Button
                  onClick={() => {
                    try {
                      if (
                        !record.dataset.trim() ||
                        !record.rubric.trim() ||
                        !record.baseline.trim() ||
                        !record.candidate.trim() ||
                        !record.grader.trim()
                      )
                        throw new Error(
                          "Complete dataset, rubric, configurations, and grader before recording trials.",
                        );
                      validateTrial(trial);
                      patch({ trials: [...record.trials, trial] });
                      setTrial(newTrial());
                      setMessage("Trial recorded.");
                    } catch (e) {
                      setMessage(e.message);
                    }
                  }}
                >
                  Record trial
                </Button>
                {record.trials.map((t) => (
                  <article className="panel" key={t.id}>
                    <h3>
                      {t.caseId} · {t.variant} · {t.outcome}
                    </h3>
                    <p>{t.evidence}</p>
                    <Field
                      label="Exclusion rationale"
                      value={t.exclusion}
                      onChange={(exclusion) =>
                        patch({
                          trials: record.trials.map((x) =>
                            x.id === t.id
                              ? {
                                  ...x,
                                  exclusion,
                                  ...(!exclusion.trim()
                                    ? { excluded: false }
                                    : {}),
                                }
                              : x,
                          ),
                        })
                      }
                    />
                    <label className="business-check">
                      <input
                        type="checkbox"
                        checked={t.excluded}
                        disabled={!t.exclusion.trim()}
                        onChange={(e) =>
                          patch({
                            trials: record.trials.map((x) =>
                              x.id === t.id
                                ? { ...x, excluded: e.target.checked }
                                : x,
                            ),
                          })
                        }
                      />
                      Exclude from aggregates (retain record)
                    </label>
                    <Field
                      label="Adjudication / independent reviewer note"
                      value={t.adjudication}
                      onChange={(adjudication) =>
                        patch({
                          trials: record.trials.map((x) =>
                            x.id === t.id ? { ...x, adjudication } : x,
                          ),
                        })
                      }
                    />
                  </article>
                ))}
              </>
            ) : key === "evaluations" ? (
              <>
                <div className="business-grid">
                  <Report
                    label="Baseline"
                    trials={record.trials.filter(
                      (t) => t.variant === "Baseline",
                    )}
                  />
                  <Report
                    label="Candidate"
                    trials={record.trials.filter(
                      (t) => t.variant === "Candidate",
                    )}
                  />
                </div>
                <p className="muted">
                  Compare only equivalent datasets and grading conditions. These
                  descriptive results do not establish statistical superiority,
                  especially with correlated repetitions or small samples.
                </p>
              </>
            ) : key === "scenarios" && tab === "Timeline" ? (
              <>
                <Field
                  label="Intervention"
                  value={intervention}
                  onChange={setIntervention}
                />
                <Field
                  label="Observed / hypothetical effect"
                  type="textarea"
                  value={observation}
                  onChange={setObservation}
                />
                <Button
                  disabled={!intervention.trim() || !observation.trim()}
                  onClick={() => {
                    patch({
                      events: [
                        ...record.events,
                        {
                          id: uid(),
                          at: new Date().toISOString(),
                          intervention,
                          observation,
                        },
                      ],
                    });
                    setIntervention("");
                    setObservation("");
                  }}
                >
                  Record intervention
                </Button>
                {record.events.map((e) => (
                  <article className="panel" key={e.id}>
                    <strong>{e.intervention}</strong>
                    <p>{e.observation}</p>
                    <small>{e.at}</small>
                  </article>
                ))}
              </>
            ) : key === "scenarios" ? (
              <>
                <label className="product-field">
                  Compare with
                  <select
                    value={compare}
                    onChange={(e) => setCompare(e.target.value)}
                  >
                    <option value="">Choose another scenario</option>
                    {items
                      .filter((r) => r.id !== record.id)
                      .map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </label>
                {items.find((r) => r.id === compare) && (
                  <div className="business-grid">
                    {[record, items.find((r) => r.id === compare)].map((r) => (
                      <article className="panel" key={r.id}>
                        <h3>{r.name}</h3>
                        {[
                          "seed",
                          "environment",
                          "inputs",
                          "constraints",
                          "assumptions",
                          "outcome",
                          "uncertainty",
                        ].map((k) => (
                          <div key={k}>
                            <strong>{k}</strong>
                            <p className="business-prose">
                              {r[k] || "Not recorded"}
                            </p>
                          </div>
                        ))}
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : tab === "Review" ? (
              <>
                <h3>Current stage: {record.stage}</h3>
                <div className="business-grid">
                  <article className="panel">
                    <h3>Before</h3>
                    <pre className="business-prose">
                      {record.before || "Not recorded"}
                    </pre>
                  </article>
                  <article className="panel">
                    <h3>Proposed</h3>
                    <pre className="business-prose">
                      {record.after || "Not recorded"}
                    </pre>
                  </article>
                </div>
                <Field
                  label="Next recorded stage"
                  value={stage}
                  options={[
                    "Draft",
                    "In review",
                    "Staged",
                    "Promotion recorded",
                    "Rollback recorded",
                  ]}
                  onChange={setStage}
                />
                <Field
                  label="Reviewer / deployment evidence"
                  type="textarea"
                  value={evidence}
                  onChange={setEvidence}
                />
                <Button
                  onClick={() => {
                    try {
                      const next = changeStage(
                        record,
                        stage,
                        data.settings.name || "Owner",
                        evidence,
                      );
                      setItems((rows) =>
                        rows.map((r) => (r.id === record.id ? next : r)),
                      );
                      setEvidence("");
                      setMessage("Review stage recorded locally.");
                    } catch (e) {
                      setMessage(e.message);
                    }
                  }}
                >
                  Record reviewed stage
                </Button>
              </>
            ) : (
              <>
                {record.history.length ? (
                  record.history.map((h) => (
                    <article className="panel" key={h.id}>
                      <strong>
                        {h.stage} · {h.actor}
                      </strong>
                      <p>{h.evidence}</p>
                      <small>{h.at}</small>
                    </article>
                  ))
                ) : (
                  <p>No review stage changes yet.</p>
                )}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </article>
        ) : (
          <Empty title="Begin with a clear question.">
            Create a record to capture assumptions, configuration, evidence, and
            review decisions.
          </Empty>
        )}
      </div>
    </section>
  );
}
