export function trialSummary(trials) {
  const included = trials.filter((t) => !t.excluded),
    n = included.length,
    passed = included.filter((t) => t.outcome === "Pass").length;
  if (!n)
    return {
      n: 0,
      excluded: trials.length,
      passed: 0,
      rate: null,
      interval: null,
      cost: 0,
      latency: null,
      violations: 0,
    };
  const p = passed / n,
    z = 1.96,
    denom = 1 + (z * z) / n,
    center = (p + (z * z) / (2 * n)) / denom,
    margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denom;
  return {
    n,
    excluded: trials.length - n,
    passed,
    rate: p,
    interval: [Math.max(0, center - margin), Math.min(1, center + margin)],
    cost: included.reduce((s, t) => s + Number(t.cost), 0),
    latency: included.reduce((s, t) => s + Number(t.latency), 0) / n,
    violations: included.reduce((s, t) => s + Number(t.violations), 0),
  };
}
export function validateTrial(t) {
  if (!t.caseId.trim() || !t.evidence.trim())
    throw new Error("A case identifier and evidence source are required.");
  for (const key of ["cost", "latency", "violations", "interventions"])
    if (!/^\d+(?:\.\d+)?$/.test(t[key]) || !Number.isFinite(Number(t[key])))
      throw new Error(`${key} must be a non-negative number.`);
  for (const key of ["violations", "interventions"])
    if (!Number.isSafeInteger(Number(t[key])))
      throw new Error(`${key} must be a whole number.`);
  if (t.excluded && !t.exclusion.trim())
    throw new Error("Explain why this trial is excluded.");
  return t;
}
export function changeStage(plan, stage, actor, evidence) {
  const allowed = {
    Draft: ["In review"],
    "In review": ["Staged", "Draft"],
    Staged: ["Promotion recorded", "Draft"],
    "Promotion recorded": ["Rollback recorded"],
    "Rollback recorded": ["Draft"],
  };
  if (!allowed[plan.stage]?.includes(stage))
    throw new Error("Invalid review stage change.");
  if (!evidence.trim())
    throw new Error("A review or deployment evidence reference is required.");
  if (
    ["Staged", "Promotion recorded"].includes(stage) &&
    (!plan.regression.trim() ||
      !plan.holdout.trim() ||
      !plan.rollback.trim() ||
      !plan.compatibility.trim())
  )
    throw new Error(
      "Document regression, holdout, compatibility, and rollback evidence first.",
    );
  return {
    ...plan,
    stage,
    history: [
      ...plan.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        actor,
        stage,
        evidence,
      },
    ],
  };
}
const text = (x) => typeof x === "string" && x.length <= 200000;
const fields = (x, keys) =>
  x && typeof x === "object" && keys.every((k) => text(x[k]));
const validTrial = (t) => {
  try {
    validateTrial(t);
    return true;
  } catch {
    return false;
  }
};
const rows = (x, fn) => Array.isArray(x) && x.length <= 10000 && x.every(fn);
export const experimentValidators = {
  evaluations: (e) =>
    fields(e, [
      "id",
      "name",
      "dataset",
      "rubric",
      "baseline",
      "candidate",
      "grader",
      "holdout",
      "acceptance",
    ]) &&
    rows(
      e.trials,
      (t) =>
        fields(t, [
          "id",
          "caseId",
          "variant",
          "outcome",
          "cost",
          "latency",
          "violations",
          "interventions",
          "evidence",
          "exclusion",
          "adjudication",
        ]) &&
        ["Baseline", "Candidate"].includes(t.variant) &&
        ["Pass", "Fail", "Error"].includes(t.outcome) &&
        typeof t.excluded === "boolean" &&
        validTrial(t),
    ),
  scenarios: (s) =>
    fields(s, [
      "id",
      "name",
      "parentId",
      "seed",
      "environment",
      "inputs",
      "roster",
      "constraints",
      "assumptions",
      "outcome",
      "uncertainty",
    ]) &&
    rows(s.events, (e) =>
      fields(e, ["id", "at", "intervention", "observation"]),
    ),
  improvements: (p) =>
    fields(p, [
      "id",
      "name",
      "failure",
      "before",
      "after",
      "regression",
      "holdout",
      "compatibility",
      "rollback",
      "monitoring",
      "stage",
    ]) &&
    [
      "Draft",
      "In review",
      "Staged",
      "Promotion recorded",
      "Rollback recorded",
    ].includes(p.stage) &&
    rows(p.history, (h) =>
      fields(h, ["id", "at", "actor", "stage", "evidence"]),
    ),
};
