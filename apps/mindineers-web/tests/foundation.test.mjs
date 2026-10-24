import test from "node:test";
import assert from "node:assert/strict";
import {
  createHttpTransport,
  disconnectedTransport,
} from "../src/shared/services/transport.ts";
import { normalizeError, ServiceError } from "../src/shared/services/errors.ts";
import {
  readRoute,
  defaultWorkbench,
  navigationTitle,
  routeIds,
} from "../src/app/routes.ts";
import {
  readWorkspace,
  readIndex,
  writeIndex,
  workspaceKey,
} from "../src/shared/services/workspace-repository.ts";
const decode = (value) => {
  if (!value || typeof value.name !== "string") throw new Error("bad payload");
  return { name: value.name };
};
const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
  });
test("transport stays disconnected until explicitly configured", async () => {
  await assert.rejects(
    disconnectedTransport.request({ path: "/api/test", decode }),
    { code: "unavailable" },
  );
});
test("transport restricts paths and requires CSRF for writes without retrying", async () => {
  let calls = 0;
  let options;
  const fetcher = async (_url, init) => {
    calls++;
    options = init;
    return json({ name: "ok" });
  };
  const adapter = createHttpTransport("https://workspace.example", fetcher);
  for (const path of [
    "https://other.example/api/x",
    "//other.example/api/x",
    "/api/../private",
    "/api/x#fragment",
  ])
    await assert.rejects(adapter.request({ path, decode }), {
      code: "validation",
    });
  await assert.rejects(
    adapter.request({
      path: "/api/x",
      method: "POST",
      body: { name: "x" },
      decode,
    }),
    { code: "unauthorized" },
  );
  assert.equal(calls, 0);
  const authorized = createHttpTransport(
    "https://workspace.example",
    fetcher,
    () => "test-token",
  );
  assert.deepEqual(
    await authorized.request({
      path: "/api/x",
      method: "POST",
      body: { name: "x" },
      decode,
    }),
    { name: "ok" },
  );
  assert.equal(calls, 1);
  assert.equal(options.headers.get("X-CSRF-Token"), "test-token");
  assert.equal(options.redirect, "error");
  assert.equal(options.credentials, "same-origin");
});
test("transport validates responses and redacts server errors", async () => {
  for (const [status, code] of [
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not-found"],
    [409, "conflict"],
    [422, "validation"],
    [429, "rate-limit"],
    [500, "unavailable"],
  ]) {
    const adapter = createHttpTransport(
      "https://workspace.example",
      async () => new Response("secret payload", { status }),
    );
    await assert.rejects(
      adapter.request({ path: "/api/x", decode }),
      (error) => error.code === code && !error.message.includes("secret"),
    );
  }
  const invalid = createHttpTransport("https://workspace.example", async () =>
    json({ unexpected: "value" }),
  );
  await assert.rejects(invalid.request({ path: "/api/x", decode }), {
    code: "validation",
  });
  const huge = createHttpTransport(
    "https://workspace.example",
    async () =>
      new Response("{}", {
        headers: {
          "content-type": "application/json",
          "content-length": "99999999",
        },
      }),
  );
  await assert.rejects(huge.request({ path: "/api/x", decode }), {
    code: "validation",
  });
  assert.doesNotMatch(
    normalizeError(new Error("secret-token")).message,
    /secret/,
  );
  assert.equal(normalizeError(new ServiceError("conflict")).code, "conflict");
});
test("transport cancellation and timeout are distinguishable and never retried", async () => {
  let calls = 0;
  const pending = async (_url, options) => {
    calls++;
    return new Promise((_resolve, reject) =>
      options.signal.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      ),
    );
  };
  const adapter = createHttpTransport("https://workspace.example", pending);
  await assert.rejects(
    adapter.request({ path: "/api/x", decode, timeoutMs: 5 }),
    { code: "timeout" },
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    adapter.request({ path: "/api/x", decode, signal: controller.signal }),
    { code: "cancelled" },
  );
  assert.equal(calls, 1);
});
test("route registry preserves unknown routes and all default workspace modes", () => {
  assert.equal(readRoute("").id, "welcome");
  assert.deepEqual(readRoute("#documents"), { kind: "known", id: "documents" });
  assert.equal(readRoute("#missing").kind, "missing");
  assert.equal(
    navigationTitle("missing", "Overview"),
    "MindineersOS — Page not found",
  );
  assert.equal(defaultWorkbench("finance"), false);
  assert.equal(defaultWorkbench("workflows"), true);
  assert.equal(new Set(routeIds).size, routeIds.length);
});
test("repository rejects duplicate indexes and preserves read failures", () => {
  const broken = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {},
  };
  assert.equal(readWorkspace(broken, "original", () => ({})).data, null);
  const map = new Map(),
    store = {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => map.set(k, v),
    };
  assert.throws(
    () =>
      writeIndex(store, {
        active: "a",
        items: [
          { id: "a", name: "A" },
          { id: "a", name: "Duplicate" },
        ],
      }),
    /index/,
  );
  assert.throws(() => workspaceKey("../foreign-key"), /identifier/);
  assert.equal(readIndex(store).active, "original");
});

test("every existing navigation module has a registered route", async () => {
  const { modules } = await import("../src/data.js");
  for (const [id] of modules)
    assert.equal(readRoute("#" + id).kind, "known", id);
});
