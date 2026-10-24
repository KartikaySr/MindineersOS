import test from "node:test";
import assert from "node:assert/strict";
import {
  dashboardSummary,
  assistantReply,
  validateExperience,
} from "../src/experience-model.js";
const data = {
  settings: { name: "Test", workspace: "Test" },
  projects: [],
  agents: [],
  records: {
    missions: [
      { id: "1", name: "Done", status: "Done" },
      { id: "2", name: "Late", status: "Draft", due: "2026-10-22" },
      { id: "3", name: "Blocked", status: "Blocked" },
      { id: "4", name: "Today", status: "Draft", due: "2026-10-24" },
    ],
    calendar: [
      { name: "Past", date: "2026-10-22" },
      { name: "Next", date: "2026-10-25" },
      { name: "Cancelled", date: "2026-10-25", status: "Cancelled" },
    ],
  },
  product: { decisions: [{ state: "Approved" }, { state: "Pending" }] },
};
test("dashboard explains priorities, excludes completed work and cancelled/past events", () => {
  const s = dashboardSummary(data, new Date(2026, 9, 24, 12));
  assert.deepEqual(
    s.priorities.map((p) => p.name),
    ["Blocked", "Late", "Today"],
  );
  assert.equal(s.decisions.length, 1);
  assert.deepEqual(
    s.events.map((e) => e.name),
    ["Next"],
  );
});
test("Core navigation returns known destinations without executing requests", () => {
  const before = JSON.stringify(data);
  const r = assistantReply("open documents", data, "home");
  assert.ok(r.links.some((x) => x[0] === "documents"));
  assistantReply("delete all projects", data, "projects");
  assert.equal(JSON.stringify(data), before);
  assert.match(assistantReply("zzzzzz", data, "home").text, /not connected/);
});
test("Core briefings label examples and cite record destinations", () => {
  const r = assistantReply(
    "brief me",
    { ...data, includesExamples: true },
    "home",
  );
  assert.match(r.text, /example content/);
  assert.deepEqual(
    r.links.map((x) => x[0]),
    ["missions", "inbox", "calendar"],
  );
});
test("profile backup rejects unsafe avatars, invalid zones and unexpected fields", () => {
  assert.throws(
    () => validateExperience({ profile: { avatar: "javascript:alert(1)" } }),
    /avatar/,
  );
  assert.throws(
    () => validateExperience({ profile: { timezone: "Invalid/Zone" } }),
    /time zone/,
  );
  assert.throws(
    () => validateExperience({ profile: { password: "secret" } }),
    /field/,
  );
  assert.doesNotThrow(() =>
    validateExperience({
      profile: { timezone: "Asia/Kolkata", avatar: "", title: "Founder" },
    }),
  );
});
test("dashboard layout and resumable tour validate restore boundaries", () => {
  assert.throws(
    () => validateExperience({ dashboard: ["Projects", "Projects"] }),
    /layout/,
  );
  assert.throws(
    () => validateExperience({ tour: { step: 100, state: "Active" } }),
    /tour/,
  );
  assert.doesNotThrow(() =>
    validateExperience({ dashboard: [], tour: { step: 5, state: "Complete" } }),
  );
});
