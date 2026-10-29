import type { DecisionRecord } from "./shared/contracts/workspace";
export function routeReview(request: DecisionRecord, action: string, actor: string, values: {reviewer?: string; reason?: string; until?: string}, now = new Date()): DecisionRecord {
  if (request.state !== "Pending")
    throw new Error("Only pending requests can be routed.");
  let changes: Partial<DecisionRecord> = {};
  if (action === "Delegate" || action === "Escalate") {
    if (!values.reviewer?.trim() || !values.reason?.trim())
      throw new Error("Choose a reviewer and explain the handoff.");
    changes = {
      assignedReviewer: values.reviewer.trim(),
      escalated: action === "Escalate",
    };
  } else if (action === "Snooze") {
    const until = Date.parse(values.until || "");
    if (!Number.isFinite(until) || until <= now.getTime())
      throw new Error("Choose a future reminder time.");
    if (until >= Date.parse(request.expiresAt))
      throw new Error("Reminder must be before request expiry.");
    changes = { snoozedUntil: values.until || "" };
  } else if (action === "Wake") changes = { snoozedUntil: "" };
  else throw new Error("Unknown review action");
  return {
    ...request,
    ...changes,
    routing: [
      ...(request.routing || []),
      {
        id: crypto.randomUUID(),
        action,
        actor,
        at: now.toISOString(),
        reviewer: values.reviewer || "",
        reason: values.reason || "",
        until: values.until || "",
      },
    ],
  };
}
