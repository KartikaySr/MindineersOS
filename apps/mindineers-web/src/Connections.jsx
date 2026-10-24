import Lifecycle from "./domains/administration/Lifecycle";
import React, { useState } from "react";
const providers = [
  [
    "google",
    "Google Workspace",
    "Mail, Calendar, Drive, Docs and Sheets",
    "Productivity",
    "G",
    ["Read selected files", "Read calendar events", "Create draft messages"],
  ],
  [
    "github",
    "GitHub",
    "Repositories, issues, pull requests and checks",
    "Engineering",
    "GH",
    ["Read repositories", "Read issues", "Create pull requests"],
  ],
  [
    "slack",
    "Slack",
    "Channels, conversations and notifications",
    "Communication",
    "S",
    ["Read selected channels", "Draft messages"],
  ],
  [
    "notion",
    "Notion",
    "Pages, databases and team knowledge",
    "Productivity",
    "N",
    ["Read selected pages", "Create pages"],
  ],
  [
    "microsoft",
    "Microsoft 365",
    "Outlook, Teams, OneDrive and Office",
    "Productivity",
    "M",
    ["Read calendar", "Read selected files", "Draft email"],
  ],
  [
    "openai",
    "OpenAI",
    "Reasoning, language and multimodal models",
    "AI models",
    "O",
    ["Model inference"],
  ],
  [
    "anthropic",
    "Anthropic",
    "Claude reasoning and tool use",
    "AI models",
    "A",
    ["Model inference"],
  ],
  [
    "gemini",
    "Google AI",
    "Gemini reasoning and multimodal models",
    "AI models",
    "G",
    ["Model inference"],
  ],
  [
    "meta",
    "Meta Business",
    "Business messaging and publishing",
    "Communication",
    "∞",
    ["Read business account", "Draft content", "Publish approved content"],
  ],
  [
    "local",
    "Local inference",
    "Local model endpoints and private compute",
    "AI models",
    "L",
    ["Local inference"],
  ],
  [
    "linear",
    "Linear",
    "Issues, cycles and delivery planning",
    "Engineering",
    "L",
    ["Read issues", "Create issues"],
  ],
  [
    "stripe",
    "Stripe",
    "Subscription and billing records",
    "Business",
    "S",
    ["Read billing records"],
  ],
  [
    "hubspot",
    "HubSpot",
    "Contacts, companies and deals",
    "Business",
    "H",
    ["Read contacts", "Create draft updates"],
  ],
  [
    "custom",
    "Custom API",
    "Connect an approved service through your backend",
    "Developer",
    "↗",
    ["Custom scopes"],
  ],
];
export default function Connections({ data, update }) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All"),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState("Catalog");
  const configs = data.connectionProfiles || {};
  const provider = providers.find((p) => p[0] === selected);
  const config = configs[selected] || {
    account: "",
    scopes: [],
    notes: "",
    region: "Unspecified",
  };
  const patch = (value) =>
    update((d) => ({
      ...d,
      connectionProfiles: {
        ...d.connectionProfiles,
        [selected]: {
          ...config,
          ...value,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  return (
    <section className="connections">
      <div className="connection-hero">
        <div>
          <span className="eyebrow">YOUR WORK, CONNECTED</span>
          <h2>
            Bring your world
            <br />
            into one workspace.
          </h2>
          <p>
            Choose the tools your team relies on. Define account boundaries and
            access before connecting.
          </p>
        </div>
        <div className="connection-orbit" aria-hidden="true">
          <span>G</span>
          <span>GH</span>
          <span>m✳</span>
          <span>A</span>
          <span>S</span>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs">
          {["Catalog", "Configured"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
              key={t}
            >
              {t}
              {t === "Configured" ? " · " + Object.keys(configs).length : ""}
            </button>
          ))}
        </div>
        <span className="badge">Backend not connected</span>
      </div>
      <div className="mission-filters">
        <input
          aria-label="Search integrations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find your tools…"
        />
        <select
          aria-label="Integration category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["All", ...new Set(providers.map((p) => p[3]))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="connection-workspace">
        <div className="integration-grid">
          {providers
            .filter(
              (p) =>
                (category === "All" || p[3] === category) &&
                (p[1] + " " + p[2])
                  .toLowerCase()
                  .includes(search.toLowerCase()) &&
                (tab === "Catalog" || configs[p[0]]),
            )
            .map(([id, name, desc, cat, letter]) => (
              <button
                className={
                  "integration-card connection-card " +
                  (selected === id ? "active" : "")
                }
                key={id}
                onClick={() => setSelected(id)}
              >
                <span className="integration-logo">{letter}</span>
                <span className="badge">{cat}</span>
                <h3>{name}</h3>
                <p>{desc}</p>
                <span className="connection-card-action">
                  {configs[id] ? "Edit configuration" : "Configure"} ↗
                </span>
              </button>
            ))}
        </div>
        {provider && (
          <aside className="connection-inspector">
            <div className="wb-row">
              <h2>{provider[1]}</h2>
              <button
                className="icon-button"
                aria-label="Close integration details"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <span className="badge">Not connected</span>
            <label>
              Account label
              <input
                value={config.account}
                maxLength={120}
                onChange={(e) => patch({ account: e.target.value })}
                placeholder="Work account, personal account…"
              />
            </label>
            <fieldset>
              <legend>Requested access</legend>
              {provider[5].map((scope) => (
                <label key={scope}>
                  <input
                    type="checkbox"
                    checked={config.scopes.includes(scope)}
                    onChange={(e) =>
                      patch({
                        scopes: e.target.checked
                          ? [...config.scopes, scope]
                          : config.scopes.filter((s) => s !== scope),
                      })
                    }
                  />
                  {scope}
                </label>
              ))}
            </fieldset>
            <label>
              Preferred data region
              <select
                value={config.region}
                onChange={(e) => patch({ region: e.target.value })}
              >
                {[
                  "Unspecified",
                  "India",
                  "European Union",
                  "United States",
                  "Local device",
                ].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Configuration notes
              <textarea
                rows={4}
                value={config.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Allowed resources, mapping requirements…"
              />
            </label>
            <Lifecycle
              key={provider[0]}
              data={data}
              update={update}
              provider={provider[0]}
              account={config.account}
              scopes={config.scopes}
            />
            <button className="button dark" disabled>
              Connect account
            </button>
            <p className="muted">
              Account connection will be enabled by the backend. Credentials and
              OAuth tokens are never requested by this frontend.
            </p>
            {configs[selected] && (
              <button
                className="button"
                onClick={() =>
                  update((d) => {
                    const next = { ...d.connectionProfiles };
                    delete next[selected];
                    return { ...d, connectionProfiles: next };
                  })
                }
              >
                Remove configuration
              </button>
            )}
          </aside>
        )}
      </div>
      {tab === "Configured" && !Object.keys(configs).length && (
        <div className="empty">
          <h2>Your tools belong here.</h2>
          <p>
            Choose an integration from the catalog to prepare its configuration.
          </p>
          <button className="button" onClick={() => setTab("Catalog")}>
            Browse catalog
          </button>
        </div>
      )}
    </section>
  );
}
