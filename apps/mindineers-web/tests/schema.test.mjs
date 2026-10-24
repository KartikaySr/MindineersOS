import test from "node:test";
import assert from "node:assert/strict";
import { schemaErrors } from "../src/schema-validation.js";
test("schema validation rejects invalid keywords, missing and external references", () => {
  assert.deepEqual(
    schemaErrors(
      JSON.stringify({
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      }),
    ),
    [],
  );
  assert.ok(schemaErrors('{"type":"bogus"}').length);
  assert.ok(schemaErrors('{"minimum":"zero"}').length);
  assert.ok(schemaErrors('{"$ref":"https://external.test/schema"}').length);
  assert.ok(schemaErrors('{"$ref":"#/definitions/absent"}').length);
  assert.deepEqual(
    schemaErrors(
      '{"definitions":{"x":{"type":"string"}},"$ref":"#/definitions/x"}',
    ),
    [],
  );
  assert.deepEqual(schemaErrors("false"), []);
  assert.ok(schemaErrors('{"required":["x","x"]}').length);
  assert.deepEqual(schemaErrors('{"enum":[{"a":1},{"a":2}]}'), []);
});
test("schema validation limits deeply nested and oversized input before recursive validation", () => {
  let schema = { type: "string" };
  for (let i = 0; i < 40; i++) schema = { properties: { x: schema } };
  assert.match(schemaErrors(JSON.stringify(schema)).join(" "), /complexity/);
  assert.match(schemaErrors(" ".repeat(50001)).join(" "), /50,000/);
});
