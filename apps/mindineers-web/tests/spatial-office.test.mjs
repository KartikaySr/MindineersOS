import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SpatialOffice from "../src/SpatialOffice.tsx";

test("office team groups use explicit links, preserve 2D selection and hide activity by default", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://example.test",
  });
  const names = [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "IS_REACT_ACT_ENVIRONMENT",
  ];
  const old = new Map(
    names.map((n) => [n, Object.getOwnPropertyDescriptor(globalThis, n)]),
  );
  for (const n of names)
    Object.defineProperty(globalThis, n, {
      configurable: true,
      writable: true,
      value: n === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[n],
    });
  const root = createRoot(document.getElementById("root"));
  const selected = [];
  const props = {
    agents: [],
    onSelect: (id) => selected.push(id),
    reduced: true,
  };
  const change = async (label, value) => {
    const field = [...document.querySelectorAll("label")]
      .find((el) => el.textContent.startsWith(label))
      .querySelector("select");
    await act(async () => {
      field.value = value;
      field.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
  };
  try {
    await act(async () =>
      root.render(React.createElement(SpatialOffice, props)),
    );
    const low = [...document.querySelectorAll("label")]
      .find((el) => el.textContent.includes("Low-resource"))
      .querySelector("input");
    await act(async () => low.click());
    props.agents = Array.from({ length: 6 }, (_, i) => ({
      id: `a${i}`,
      name: `Agent ${i}`,
      role: i % 2 ? "Writer" : "Researcher",
      status: "Draft",
      color: "#008855",
      description: "",
      symbol: "A",
    }));
    props.teams = [{ id: "team", name: "Team", agentIds: ["a4", "missing"] }];
    props.posts = [
      {
        id: "p",
        agent: "Agent 4",
        title: "Recorded brief",
        body: "",
        likes: 0,
        comments: [],
      },
    ];
    await act(async () =>
      root.render(React.createElement(SpatialOffice, props)),
    );
    assert.doesNotMatch(document.body.textContent, /Recorded brief/);
    await change("Team group", "team");
    assert.match(document.body.textContent, /1 matching agents/);
    assert.doesNotMatch(document.body.textContent, /Agent 0/);
    const agentButton = [...document.querySelectorAll("button")].find(
      (el) => el.textContent === "Agent 4",
    );
    await act(async () => agentButton.click());
    assert.deepEqual(selected, ["a4"]);
    const activity = [...document.querySelectorAll("label")]
      .find((el) => el.textContent.includes("Show recorded"))
      .querySelector("input");
    await act(async () => activity.click());
    assert.match(document.body.textContent, /Recorded brief/);
    await change("Role", "Writer");
    assert.match(document.body.textContent, /No agents match/);
    assert.doesNotMatch(document.body.textContent, /Recorded brief/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const n of names) {
      const descriptor = old.get(n);
      if (descriptor) Object.defineProperty(globalThis, n, descriptor);
      else delete globalThis[n];
    }
  }
});
