import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { ServerWorkspaces } from "../src/ServerWorkspaces.tsx";

test("an interrupted save retries its original ID, body and request key", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://example.test",
  });
  const names = [
    "window",
    "document",
    "HTMLElement",
    "IS_REACT_ACT_ENVIRONMENT",
    "fetch",
  ];
  const previous = new Map(
    names.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
  const attempts = [];
  for (const name of names.filter((name) => name !== "fetch"))
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: name === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[name],
    });
  Object.defineProperty(window, "isSecureContext", { value: true });
  document.cookie = "eliza_csrf=csrf-test";
  globalThis.fetch = async (path, options) => {
    if (options.method === "GET") return Response.json({ items: [] });
    attempts.push({
      path,
      body: options.body,
      key: options.headers.get("Idempotency-Key"),
      csrf: options.headers.get("X-Eliza-CSRF"),
    });
    if (attempts.length === 1) throw Error("Connection interrupted");
    return Response.json({
      id: path.split("/").at(-1),
      name: "Example",
      revision: 1,
    });
  };
  const root = createRoot(document.getElementById("root"));
  const button = (text) =>
    [...document.querySelectorAll("button")].find(
      (button) => button.textContent === text,
    );
  try {
    const workspace = { settings: { workspace: "Example" }, records: {} };
    await act(async () =>
      root.render(
        React.createElement(ServerWorkspaces, { workspace, restore: () => {} }),
      ),
    );
    await act(async () => button("Load server copies").click());
    await act(async () => button("Save new server copy").click());
    await act(async () =>
      root.render(
        React.createElement(ServerWorkspaces, {
          workspace: { ...workspace, records: { newData: [] } },
          restore: () => {},
        }),
      ),
    );
    await act(async () => button("Retry pending save").click());
    assert.equal(attempts.length, 2);
    assert.deepEqual(attempts[0], attempts[1]);
    assert.ok(attempts[0].key);
    assert.equal(attempts[0].csrf, "csrf-test");
    assert.ok(document.body.textContent.includes("Server copy saved."));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const name of names) {
      const descriptor = previous.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
