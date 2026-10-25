import type {
  Workspace,
  WorkspaceUpdate,
  ProductCollections,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Field, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export default function RuntimeSettings({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
  route?: string;
}) {
  const [profiles, setProfiles] = useCollection(data, update, "modelProfiles"),
    [devices, setDevices] = useCollection(data, update, "devices"),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("Models");
  type Model = ProductCollections["modelProfiles"][number];
  type Device = ProductCollections["devices"][number];
  type Row = Model | Device;
  const setRows = (fn: (rows: Row[]) => Row[]) => {
    if (tab === "Models")
      setProfiles((rows) =>
        fn(rows).filter((r): r is Model => "provider" in r),
      );
    else
      setDevices((rows) =>
        fn(rows).filter((r): r is Device => "directories" in r),
      );
  };
  const rows: Row[] = tab === "Models" ? profiles : devices,
    profile = rows.find((r) => r.id === selected) || rows[0];
  const patch = (value: Partial<Model & Device>) =>
    setRows((all) =>
      all.map((r) => (r.id === profile?.id ? { ...r, ...value } : r)),
    );
  const create = () => {
    const r =
      tab === "Models"
        ? {
            id: uid(),
            name: "New model profile",
            provider: "Compatible API",
            model: "",
            endpoint: "",
            region: "",
            context: "32000",
            fallback: "",
            transfer: "Ask before cloud transfer",
            enabled: true,
          }
        : {
            id: uid(),
            name: "New device",
            endpoint: "",
            directories: "",
            memory: "8",
            concurrency: "2",
            permissions: "Read only",
            enabled: false,
          };
    setRows((all) => [r, ...all]);
    setSelected(r.id);
  };
  return (
    <section className="product-page">
      <div className="product-banner">
        <div>
          <span className="eyebrow">MODELS & COMPUTE</span>
          <h2>The right resources for the work.</h2>
          <p>
            Configure model choices, fallback preferences, local devices, and
            data boundaries.
          </p>
        </div>
        <span className="badge">Runtime disconnected</span>
      </div>
      <div className="toolbar">
        <Tabs
          values={["Models", "Devices"]}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setSelected("");
          }}
        />
        <Button onClick={create}>
          + {tab === "Models" ? "Model profile" : "Device profile"}
        </Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {rows.map((r) => (
            <button
              key={r.id}
              className={r.id === profile?.id ? "active" : ""}
              onClick={() => setSelected(r.id)}
            >
              <strong>{r.name}</strong>
              <small>
                {r.enabled ? "Configured" : "Disabled"} · not connected
              </small>
            </button>
          ))}
        </aside>
        {profile ? (
          <article className="product-detail">
            <Field
              label="Profile name"
              value={profile.name}
              onChange={(name) => patch({ name })}
            />
            {"provider" in profile ? (
              <>
                <div className="product-form-grid">
                  <Field
                    label="Provider"
                    options={[
                      "Compatible API",
                      "OpenAI",
                      "Anthropic",
                      "Google AI",
                      "Local endpoint",
                    ]}
                    value={profile.provider}
                    onChange={(provider) => patch({ provider })}
                  />
                  <Field
                    label="Model identifier"
                    value={profile.model}
                    onChange={(model) => patch({ model })}
                  />
                  <Field
                    label="Endpoint URL"
                    type="url"
                    value={profile.endpoint}
                    onChange={(endpoint) => patch({ endpoint })}
                  />
                  <Field
                    label="Data region"
                    value={profile.region}
                    onChange={(region) => patch({ region })}
                  />
                  <Field
                    label="Context token limit"
                    type="number"
                    min="1"
                    value={profile.context}
                    onChange={(context) => patch({ context })}
                  />
                  <Field
                    label="Fallback model identifier"
                    value={profile.fallback}
                    onChange={(fallback) => patch({ fallback })}
                  />
                </div>
                <Field
                  label="Cloud transfer policy"
                  options={[
                    "Ask before cloud transfer",
                    "Local only",
                    "Allow authorized workspace data",
                  ]}
                  value={profile.transfer}
                  onChange={(transfer) => patch({ transfer })}
                />
              </>
            ) : (
              <>
                <Field
                  label="Device endpoint"
                  type="url"
                  value={profile.endpoint}
                  onChange={(endpoint) => patch({ endpoint })}
                />
                <Field
                  label="Allowed directories (one per line)"
                  type="textarea"
                  value={profile.directories}
                  onChange={(directories) => patch({ directories })}
                />
                <div className="product-form-grid">
                  <Field
                    label="Memory ceiling (GB)"
                    type="number"
                    min="1"
                    value={profile.memory}
                    onChange={(memory) => patch({ memory })}
                  />
                  <Field
                    label="Concurrency limit"
                    type="number"
                    min="1"
                    value={profile.concurrency}
                    onChange={(concurrency) => patch({ concurrency })}
                  />
                </div>
                <Field
                  label="File access"
                  options={["Read only", "Write with approval"]}
                  value={profile.permissions}
                  onChange={(permissions) => patch({ permissions })}
                />
              </>
            )}
            <div className="wb-actions">
              <Button onClick={() => patch({ enabled: !profile.enabled })}>
                {profile.enabled ? "Disable preference" : "Enable preference"}
              </Button>
              <Button onClick={() => download("runtime-profile.json", profile)}>
                Export configuration
              </Button>
              <Button disabled>Test connection</Button>
            </div>
            <p className="notice">
              Configuration does not start a worker or grant device access.
              Credentials belong in the backend secret store.
            </p>
          </article>
        ) : (
          <Empty title="Choose how work will run.">
            Create a profile to prepare the model or device configuration.
          </Empty>
        )}
      </div>
    </section>
  );
}
