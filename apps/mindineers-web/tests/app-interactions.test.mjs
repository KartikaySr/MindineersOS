import test from "node:test";
import { MessageChannel } from "node:worker_threads";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

test("application routes mount and workspace recovery works through real UI events", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "http://localhost/#home",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const globals = [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLDialogElement",
    "localStorage",
    "location",
    "matchMedia",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "IS_REACT_ACT_ENVIRONMENT",
    "MessageChannel",
  ];
  const channels = [];
  class TestChannel extends MessageChannel {
    constructor() {
      super();
      channels.push(this);
    }
  }
  const original = new Map(
    globals.map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  for (const k of globals)
    Object.defineProperty(globalThis, k, {
      configurable: true,
      writable: true,
      value:
        k === "MessageChannel"
          ? TestChannel
          : k === "IS_REACT_ACT_ENVIRONMENT"
            ? true
            : typeof window[k] === "function" &&
                [
                  "matchMedia",
                  "requestAnimationFrame",
                  "cancelAnimationFrame",
                ].includes(k)
              ? window[k].bind(window)
              : window[k],
    });
  window.localStorage.setItem(
    "mindineers.workspace.v1",
    JSON.stringify({
      settings: {
        name: "QA",
        workspace: "Acceptance",
        theme: "Light",
        motion: true,
        notifications: true,
        budget: 50,
      },
      projects: [],
      agents: [],
      records: { missions: [], customers: [], calendar: [], files: [] },
      messages: [],
      posts: [],
      approvals: [],
      onboarded: true,
      connections: {},
      bookmarks: [],
    }),
  );
  const dir = await mkdtemp(join(tmpdir(), "mindineers-ui-"));
  const errors = [];
  const previousError = console.error;
  console.error = (...args) => {
    errors.push(args.map(String).join(" "));
  };
  try {
    const src = fileURLToPath(new URL("../src/", import.meta.url));
    const outfile = join(dir, "app.mjs");
    await build({
      stdin: {
        contents: `import React,{act} from 'react'; import {createRoot} from 'react-dom/client'; import App from '${src}main.jsx'; import {routeIds} from '${src}app/routes.ts'; export {act,routeIds}; export function mount(){const root=createRoot(document.getElementById('root'));root.render(React.createElement(App));return root;}`,
        resolveDir: fileURLToPath(new URL("..", import.meta.url)),
        loader: "jsx",
      },
      bundle: true,
      platform: "node",
      format: "esm",
      outfile,
      loader: { ".css": "empty" },
      banner: {
        js: "import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);",
      },
      logLevel: "silent",
    });
    const { act, mount, routeIds } = await import(pathToFileURL(outfile).href);
    let root;
    const flush = async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    };
    await act(async () => {
      root = mount();
      await flush();
    });
    async function route(id) {
      await act(async () => {
        window.history.replaceState({}, "", `/#${id}`);
        window.dispatchEvent(new window.HashChangeEvent("hashchange"));
        await flush();
      });
    }
    // The optional WebGL view needs real-browser GPU acceptance, not a DOM mock.
    for (const id of routeIds.filter((id) => id !== "office")) {
      await route(id);
      assert.ok(
        window.document.body.textContent.trim().length > 40,
        `Empty route: ${id}`,
      );
      assert.doesNotMatch(
        window.document.body.textContent,
        /Let’s get your workspace back|This screen could not load|This screen couldn’t open/,
        `Route failed: ${id}`,
      );
    }
    // Earlier phases remain reachable in both workspace surfaces after shell migration.
    for (const id of ["projects", "agents", "teams", "workflows", "documents", "knowledge", "engineering", "finance", "delivery", "models", "security"]) {
      await route(id);
      for (const mode of ["Overview", "Details & tools"]) {
        const toggle = [...window.document.querySelectorAll(".workspace-mode button")].find(el => el.textContent.trim() === mode);
        assert.ok(toggle, `${id} retains ${mode}`);
        await act(async () => { toggle.click(); await flush(); });
        assert.doesNotMatch(window.document.body.textContent, /This screen could not load|This screen couldn’t open/, `${id} ${mode} must mount`);
      }
    }
    await route("home");
    assert.ok([...window.document.querySelectorAll("a")].some(el => el.getAttribute("href") === "#office"), "Dashboard retains office access");
    await route("settings");
    const button = (text) =>
      [...window.document.querySelectorAll("button")].find(
        (el) => el.textContent.trim() === text,
      );
    await act(async () => {
      button("Details & tools").click();
      await flush();
    });
    assert.match(window.document.body.textContent, /Settings policy designer/);
    await act(async () => { button("Overview").click(); await flush(); });
    await act(async () => {
      [...window.document.querySelectorAll(".settings-nav button")].find(el => el.textContent.trim() === "Team").click();
      await flush();
    });
    assert.match(window.document.querySelector(".wb-detail h2").textContent, /Team/);
    await act(async () => { button("Workspace").click(); await flush(); });

    const field = [...window.document.querySelectorAll("label")]
      .find((el) => el.textContent.startsWith("Language"))
      ?.querySelector("input");
    assert.ok(field, "Language field present");
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set.call(field, "French");
      field.dispatchEvent(new window.Event("input", { bubbles: true }));
      await flush();
    });
    await act(async () => {
      button("Save Language").click();
      await flush();
    });
    assert.equal(
      JSON.parse(window.localStorage.getItem("mindineers.workspace.v1")).suite
        .settings.Workspace.language,
      "French",
    );
    await act(async () => {
      button("Undo workspace edit").click();
      await flush();
    });
    assert.ok(window.document.querySelector("dialog[open]"));
    await act(async () => {
      button("Confirm undo").click();
      await flush();
    });
    assert.equal(
      JSON.parse(window.localStorage.getItem("mindineers.workspace.v1")).suite
        ?.settings?.Workspace?.language,
      undefined,
    );
    await act(async () => {
      button("Redo workspace edit").click();
      await flush();
    });
    await act(async () => {
      button("Confirm redo").click();
      await flush();
    });
    assert.equal(
      JSON.parse(window.localStorage.getItem("mindineers.workspace.v1")).suite
        .settings.Workspace.language,
      "French",
    );
    await act(async () => root.unmount());
    assert.deepEqual(
      errors,
      [],
      "React warnings/errors during route and recovery interactions",
    );
  } finally {
    console.error = previousError;
    dom.window.close();
    for (const channel of channels) {
      channel.port1.close();
      channel.port2.close();
    }
    for (const k of globals) {
      const old = original.get(k);
      if (old) Object.defineProperty(globalThis, k, old);
      else delete globalThis[k];
    }
    await rm(dir, { recursive: true, force: true });
  }
});
