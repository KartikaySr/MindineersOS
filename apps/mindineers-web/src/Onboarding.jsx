import React, { useState, useRef, useEffect } from "react";
export default function Onboarding({ settings, finish }) {
  const ref = useRef(),
    [step, setStep] = useState(0),
    [form, setForm] = useState({
      name: settings.name === "You" ? "" : settings.name,
      workspace: settings.workspace,
      theme: settings.theme,
      motion: settings.motion,
      examples: true,
    });
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="onboarding"
      aria-label="Set up your workspace"
      onCancel={(e) => {
        e.preventDefault();
        finish({});
      }}
    >
      <div className="onboard-art">
        <span className="brand-icon">m✳</span>
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          A little space.
          <br />A bigger possibility.
        </h1>
        <div className="onboard-orb">✳</div>
        <p>
          One place for your ideas, your work,
          <br />
          and the team you’re building.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) setStep(1);
          else
            finish({
              ...form,
              name: form.name.trim() || "You",
              workspace: form.workspace.trim() || "My workspace",
            });
        }}
      >
        <div className="onboard-top">
          <span>SETUP · {step + 1} OF 2</span>
          <button type="button" onClick={() => finish({})}>
            Set up later
          </button>
        </div>
        <h2>{step === 0 ? "Make it yours." : "Find your rhythm."}</h2>
        <p>
          {step === 0
            ? "A workspace should feel like it belongs to you."
            : "Choose how you want your workspace to feel."}
        </p>
        {step === 0 ? (
          <>
            <label>
              Your name
              <input
                autoFocus
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="What should we call you?"
              />
            </label>
            <label>
              Workspace name
              <input
                required
                maxLength={120}
                value={form.workspace}
                onChange={(e) =>
                  setForm({ ...form, workspace: e.target.value })
                }
              />
            </label>
          </>
        ) : (
          <>
            <label className="toggle-row">
              Include example projects and agent profiles
              <input
                type="checkbox"
                checked={form.examples}
                onChange={(e) =>
                  setForm({ ...form, examples: e.target.checked })
                }
              />
            </label>
            <label>
              Appearance
              <select
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              >
                <option>Light</option>
                <option>Dark</option>
              </select>
            </label>
            <label className="toggle-row">
              Reduce motion
              <input
                type="checkbox"
                checked={form.motion}
                onChange={(e) => setForm({ ...form, motion: e.target.checked })}
              />
            </label>
            <div className="notice">
              Your work is saved in this browser. Export backups from Settings.
              Cloud sync and agent execution will be available when your backend
              is connected.
            </div>
          </>
        )}
        <div className="onboard-bottom">
          {step > 0 && (
            <button type="button" className="button" onClick={() => setStep(0)}>
              Back
            </button>
          )}
          <button className="button dark">
            {step === 0 ? "Continue →" : "Open my workspace →"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
