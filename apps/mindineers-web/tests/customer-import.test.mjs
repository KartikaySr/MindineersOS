import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCSV,
  mapContacts,
  mergeContacts,
} from "../src/customer-import.js";
test("CSV preserves quoted commas, quotes and multiline fields", () => {
  const p = parseCSV('Name,Notes\r\n"Acme, Inc","A ""quote""\nnext line"');
  assert.deepEqual(p.rows, [["Acme, Inc", 'A "quote"\nnext line']]);
  assert.throws(() => parseCSV("Name,Name\nA,B"), /unique/);
  assert.throws(() => parseCSV("Name,Email\nA"), /same number/);
});
test("contact import identifies invalid records and duplicates without editing existing contacts", () => {
  const existing = [{ email: "A@EXAMPLE.COM" }];
  const p = parseCSV(
    "Name,Email,Value\nA,a@example.com,1\nB,b@example.com,2\nC,b@example.com,3\nD,invalid,-1",
  );
  const r = mapContacts(p, { name: "0", email: "1", value: "2" }, existing);
  assert.deepEqual(
    r.map((x) => x.duplicate),
    [true, false, true, false],
  );
  assert.equal(r[3].errors.length, 2);
  assert.equal(existing.length, 1);
});
test("reviewed merge preserves target identity and combines history", () => {
  const a = {
      id: "a",
      name: "A",
      email: "a@example.com",
      stage: "Won",
      activities: [{ id: "1" }],
    },
    b = {
      id: "b",
      name: "B",
      email: "b@example.com",
      activities: [{ id: "2" }],
    };
  const m = mergeContacts(a, b, { email: "source" });
  assert.equal(m.id, "a");
  assert.equal(m.stage, "Won");
  assert.equal(m.name, "A");
  assert.equal(m.email, "b@example.com");
  assert.equal(m.activities.length, 3);
  assert.equal(a.activities.length, 1);
  assert.throws(() => mergeContacts(a, a, {}), /distinct/);
});
