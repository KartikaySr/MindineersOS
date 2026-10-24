import { modules } from "./data.js";
export const dashboardSections = [
  "Priorities",
  "Projects",
  "Agenda",
  "Decisions",
  "Recent documents",
  "Agent roster",
];
export function dashboardSummary(data, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const order = [
    "Marked blocked",
    "Past its due date",
    "Due today",
    "Urgent priority",
    "High priority",
    "Open commitment",
  ];
  const priorities = (data.records.missions || [])
    .filter((m) => !["Done", "Cancelled", "Archived"].includes(m.status))
    .map((m) => ({
      ...m,
      reason:
        m.status === "Blocked"
          ? "Marked blocked"
          : m.due && m.due < today
            ? "Past its due date"
            : m.due === today
              ? "Due today"
              : m.priority === "Urgent"
                ? "Urgent priority"
                : m.priority === "High"
                  ? "High priority"
                  : "Open commitment",
    }))
    .sort((a, b) => order.indexOf(a.reason) - order.indexOf(b.reason));
  return {
    today,
    priorities,
    projects: data.projects.filter(
      (p) => !["Done", "Archived", "Completed"].includes(p.status),
    ),
    decisions: (data.product?.decisions || []).filter(
      (d) => d.state === "Pending",
    ),
    events: (data.records.calendar || [])
      .filter((e) => e.date >= today && e.status !== "Cancelled")
      .sort((a, b) =>
        (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
      ),
    documents: [...(data.product?.documents || [])].sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    ),
  };
}
export function assistantReply(query, data, route) {
  const q = query.trim().toLowerCase(),
    s = dashboardSummary(data);
  if (/brief|my day|priorit|attention/.test(q))
    return {
      text: `Your saved workspace has ${s.priorities.length} open missions, ${s.decisions.length} pending reviews and ${s.events.length} upcoming calendar entries. ${s.priorities[0] ? `First to inspect: ${s.priorities[0].name} — ${s.priorities[0].reason.toLowerCase()}.` : "Add a mission to begin planning."}${data.includesExamples ? " These counts include example content." : ""}`,
      links: [
        ["missions", "Inspect missions"],
        ["inbox", "Review decisions"],
        ["calendar", "Open calendar"],
      ],
    };
  if (/this page|where am i|explain/.test(q)) {
    const m = modules.find((m) => m[0] === route);
    return {
      text: m
        ? `${m[1]}: ${m[3]} Records are currently stored on this device; external actions require a connected service.`
        : "This is your personal workspace. Open help for feature guides.",
      links: [
        ["help", "Read product guides"],
        ["home", "Personal dashboard"],
      ],
    };
  }
  const destinations = [
    ...modules,
    ["profile", "Profile", "User", "Edit your name, avatar and preferences."],
    ["welcome", "Product website", "Home", "Explore MindineersOS."],
  ];
  const tokens = q
    .split(/\W+/)
    .filter(
      (t) =>
        t.length > 2 &&
        ![
          "open",
          "show",
          "find",
          "the",
          "where",
          "can",
          "how",
          "please",
        ].includes(t),
    );
  const matches = destinations
    .map((m) => ({
      m,
      score: tokens.filter((t) =>
        (m[0] + " " + m[1] + " " + m[3]).toLowerCase().includes(t),
      ).length,
    }))
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return matches.length
    ? {
        text: "These destinations match your request. Select one to navigate; your records will not be changed.",
        links: matches.map(({ m }) => [m[0], m[1]]),
      }
    : {
        text: "I can find platform features, explain this page, and summarize saved commitments. Generative AI is not connected yet. Try “show my priorities” or “open documents”.",
        links: [
          ["help", "Browse help"],
          ["integrations", "Connection settings"],
        ],
      };
}
export function validateExperience(settings) {
  const p = settings.profile;
  if (p !== undefined) {
    if (!p || typeof p !== "object" || Array.isArray(p))
      throw new Error("Invalid profile");
    for (const [k, v] of Object.entries(p))
      if (
        ![
          "email",
          "title",
          "bio",
          "pronouns",
          "timezone",
          "locale",
          "focus",
          "avatar",
          "useCase",
        ].includes(k) ||
        typeof v !== "string" ||
        v.length > (k === "avatar" ? 350000 : 2000)
      )
        throw new Error("Invalid profile field");
    if (
      p.avatar &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar)
    )
      throw new Error("Invalid avatar");
    if (p.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: p.timezone });
      } catch {
        throw new Error("Invalid time zone");
      }
    }
  }
  if (
    settings.dashboard !== undefined &&
    (!Array.isArray(settings.dashboard) ||
      new Set(settings.dashboard).size !== settings.dashboard.length ||
      settings.dashboard.some((x) => !dashboardSections.includes(x)))
  )
    throw new Error("Invalid dashboard layout");
  if (
    settings.tour !== undefined &&
    (!settings.tour ||
      !Number.isInteger(settings.tour.step) ||
      settings.tour.step < 0 ||
      settings.tour.step > 5 ||
      !["Active", "Paused", "Complete"].includes(settings.tour.state))
  )
    throw new Error("Invalid tour progress");
}
