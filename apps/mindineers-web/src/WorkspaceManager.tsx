import type { WorkspaceIndex } from "./shared/contracts/workspace";
import { useState, useEffect, useRef } from "react";
export default function WorkspaceManager({
  index,
  activeName,
  onSwitch,
  onCreate,
  onClose,
}: {
  index: WorkspaceIndex;
  activeName: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const prior = document.activeElement;
    ref.current?.showModal();
    return () => {
      if (prior instanceof HTMLElement) prior.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label="Your workspaces"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">A HOME FOR EVERY CHAPTER</span>
          <h2>Your workspaces</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close workspaces"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p>
        Keep independent projects and teams in separate spaces. Each workspace
        is saved on this device.
      </p>
      <div className="workspace-picker">
        {index.items.map((item) => (
          <button
            className={item.id === index.active ? "active" : ""}
            key={item.id}
            onClick={() => onSwitch(item.id)}
          >
            <span className="workspace-avatar">
              {(item.id === index.active ? activeName : item.name)[0]}
            </span>
            <span>
              <strong>
                {item.id === index.active ? activeName : item.name}
              </strong>
              <small>
                {item.id === index.active
                  ? "Current workspace"
                  : "Open workspace"}
              </small>
            </span>
            {item.id === index.active && <span>✓</span>}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean = name.trim();
          if (!clean) {
            setError("Enter a workspace name.");
            return;
          }
          try {
            onCreate(clean);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to create workspace.",
            );
          }
        }}
      >
        <label>
          New workspace name
          <input
            maxLength={120}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product studio, research lab, personal…"
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="button dark">Create workspace</button>
        </div>
      </form>
      <p className="muted">
        Cloud organizations, shared membership, and synchronization will require
        your backend.
      </p>
    </dialog>
  );
}
