import { useState } from "react";
import { configDiff } from "./model";
export default function ConfigurationDiff({
  current,
  versions,
}: {
  current: unknown;
  versions: { id: string; at: string; values: unknown; graph?: unknown }[];
}) {
  const [id, setId] = useState("");
  const selected = versions.find((v) => v.id === id) ?? versions[0];
  const changes = selected
    ? configDiff({ fields: selected.values, graph: selected.graph }, current)
    : [];
  return (
    <section>
      <h3>Configuration changes</h3>
      {selected ? (
        <>
          <label className="product-field">
            Compare current draft against
            <select value={selected.id} onChange={(e) => setId(e.target.value)}>
              {versions.map((v) => (
                <option value={v.id} key={v.id}>
                  {v.at}
                </option>
              ))}
            </select>
          </label>
          {changes.length ? (
            changes.map((d) => (
              <article className="panel" key={d.path}>
                <strong>{d.path}</strong>
                <div className="business-grid">
                  <div>
                    <h4>Saved version</h4>
                    <pre className="business-prose">{d.before}</pre>
                  </div>
                  <div>
                    <h4>Current draft</h4>
                    <pre className="business-prose">{d.after}</pre>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p>No configuration changes from this version.</p>
          )}
        </>
      ) : (
        <p>Save a version to compare subsequent configuration changes.</p>
      )}
    </section>
  );
}
