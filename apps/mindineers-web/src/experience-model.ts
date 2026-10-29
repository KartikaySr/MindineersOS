function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export const dashboardSections = [
  "Priorities",
  "Projects",
  "Agenda",
  "Decisions",
  "Recent documents",
  "Agent roster",
  "Office preview",
];
export {
  dashboardSummary,
  assistantReply,
} from "./shared/experience-queries.ts";
export function validateExperience(settings: Record<string, unknown>) {
  const p = settings.profile;
  if (p !== undefined) {
    if (!isRecord(p)) throw new Error("Invalid profile");
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
      typeof p.avatar === "string" &&
      p.avatar &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar)
    )
      throw new Error("Invalid avatar");
    if (typeof p.timezone === "string" && p.timezone) {
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
    (!isRecord(settings.tour) ||
      typeof settings.tour.step !== "number" ||
      typeof settings.tour.state !== "string" ||
      !Number.isInteger(settings.tour.step) ||
      settings.tour.step < 0 ||
      settings.tour.step > 5 ||
      !["Active", "Paused", "Complete"].includes(settings.tour.state))
  )
    throw new Error("Invalid tour progress");
}
