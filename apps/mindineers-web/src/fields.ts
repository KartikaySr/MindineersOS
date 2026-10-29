export type FieldDefinition = [key: string, label: string, type: string, options?: string[]];
export const fields: Record<string, FieldDefinition[]> = {
  customers: [
    ["company", "Company", "text"],
    ["email", "Email", "email"],
    ["website", "Website", "url"],
  ],
  finance: [
    ["amount", "Draft amount (decimal)", "text"],
    ["currency", "Currency", "select", ["USD", "INR", "EUR", "GBP"]],
    ["due", "Due date", "date"],
  ],
  delivery: [
    ["customer", "Customer", "text"],
    ["due", "Due date", "date"],
    ["acceptance", "Acceptance criteria", "text"],
  ],
  research: [
    ["source", "Primary source URL", "url"],
    [
      "confidence",
      "Evidence status",
      "select",
      ["Unverified", "Source collected", "Human reviewed"],
    ],
  ],
  engineering: [
    ["repository", "Repository URL", "url"],
    ["branch", "Branch", "text"],
    ["verification", "Verification plan", "text"],
  ],
  creative: [
    [
      "channel",
      "Destination",
      "select",
      ["Internal", "Website", "Instagram", "LinkedIn", "Newsletter"],
    ],
    ["due", "Target date", "date"],
  ],
  knowledge: [
    ["source", "Source URL", "url"],
    ["visibility", "Intended scope", "select", ["Private", "Workspace"]],
  ],
  simulation: [
    ["boundary", "Environment", "select", ["Isolated simulation only"]],
    ["success", "Expected outcome", "text"],
  ],
  evaluations: [
    ["dataset", "Dataset reference", "text"],
    ["rubric", "Rubric", "text"],
    ["baseline", "Baseline reference", "text"],
  ],
  improvement: [
    ["baseline", "Baseline", "text"],
    ["evidence", "Evidence reference", "text"],
  ],
  missions: [
    ["due", "Target date", "date"],
    ["acceptance", "Definition of done", "text"],
  ],
  operations: [
    ["due", "Review date", "date"],
    ["accountable", "Accountable person", "text"],
  ],
  calendar: [
    ["time", "Time (local)", "time"],
    ["location", "Location", "text"],
  ],
  teams: [["members", "Members", "text"]],
  workflows: [
    [
      "trigger",
      "Trigger",
      "select",
      ["Manual", "Scheduled (not active)", "Event (not active)"],
    ],
    ["output", "Expected output", "text"],
  ],
};
