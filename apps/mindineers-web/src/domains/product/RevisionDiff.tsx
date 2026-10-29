import { revisionDiff } from "./revision-diff";
export default function RevisionDiff({before, after}: {before: unknown; after: unknown}) {
  try {
    const changes = revisionDiff(before, after);
    return <section aria-label="Field-level revision changes">
      <p>{changes.length} changed {changes.length === 1 ? "field" : "fields"}. Arrays are compared as complete values to preserve ordering.</p>
      {changes.map(change => <article className="panel" key={change.path}>
        <h4>{change.path} · {change.kind}</h4>
        <div className="business-grid"><div><strong>Previous</strong><pre className="product-code"><del>{change.before}</del></pre></div><div><strong>Current</strong><pre className="product-code"><ins>{change.after}</ins></pre></div></div>
      </article>)}
    </section>;
  } catch { return <p role="alert">This revision is too complex for field comparison. Inspect the complete snapshots.</p>; }
}
