import test from "node:test";
import assert from "node:assert/strict";
import {
  trialSummary,
  validateTrial,
  changeStage,
} from "../src/experiment-model.js";
const trial = {
  caseId: "case-1",
  cost: "0.001",
  latency: "100",
  violations: "0",
  interventions: "0",
  evidence: "run-1",
  excluded: false,
  exclusion: "",
  outcome: "Pass",
};
test("evaluation reports retain errors in denominator and account for exclusions", () => {
  const s = trialSummary([
    trial,
    { ...trial, outcome: "Error" },
    { ...trial, excluded: true },
  ]);
  assert.equal(s.n, 2);
  assert.equal(s.excluded, 1);
  assert.equal(s.rate, 0.5);
  assert.equal(s.latency, 100);
  assert.equal(s.cost, 0.002);
  assert.ok(s.interval[0] < 0.5 && s.interval[1] > 0.5);
  assert.equal(trialSummary([]).rate, null);
  assert.ok(trialSummary([trial]).interval[0] < 0.3);
});
test("trial validation rejects ungrounded, nonfinite and unreasoned excluded results", () => {
  assert.equal(validateTrial(trial), trial);
  for (const patch of [
    { evidence: "" },
    { cost: "Infinity" },
    { latency: "-1" },
    { violations: ".5" },
    { excluded: true, exclusion: "" },
  ])
    assert.throws(() => validateTrial({ ...trial, ...patch }));
});
test("improvement stage gates require evidence and preserve review history", () => {
  let plan = {
    stage: "Draft",
    regression: "",
    holdout: "",
    rollback: "",
    compatibility: "",
    history: [],
  };
  assert.throws(
    () => changeStage(plan, "Promotion recorded", "Owner", "proof"),
    /Invalid/,
  );
  plan = changeStage(plan, "In review", "Owner", "review");
  assert.throws(
    () => changeStage(plan, "Staged", "Owner", "proof"),
    /Document/,
  );
  plan = changeStage(
    {
      ...plan,
      regression: "test report",
      holdout: "holdout",
      rollback: "v1",
      compatibility: "compatible",
    },
    "Staged",
    "Owner",
    "review2",
  );
  plan = changeStage(plan, "Promotion recorded", "Owner", "deployment record");
  plan = changeStage(plan, "Rollback recorded", "Owner", "rollback record");
  assert.equal(plan.history.length, 4);
  assert.equal(plan.history[0].stage, "In review");
});
