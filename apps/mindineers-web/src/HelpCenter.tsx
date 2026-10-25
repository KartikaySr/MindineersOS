import type { Workspace } from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Empty } from "./ProductUI";
import { download } from "./product-model";
const guides = [
  [
    "Getting started",
    "Create a workspace, name your first project, and add a mission with a clear acceptance criterion. Example records can be included during setup.",
    "projects",
  ],
  [
    "Workspaces and backups",
    "Use the workspace switcher to keep independent projects separate. Export each workspace from Settings. JSON backups include records and configuration, but uploaded file binaries must be downloaded separately.",
    "settings",
  ],
  [
    "Mission planning",
    "Use Board, List, or Timeline. Assign an owner, set a priority and deadline, and connect dependencies. Finish acceptance criteria and dependencies before marking a mission done.",
    "missions",
  ],
  [
    "Conversation drafts",
    "Create a thread, choose project context, save messages, pin decisions, and create missions from useful messages. A backend is required for agent replies.",
    "chat",
  ],
  [
    "Workflow contracts",
    "Create nodes and dependencies, choose input/output types, add JSON schemas, and configure failure behavior. Resolve cycle and type errors before saving a workflow version.",
    "workflows",
  ],
  [
    "Reviewing actions",
    "Inspect the exact payload, destination, scopes, effects, and expiry. Approving a local request records a decision; it does not execute an external action. Editing a request invalidates its earlier decision.",
    "inbox",
  ],
  [
    "Documents, sheets and slides",
    "Create documents, simple sheets, and presentations. Use comments and version checkpoints before larger changes. Sheet formulas support basic arithmetic and SUM ranges.",
    "documents",
  ],
  [
    "Knowledge and memory",
    "Store sources with excerpts and dates. Confirm memories intentionally, distinguish facts from inferences, and choose the correct scope. Local forgetting removes the statement from this workspace.",
    "knowledge",
  ],
  [
    "Engineering changes",
    "Prepare file comparisons, record verification evidence, review changes, and write release and rollback plans. Repository writes and deployment require a connected backend.",
    "engineering",
  ],
  [
    "Integrations and credentials",
    "Configure account labels, required scopes, and regions. Provider secrets belong in the backend. No frontend field should contain an API secret.",
    "integrations",
  ],
  [
    "Recovery and conflicting edits",
    "If another tab changes the workspace, saving pauses until you choose a copy. Export your current copy before resolving the conflict. Damaged stored data is preserved for recovery.",
    "settings",
  ],
  [
    "Accessibility",
    "Use Tab to move between controls, Enter or Space to activate buttons, and Escape to close dialogs. The 3D office has agent buttons as an alternative. Reduce motion from Settings.",
    "settings",
  ],
  [
    "Usage and subscription",
    "Local counts show records on this device. Plan selection stores a preference. Real prices, entitlements, invoices, usage charges, and payments will come from the billing backend.",
    "usage",
  ],
  [
    "Execution traces",
    "Inspect the example trace or import a trace JSON file. Imported records are not authenticated. Live pause, resume, cancel, and checkpoint recovery require an authorized runtime.",
    "runs",
  ],
];
export default function HelpCenter({ data }: { data: Workspace }) {
  const [query, setQuery] = useState("");
  const filtered = guides.filter((g) =>
    (g[0] + " " + g[1]).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">HELP & LEARNING</span>
          <h2>A good place to find your next step.</h2>
          <p>Guides for your workspace, controls, and data.</p>
        </div>
        <Button
          onClick={() =>
            download("mindineers-diagnostics.json", {
              application: "MindineersOS",
              version: "0.2.0",
              createdAt: new Date().toISOString(),
              route: location.hash,
              online: navigator.onLine,
              counts: {
                projects: data.projects.length,
                agents: data.agents.length,
                records: Object.values(data.records).reduce(
                  (n, r) => n + r.length,
                  0,
                ),
              },
              included:
                "Counts and application state only. No record content, credentials, personal names, or file data.",
            })
          }
        >
          Export redacted diagnostics
        </Button>
      </div>
      <input
        className="product-search"
        aria-label="Search help"
        placeholder="Search guides…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="product-cards">
        {filtered.map(([title, body, route]) => (
          <article className="panel" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
            <a className="button" href={"#" + route}>
              Open workspace ↗
            </a>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <Empty title="No matching guide.">
          Try a different word such as workflow, backup, or calendar.
        </Empty>
      )}
      <div className="panel">
        <h3>Keyboard shortcuts</h3>
        <p>
          <kbd>⌘ / Ctrl K</kbd> Search your workspace ·{" "}
          <kbd>⌘ / Ctrl Enter</kbd> Save a conversation draft ·{" "}
          <kbd>Escape</kbd> Close a dialog
        </p>
      </div>
    </section>
  );
}
