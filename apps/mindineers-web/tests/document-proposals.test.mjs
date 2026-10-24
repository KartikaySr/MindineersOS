import test from "node:test";
import assert from "node:assert/strict";
import { applyProposal } from "../src/document-proposals.js";
test("suggestions preserve old content and cannot overwrite later edits", () => {
  const p = {
    id: "p",
    state: "Pending",
    baseBody: "Hello world",
    start: 6,
    end: 11,
    replacement: "team",
  };
  const d = {
    body: "Hello world",
    rows: [],
    slides: [],
    versions: [],
    proposals: [p],
  };
  const changed = applyProposal(d, p);
  assert.equal(changed.body, "Hello team");
  assert.equal(changed.versions[0].body, "Hello world");
  assert.equal(changed.proposals[0].state, "Applied");
  assert.equal(d.body, "Hello world");
  assert.throws(() => applyProposal(changed, p), /changed/);
  assert.throws(() => applyProposal(d, { ...p, start: -1 }), /range/);
  assert.throws(() => applyProposal(d, { ...p, state: "Applied" }), /reviewed/);
});
