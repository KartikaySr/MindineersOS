import test from "node:test";
import assert from "node:assert/strict";
import { validateDataTree } from "../src/input-safety.js";
import { validateProduct } from "../src/product-model.js";
import { validHttpUrl } from "../src/workbench-model.js";
test("imports reject unsafe object keys and excessive nesting", () => {
  for (const key of ["__proto__", "constructor", "prototype"])
    assert.throws(
      () => validateDataTree(JSON.parse(`{"settings":{"${key}":{}}}`)),
      /unsafe/,
    );
  let data = {};
  for (let i = 0; i < 70; i++) data = { x: data };
  assert.throws(() => validateDataTree(data), /complexity/);
  assert.deepEqual(validateDataTree({ notes: "constructor is text" }), {
    notes: "constructor is text",
  });
});
test("product imports reject duplicate IDs and inherited collection names", () => {
  const role = { id: "r", name: "Role", permissions: [] };
  assert.throws(() => validateProduct({ roles: [role, role] }), /Invalid/);
  assert.throws(
    () => validateProduct(JSON.parse('{"__proto__":[]}')),
    /Invalid/,
  );
});
test("outbound references cannot use executable schemes or embedded credentials", () => {
  assert.equal(validHttpUrl("https://example.org/resource"), true);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://secret:password@example.org",
    "https://example.org/\npath",
  ])
    assert.equal(validHttpUrl(url), false);
});
