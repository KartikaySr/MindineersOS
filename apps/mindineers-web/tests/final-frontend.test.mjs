import test from "node:test";
import assert from "node:assert/strict";
import { revisionDiff } from "../src/domains/product/revision-diff.ts";
import {
  routeProductReview,
  prepareReview,
  reviewDecision,
} from "../src/domains/product/model.ts";
import {
  checkedPortalSession,
  checkedPortalDeliveries,
  checkedPortalAcknowledgement,
  disconnectedPortal,
} from "../src/domains/delivery/portal.ts";
import { resolveConflict } from "../src/domains/recovery/ConflictReview.tsx";
const workspace = () => ({
  settings: {
    name: "QA",
    workspace: "Test",
    theme: "Light",
    motion: false,
    notifications: true,
    budget: 0,
  },
  projects: [],
  agents: [],
  records: {},
  posts: [],
  approvals: [],
  messages: [],
});
test("field comparison preserves removals, ordered arrays and escaped paths", () => {
  const diff = revisionDiff(
    { "a/b": { old: "private" }, steps: ["a", "b"] },
    { "a/b": { new: "reviewed" }, steps: ["b", "a"] },
  );
  assert.deepEqual(
    diff.map((d) => [d.path, d.kind]),
    [
      ["/a~1b/new", "Added"],
      ["/a~1b/old", "Removed"],
      ["/steps", "Changed"],
    ],
  );
  assert.equal(revisionDiff({ a: 1 }, { a: 1 }).length, 0);
});
test("review routing preserves completed reviewers and rejects stale/self handoffs", () => {
  let r = prepareReview("Procurement", "purchase", "snapshot", "Author", [
    "First",
    "Second",
  ]);
  r = reviewDecision(r, "snapshot", "First", "Accept", "Evidence");
  const next = routeProductReview(
    r,
    "snapshot",
    "Escalate",
    "Third",
    "Budget exception",
  );
  assert.deepEqual(next.reviewers, ["First", "Third"]);
  assert.deepEqual(next.decisions, r.decisions);
  assert.throws(
    () => routeProductReview(r, "changed", "Delegate", "Third", "reason"),
    /current/,
  );
  assert.throws(
    () => routeProductReview(r, "snapshot", "Delegate", "author", "reason"),
    /distinct/,
  );
  assert.throws(
    () => routeProductReview(r, "snapshot", "Schedule", "2000-01-01", "reason"),
    /future/,
  );
});
test("conflict resolution requires explicit choices and validates merged data", () => {
  const local = workspace(),
    incoming = workspace();
  incoming.settings.name = "Incoming";
  incoming.messages = [{ id: "m", role: "user", text: "Incoming note" }];
  assert.throws(() => resolveConflict(local, incoming, {}), /every/);
  const result = resolveConflict(local, incoming, {
    settings: "local",
    messages: "incoming",
  });
  assert.equal(result.settings.name, "QA");
  assert.equal(result.messages[0].text, "Incoming note");
  assert.throws(
    () =>
      resolveConflict(
        local,
        { ...incoming, settings: { name: 3 } },
        { settings: "incoming", messages: "incoming" },
      ),
    /preferences/,
  );
});
const session = () =>
  checkedPortalSession({
    customerId: "customer-a",
    displayName: "Guest",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    permissions: ["delivery:read", "delivery:respond"],
  });
const delivery = () => ({
  id: "d",
  revision: "v1",
  customerId: "customer-a",
  name: "Delivery",
  status: "Awaiting acceptance",
  due: "",
  updates: [],
  documents: [],
  internalNote: "Never expose",
});
test("portal rejects cross-customer data and emits only allowlisted fields", () => {
  const result = checkedPortalDeliveries([delivery()], session());
  assert.equal("internalNote" in result[0], false);
  assert.throws(() =>
    checkedPortalDeliveries(
      [{ ...delivery(), customerId: "customer-b" }],
      session(),
    ),
  );
  assert.throws(() =>
    checkedPortalDeliveries([delivery(), delivery()], session()),
  );
  assert.throws(() =>
    checkedPortalDeliveries([delivery()], { ...session(), permissions: [] }),
  );
  assert.throws(() =>
    checkedPortalSession({ ...session(), expiresAt: "2000-01-01" }),
  );
});
test("portal never treats an unmatched receipt or unavailable service as success", async () => {
  const input = {
    deliveryId: "d",
    revision: "v1",
    requestId: "request",
    decision: "Accept",
    message: "Reviewed",
  };
  const ack = { ...input, receiptId: "receipt" };
  assert.equal(checkedPortalAcknowledgement(ack, input), "receipt");
  assert.throws(() =>
    checkedPortalAcknowledgement({ ...ack, revision: "v2" }, input),
  );
  assert.throws(() =>
    checkedPortalAcknowledgement({ ...ack, requestId: "other" }, input),
  );
  await assert.rejects(
    disconnectedPortal.respond(input, new AbortController().signal),
  );
});

import {
  checkedResource,
  checkedCommand,
  disconnectedResource,
} from "../src/shared/services/connected-resource.ts";
test("connected resource contracts isolate workspaces and distinguish accepted from completed", async () => {
  const scope = { workspaceId: "a", entityId: "device", kind: "device" };
  const snapshot = {
    ...scope,
    revision: "r1",
    state: "Ready",
    confirmedAt: new Date().toISOString(),
    warnings: [],
    facts: [],
    actions: [{ id: "revoke", label: "Revoke", effect: "Stop new access" }],
  };
  assert.equal(checkedResource(snapshot, scope).actions.length, 1);
  assert.throws(() =>
    checkedResource({ ...snapshot, workspaceId: "b" }, scope),
  );
  assert.throws(() =>
    checkedResource(
      { ...snapshot, actions: [...snapshot.actions, ...snapshot.actions] },
      scope,
    ),
  );
  const command = {
    ...scope,
    revision: "r1",
    action: "revoke",
    requestId: "request",
  };
  assert.equal(
    checkedCommand(
      {
        ...command,
        state: "Accepted",
        receiptId: "receipt",
        message: "Queued",
      },
      command,
    ).state,
    "Accepted",
  );
  assert.throws(() =>
    checkedCommand(
      {
        ...command,
        revision: "r2",
        state: "Completed",
        receiptId: "receipt",
        message: "Done",
      },
      command,
    ),
  );
  await assert.rejects(
    disconnectedResource.command(command, new AbortController().signal),
  );
});

import { loadPortal } from "../src/domains/delivery/portal.ts";
test("portal does not fetch records without read access or accept a session expiring during load", async () => {
  let fetched = 0;
  const service = {
    ...disconnectedPortal,
    available: true,
    session: async () => ({ ...session(), permissions: [] }),
    list: async () => {
      fetched++;
      return [];
    },
  };
  await assert.rejects(
    loadPortal(service, new AbortController().signal),
    (e) => e.code === "forbidden",
  );
  assert.equal(fetched, 0);
  assert.throws(
    () =>
      checkedPortalDeliveries([delivery()], {
        ...session(),
        expiresAt: "2000-01-01",
      }),
    (e) => e.code === "unauthorized",
  );
});
