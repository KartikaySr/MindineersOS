import test from "node:test";
import assert from "node:assert/strict";
import {
  decideApproval,
  reviseApproval,
  cellValue,
  validateApproval,
} from "../src/product-model.js";
const request = () => ({
  id: "r1",
  name: "Publish",
  destination: "company account",
  payload: "Approved message",
  scopes: ["publish"],
  expiresAt: "2099-01-01T00:00",
  version: 1,
  state: "Pending",
  previous: [],
});
test("approval captures the payload and scope at the reviewed version", () => {
  const r = request(),
    approved = decideApproval(r, "Approved", "Owner");
  r.scopes.push("delete");
  assert.equal(approved.decision.version, 1);
  assert.deepEqual(approved.decision.scopes, ["publish"]);
  assert.equal(approved.decision.payload, "Approved message");
  assert.throws(() => decideApproval(approved, "Declined", "Other"), /already/);
});
test("editing an approved request invalidates its previous authorization", () => {
  const r = decideApproval(request(), "Approved", "Owner");
  const revised = reviseApproval(r, { payload: "Different action" });
  assert.equal(revised.state, "Pending");
  assert.equal(revised.decision, null);
  assert.equal(revised.version, 2);
  assert.equal(revised.previous[0].payload, "Approved message");
});
test("expired or incomplete requests cannot be approved", () => {
  assert.match(
    validateApproval({ ...request(), expiresAt: "2020-01-01" }),
    /expired/,
  );
  assert.throws(
    () =>
      decideApproval({ ...request(), destination: "" }, "Approved", "Owner"),
    /destination/,
  );
});
test("spreadsheet evaluates safe references and sums without code execution", () => {
  const rows = [
    ["2", "3", "=A1+B1"],
    ["4", "5", "=SUM(A1:B2)"],
  ];
  assert.equal(cellValue(rows, "C1"), "5");
  assert.equal(cellValue(rows, "C2"), "14");
  assert.throws(() => cellValue([["=alert(1)"]], "A1"), /Supported/);
});
test("spreadsheet rejects cycles and division by zero", () => {
  assert.throws(() => cellValue([["=B1+1", "=A1+1"]], "A1"), /Circular/);
  assert.throws(() => cellValue([["=2/0"]], "A1"), /zero/);
});
import { validateProduct } from "../src/product-model.js";
test("backup import rejects malformed sheets and executable-shaped comment values", () => {
  assert.throws(
    () => validateProduct({ documents: [{ id: "x", kind: "Sheet" }] }),
    /documents/,
  );
  assert.throws(
    () =>
      validateProduct({
        members: [
          {
            id: "m",
            name: { bad: true },
            email: "a@example.org",
            role: "viewer",
            state: "Draft",
          },
        ],
      }),
    /members/,
  );
  assert.throws(() => validateProduct({ unknown: [] }), /unknown/);
});

test("reviews reject invalid decisions and sheets reject reversed ranges", () => {
  assert.throws(
    () => decideApproval(request(), "Executed", "Owner"),
    /Invalid review/,
  );
  assert.throws(
    () => cellValue([["1", "2", "=SUM(B1:A1)"]], "C1"),
    /Range must/,
  );
});
