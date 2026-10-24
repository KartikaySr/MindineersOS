import test from "node:test";
import assert from "node:assert/strict";
import {
  organizationErrors,
  permissionDecision,
  readyRequest,
  phaseTwoValidators,
} from "../src/domains/administration/model.ts";
import {
  disconnectedIdentity,
  validateIdentityInput,
  checkedIdentityResult,
  isExpired,
} from "../src/domains/administration/identity.ts";
import { validateProduct } from "../src/product-model.js";
test("organization setup rejects unsafe domains and invalid slugs", () => {
  const draft = {
    id: "o",
    name: "Company",
    slug: "company",
    contact: "owner@example.org",
    region: "India",
    domains: "example.org",
    state: "Draft",
  };
  assert.deepEqual(organizationErrors(draft), []);
  assert.ok(organizationErrors({ ...draft, slug: "../tenant" }).length);
  assert.ok(
    organizationErrors({
      ...draft,
      domains: "https://example.org *.example.org",
    }).length,
  );
  validateProduct({ organizations: [draft] });
});
test("local roles never become effective permissions and expired snapshots deny access", () => {
  assert.equal(
    permissionDecision({ status: "disconnected" }, "billing.manage").allowed,
    false,
  );
  assert.equal(
    permissionDecision(
      {
        status: "verified",
        permissions: ["billing.manage"],
        expiresAt: "2000-01-01",
      },
      "billing.manage",
    ).allowed,
    false,
  );
  assert.equal(
    permissionDecision(
      {
        status: "verified",
        permissions: ["billing.manage"],
        expiresAt: "2099-01-01",
      },
      "billing.manage",
    ).allowed,
    true,
  );
  assert.equal(
    permissionDecision(
      { status: "verified", permissions: [], expiresAt: "2099-01-01" },
      "billing.manage",
    ).allowed,
    false,
  );
});
test("connection requests snapshot scopes and cannot bypass review guards", () => {
  const r = {
    id: "r",
    provider: "github",
    account: "Work",
    action: "Connect",
    scopes: ["Read repositories"],
    reason: "Inspect code",
    state: "Draft",
    at: "now",
  };
  assert.equal(readyRequest(r).state, "Ready for review");
  assert.equal(r.state, "Draft");
  assert.throws(() => readyRequest({ ...r, scopes: [] }));
  assert.throws(() => readyRequest({ ...r, reason: "" }));
  assert.throws(() => readyRequest({ ...r, state: "Withdrawn" }));
  validateProduct({ connectionRequests: [readyRequest(r)] });
  assert.equal(
    phaseTwoValidators.connectionRequests({ ...r, action: "Execute" }),
    false,
  );
});
test("billing requests never imply execution and validate preparation", () => {
  const r = {
    id: "b",
    action: "Cancel renewal",
    plan: "",
    cycle: "Monthly",
    effective: "Next renewal",
    reason: "Review subscription",
    state: "Draft",
    at: "now",
  };
  const ready = readyRequest(r);
  assert.equal(ready.state, "Ready for review");
  validateProduct({ billingRequests: [ready] });
  assert.throws(() => readyRequest({ ...r, action: "Change plan" }));
});
test("identity input and response expiry fail closed without persisting credentials", async () => {
  validateIdentityInput({
    intent: "sign-in",
    email: "person@example.org",
    name: "",
    invitation: "",
  });
  assert.throws(() =>
    validateIdentityInput({
      intent: "join",
      email: "person@example.org",
      name: "",
      invitation: "",
    }),
  );
  assert.throws(() =>
    checkedIdentityResult({
      kind: "challenge",
      id: "c",
      destination: "mail",
      expiresAt: "2000-01-01",
    }),
  );
  assert.throws(() =>
    checkedIdentityResult({
      kind: "authenticated",
      session: {
        id: "s",
        expiresAt: "invalid",
        displayName: "Name",
        permissions: [],
      },
    }),
  );
  assert.equal(isExpired("invalid"), true);
  await assert.rejects(
    disconnectedIdentity.begin({}, new AbortController().signal),
    { code: "unavailable" },
  );
});

test('identity response validation rejects unknown states and strips extra fields',()=>{
 assert.throws(()=>checkedIdentityResult({kind:'bypass',token:'secret'}));
 assert.throws(()=>checkedIdentityResult({kind:'authenticated',session:{id:'s',displayName:'Name',expiresAt:'2099-01-01',permissions:[{}]}}));
 assert.deepEqual(checkedIdentityResult({kind:'recovery-sent',token:'secret'}),{kind:'recovery-sent'});
});
