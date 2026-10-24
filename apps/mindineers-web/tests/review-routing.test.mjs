import test from "node:test";
import assert from "node:assert/strict";
import { routeReview } from "../src/review-routing.js";
import { reviseApproval } from "../src/product-model.js";
const request = {
  id: "r",
  state: "Pending",
  expiresAt: "2099-01-02T00:00:00Z",
  version: 1,
  payload: "Original",
  destination: "Test",
  scopes: ["read"],
  snoozedUntil: "2099-01-01T10:00:00Z",
};
test("routing preserves approval version and requires a reviewer and reason", () => {
  assert.throws(
    () => routeReview(request, "Delegate", "Owner", { reviewer: "Reviewer" }),
    /explain/,
  );
  const r = routeReview(request, "Escalate", "Owner", {
    reviewer: "Reviewer",
    reason: "Specialist review",
  });
  assert.equal(r.version, 1);
  assert.equal(r.state, "Pending");
  assert.equal(r.assignedReviewer, "Reviewer");
  assert.equal(r.escalated, true);
  assert.equal(r.routing.length, 1);
  assert.equal(request.routing, undefined);
});
test("snooze is bounded by expiry and revisions wake the queue", () => {
  const now = new Date("2099-01-01T00:00:00Z");
  assert.throws(
    () => routeReview(request, "Snooze", "Owner", { until: "2099-01-03" }, now),
    /before/,
  );
  assert.throws(
    () => routeReview(request, "Snooze", "Owner", { until: "2098-01-01" }, now),
    /future/,
  );
  const r = reviseApproval(request, { payload: "Updated" });
  assert.equal(r.snoozedUntil, "");
  assert.deepEqual(r.previous[0].scopes, ["read"]);
  assert.equal(r.previous[0].expiresAt, request.expiresAt);
});
