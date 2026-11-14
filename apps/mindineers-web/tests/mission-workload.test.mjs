import test from "node:test";
import assert from "node:assert/strict";
import { missionWorkload } from "../src/MissionViews.tsx";
test("filtered workloads resolve prerequisites against the full workspace and retain unassigned blockers", () => {
  const all = [
    { id: "done", owner: "A", status: "Done" },
    { id: "review", owner: "A", status: "In review", dependsOn: ["done"] },
    { id: "blocked", owner: "", status: "Planned", dependsOn: ["missing"] },
  ];
  assert.deepEqual(missionWorkload(all.slice(1), all), [
    { owner: "A", open: 1, blocked: 0, review: 1, done: 0 },
    { owner: "Unassigned", open: 1, blocked: 1, review: 0, done: 0 },
  ]);
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MissionViews from "../src/MissionViews.tsx";
test("dependency map shows filtered-out neighbors and unresolved prerequisites", () => {
  const focus = {
    id: "build",
    name: "Build",
    dependsOn: ["design", "missing"],
  };
  const html = renderToStaticMarkup(
    createElement(MissionViews, {
      view: "Dependencies",
      tasks: [focus],
      select: () => {},
      allTasks: [
        focus,
        { id: "design", name: "Design" },
        { id: "ship", name: "Ship", dependsOn: ["build"] },
      ],
    }),
  );
  const map = html
    .split('aria-label="Dependency map"')[1]
    .split("</section>")[0];
  for (const label of [
    "Design",
    "Build",
    "Ship",
    "Missing prerequisite: missing",
  ])
    assert.ok(map.includes(label));
});
