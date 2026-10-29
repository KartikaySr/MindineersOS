import { useState } from "react";
import type { Workspace } from "../../shared/contracts/workspace";
import { Button } from "../../ProductUI";
import { parseWorkspace } from "../../shared/services/workspace-repository";
import RevisionDiff from "../product/RevisionDiff";
export function conflictSections(local: Workspace, incoming: Workspace): string[] {
  return [...new Set([...Object.keys(local), ...Object.keys(incoming)])].filter(key => JSON.stringify(local[key]) !== JSON.stringify(incoming[key]));
}
export function resolveConflict(local: Workspace, incoming: Workspace, choices: Record<string, "local" | "incoming">): Workspace {
  const result: Record<string, unknown> = {...local};
  for (const key of conflictSections(local, incoming)) {
    if (!Object.hasOwn(choices, key)) throw new Error("Choose a version for every changed section.");
    const source = choices[key] === "incoming" ? incoming : local;
    if (Object.hasOwn(source, key)) result[key] = source[key];
    else delete result[key];
  }
  return parseWorkspace(result);
}
export default function ConflictReview({local, incoming, commit, exportLocal}: {local: Workspace; incoming: Workspace; commit: (result: Workspace, expected: Workspace) => void; exportLocal: () => void}) {
  const [choices, setChoices] = useState<Record<string, "local" | "incoming">>({});
  const [message, setMessage] = useState("");
  const sections = conflictSections(local, incoming);
  const chooseAll = (source: "local" | "incoming") => setChoices(Object.fromEntries(sections.map(key => [key, source])));
  return <section className="panel" aria-label="Review workspace conflict">
    <h2>Review changes from another tab</h2>
    <p>Saving is paused. Choose the open or incoming copy of each section, then confirm. Related records within each section stay together. Review links across sections after combining copies. This resolves local tab conflicts; it does not synchronize a team.</p>
    <div className="wb-actions"><Button onClick={exportLocal}>Export open copy</Button><Button onClick={() => chooseAll("local")}>Choose all open</Button><Button onClick={() => chooseAll("incoming")}>Choose all incoming</Button></div>
    {sections.map(key => <details key={key}><summary>{key} · {choices[key] || "Choice required"}</summary>
      <RevisionDiff before={local[key]} after={incoming[key]} />
      <fieldset><legend>Keep which {key}?</legend>{(["local", "incoming"] as const).map(source => <label key={source}><input type="radio" name={`conflict-${key}`} checked={choices[key] === source} onChange={() => setChoices(v => ({...v, [key]: source}))} />{source === "local" ? "Open copy" : "Incoming copy"}</label>)}</fieldset>
    </details>)}
    <Button disabled={sections.some(key => !choices[key])} onClick={() => {try {commit(resolveConflict(local, incoming, choices), incoming);} catch(e) {setMessage(e instanceof Error ? e.message : "Unable to resolve conflict.");}}}>Confirm reviewed resolution</Button>
    {message && <p role="alert">{message}</p>}
  </section>;
}
