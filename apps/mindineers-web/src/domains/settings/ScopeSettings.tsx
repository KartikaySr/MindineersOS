import type { Suite } from "./workbench-contracts";
import { useState, useId } from "react";
import { settingGroups } from "../../workbench-schema";
import { Button, Field } from "../../shared/ui/controls";
import {
  entityKey,
  resolveSetting,
  settingError,
  setOverride,
  undoOverride,
} from "./model";
import type { Layer } from "./model";
type Entity = { id: string; name?: string; title?: string };

type Undo = {
  target: string;
  key: string;
  expected: string | undefined;
  previous: string | undefined;
};
export default function ScopeSettings({
  suite,
  change,
  entities,
}: {
  suite: Suite;
  change: (fn: (current: Suite) => Suite) => void;
  entities: Record<string, Entity[]>;
}) {
  const scopes = ["Organization", "Workspace", "Project", "Agent", "Run"];
  const [scope, setScope] = useState("Workspace"),
    [group, setGroup] = useState("Profile");
  const [savedSelection, setSelection] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState(""),
    [undo, setUndo] = useState<Undo | null>(null);
  const selection = Object.fromEntries(
    Object.entries(savedSelection).filter(([name, id]) =>
      (entities[name] || []).some((entity) => entity.id === id),
    ),
  );
  const settings = suite.settings || {};
  const groups = settingGroups as Record<string, string[][]>;
  const target = selection[scope] ? entityKey(scope, selection[scope]!) : scope;
  const layers: Layer[] = scopes
    .slice(0, scopes.indexOf(scope) + 1)
    .flatMap((name) => [
      { id: name, label: `${name} defaults` },
      ...(selection[name]
        ? [
            {
              id: entityKey(name, selection[name]!),
              label: `${name}: ${(entities[name] || []).find((e) => e.id === selection[name])?.name || selection[name]}`,
            },
          ]
        : []),
    ]);
  function edit(key: string, value?: string) {
    if (value !== undefined && !key.startsWith("mandatory:")) {
      const error = settingError(key, value);
      if (error) {
        setNotice(error);
        return;
      }
    }
    setUndo({
      target,
      key,
      expected: value,
      previous: settings[target]?.[key],
    });
    change((current) => ({
      ...current,
      settings: setOverride(current.settings || {}, target, key, value),
    }));
    setNotice(
      value === undefined
        ? "Override removed. Inherited value restored."
        : "Local policy draft saved.",
    );
  }
  return (
    <section className="wb" aria-label="Settings policy designer">
      <div className="wb-banner">
        <strong>Settings policy designer</strong>
        <span>
          Local drafts only. Mandatory rules preview conflicts; the backend must
          enforce policies. Entity selections below define an explicit preview
          hierarchy, not verified relationships.
        </span>
      </div>
      <div className="wb-tabs" role="group" aria-label="Settings scope">
        {scopes.map((name) => (
          <Button
            key={name}
            aria-pressed={scope === name}
            onClick={() => {
              setScope(name);
              setUndo(null);
              setNotice("");
            }}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="wb-body">
        {scopes
          .filter((name) => entities[name]?.length)
          .map((name) => (
            <label className="wb-field" key={name}>
              <span>{name} preview target</span>
              <select
                value={selection[name] || ""}
                onChange={(e) => {
                  setSelection({ ...selection, [name]: e.target.value });
                  setUndo(null);
                }}
              >
                <option value="">Scope defaults</option>
                {entities[name]!.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name || entity.title || entity.id}
                  </option>
                ))}
              </select>
            </label>
          ))}
      </div>
      <div role="status" aria-live="polite">
        {notice}
      </div>
      {undo && (
        <Button
          onClick={() => {
            change((current) => {
              try {
                return {
                  ...current,
                  settings: undoOverride(
                    current.settings || {},
                    undo.target,
                    undo.key,
                    undo.expected,
                    undo.previous,
                  ),
                };
              } catch {
                return current;
              }
            });
            setNotice(
              settings[undo.target]?.[undo.key] === undo.expected
                ? "Last setting edit undone."
                : "Setting changed again; undo cancelled.",
            );
            setUndo(null);
          }}
        >
          Undo last setting edit
        </Button>
      )}
      <div className="wb-layout">
        <aside className="wb-records" aria-label="Setting categories">
          {Object.keys(groups).map((name) => (
            <Button
              key={name}
              aria-pressed={group === name}
              onClick={() => setGroup(name)}
            >
              {name}
            </Button>
          ))}
        </aside>
        <div className="wb-detail">
          <h2>
            {scope} · {group}
          </h2>
          <p>
            Editing {selection[scope] ? "selected entity" : "scope defaults"}.
            Clearing an override restores inheritance.
          </p>
          <div className="wb-body">
            {(groups[group] || []).map(
              ([key = "", label = "", fallback = ""]) => {
                const resolved = resolveSetting(
                  settings,
                  layers,
                  key,
                  fallback,
                );
                const inherited = resolveSetting(
                  settings,
                  layers.filter((layer) => layer.id !== target),
                  key,
                  fallback,
                );
                return (
                  <SettingRow
                    key={`${target}:${key}`}
                    label={label}
                    settingKey={key}
                    value={settings[target]?.[key] ?? resolved.value}
                    locked={inherited.locked}
                    source={resolved.source}
                    effectiveValue={resolved.value}
                    conflicts={resolved.conflicts}
                    mandatory={
                      settings[target]?.[`mandatory:${key}`] === "true"
                    }
                    overridden={Object.hasOwn(settings[target] || {}, key)}
                    onSave={(value) => edit(key, value)}
                    onReset={() => edit(key)}
                    onMandatory={(checked) =>
                      edit(`mandatory:${key}`, checked ? "true" : undefined)
                    }
                  />
                );
              },
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
function SettingRow({
  label,
  settingKey,
  value,
  locked,
  source,
  effectiveValue,
  conflicts,
  mandatory,
  overridden,
  onSave,
  onReset,
  onMandatory,
}: {
  label: string;
  settingKey: string;
  value: string;
  locked: boolean;
  source: string;
  effectiveValue: string;
  conflicts: string[];
  mandatory: boolean;
  overridden: boolean;
  onSave: (value: string) => void;
  onReset: () => void;
  onMandatory: (checked: boolean) => void;
}) {
  const [draft, setDraft] = useState(value),
    [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setDraft(value);
  }
  const fieldId = useId();
  const error = settingError(settingKey, draft);
  return (
    <div className="wb-policy">
      <Field
        label={label}
        value={draft}
        disabled={locked}
        maxLength={200}
        onChange={setDraft}
        aria-invalid={Boolean(error)}
        aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
      />
      {error && (
        <small id={`${fieldId}-error`} role="alert">
          {error}
        </small>
      )}
      <small id={`${fieldId}-hint`}>
        Effective value: {effectiveValue} · Source: {source}
        {locked ? " · Mandatory upstream rule" : ""}
      </small>
      {conflicts.length > 0 && (
        <p role="status">
          Conflicting overrides: {conflicts.join(", ")}. The mandatory value
          wins in this preview.
        </p>
      )}
      <Button
        disabled={locked || !!error || draft === value}
        onClick={() => onSave(draft)}
      >
        Save {label}
      </Button>
      {overridden && <Button onClick={onReset}>Use inherited {label}</Button>}
      <label>
        <input
          type="checkbox"
          checked={mandatory}
          disabled={locked}
          onChange={(e) => onMandatory(e.target.checked)}
        />{" "}
        Mandatory {label} for lower scopes (draft)
      </label>
    </div>
  );
}
