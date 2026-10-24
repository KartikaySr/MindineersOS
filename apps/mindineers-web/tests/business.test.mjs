import test from "node:test";
import assert from "node:assert/strict";
import {
  minorAmount,
  financeTotals,
  transitionFinance,
  portalSnapshot,
  acceptanceReady,
  businessValidators,
} from "../src/business-model.js";
import { validateProduct } from "../src/product-model.js";
const invoice = () => ({
  id: "i",
  name: "INV-1",
  kind: "Invoice",
  counterparty: "Acme",
  currency: "USD",
  tax: "7.25",
  due: "",
  state: "Draft",
  matchReference: "",
  matchedAmount: "",
  notes: "",
  lines: [{ id: "l", description: "Work", quantity: "3", price: "0.10" }],
  history: [],
});
test("currency totals use exact minor units and deterministic half-up tax rounding", () => {
  assert.equal(minorAmount("0.10", "USD"), 10);
  assert.equal(minorAmount("100", "JPY"), 100);
  assert.equal(minorAmount("1.234", "KWD"), 1234);
  assert.deepEqual(financeTotals(invoice()), {
    subtotal: 30,
    tax: 2,
    total: 32,
  });
  for (const [value, currency] of [
    ["1.1", "JPY"],
    ["1.234", "USD"],
    ["-1", "USD"],
    ["1e4", "USD"],
    ["NaN", "USD"],
    ["1", "BAD"],
  ])
    assert.throws(() => minorAmount(value, currency));
  assert.throws(
    () =>
      financeTotals({
        ...invoice(),
        lines: [{ quantity: "9999999999999999", price: "99999999" }],
      }),
    /range/,
  );
});
test("reconciliation requires ordered transitions, sources and exact matching", () => {
  let r = invoice();
  assert.throws(
    () => transitionFinance(r, "Paid", "evidence", "Owner"),
    /not allowed/,
  );
  assert.throws(
    () => transitionFinance(r, "Submitted", "", "Owner"),
    /evidence/,
  );
  for (const next of ["Submitted", "Accepted", "Paid"])
    r = transitionFinance(r, next, "External record reference", "Owner");
  assert.throws(
    () => transitionFinance(r, "Reconciled", "Statement", "Owner"),
    /reference/,
  );
  r = { ...r, matchReference: "Statement 1", matchedAmount: "0.31" };
  assert.throws(
    () => transitionFinance(r, "Reconciled", "Statement", "Owner"),
    /equal/,
  );
  r = transitionFinance(
    { ...r, matchedAmount: "0.32" },
    "Reconciled",
    "Statement",
    "Owner",
  );
  assert.equal(r.history.length, 4);
  assert.equal(r.history[3].from, "Paid");
  assert.equal(invoice().state, "Draft");
  validateProduct({ ledger: [r] });
  assert.equal(businessValidators.ledger({ ...r, currency: "BAD" }), false);
});
test("customer snapshot excludes internal metadata, hidden updates and other-customer artifacts", () => {
  const d = {
    name: "Delivery",
    customerId: "c",
    due: "",
    state: "Intake",
    notes: "SECRET",
    requirements: "Requirement",
    source: "Contract",
    checklist: [{ done: true }],
    updates: [
      { text: "Public", at: "today", visible: true },
      { text: "SECRET", visible: false },
    ],
    artifacts: [
      { documentId: "a", customerId: "c", visible: true },
      { documentId: "b", customerId: "other", visible: true },
    ],
  };
  const docs = [
    {
      id: "a",
      name: "Approved",
      kind: "Presentation",
      body: "",
      rows: [],
      slides: [{ title: "Title", body: "Body", notes: "SECRET" }],
      comments: [{ text: "SECRET" }],
    },
    { id: "b", name: "SECRET" },
  ];
  const snapshot = portalSnapshot(
    d,
    { id: "c", name: "Customer", email: "SECRET" },
    docs,
  );
  assert.equal(snapshot.artifacts.length, 1);
  assert.doesNotMatch(JSON.stringify(snapshot), /SECRET/);
  assert.throws(
    () => portalSnapshot(d, { id: "other" }, docs),
    /existing customer/,
  );
  assert.equal(acceptanceReady(d), true);
  assert.equal(acceptanceReady({ ...d, checklist: [] }), false);
});
