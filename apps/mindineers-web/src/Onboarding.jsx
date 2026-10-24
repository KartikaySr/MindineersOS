import React, { useState, useRef, useEffect } from "react";
export default function Onboarding({ settings, finish, draft, saveDraft }) {
  const ref = useRef(),
    [step, setStep] = useState(draft?.step || 0),
    [form, setForm] = useState(
      () =>
        draft?.form || {
          name: settings.name === "You" ? "" : settings.name,
          workspace: settings.workspace,
          theme: settings.theme,
          motion: settings.motion,
          examples: true,
          useCase: "Personal",
          tour: true,
          budget: settings.budget,
          autonomy: settings.autonomy || "Ask before acting",
        },
    );
  useEffect(() => {
    ref.current.showModal();
  }, []);
  useEffect(() => {
    saveDraft?.({ step, form });
  }, [step, form]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const pause = () => finish({ setupLater: true });
  return (
    <dialog
      ref={ref}
      className="onboarding"
      aria-label="Set up your workspace"
      onCancel={(e) => {
        e.preventDefault();
        pause();
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
          if (step < 2) setStep(step + 1);
          else
            finish({
              ...form,
              name: form.name.trim() || "You",
              workspace: form.workspace.trim() || "My workspace",
            });
        }}
      >
        <div className="onboard-top">
          <span>SETUP · {step + 1} OF 3</span>
          <button type="button" onClick={pause}>
            Set up later
          </button>
        </div>
        <h2>
          {
            ["Make it yours.", "Find your rhythm.", "You set the boundaries."][
              step
            ]
          }
        </h2>
        <p>
          {
            [
              "A workspace should feel like it belongs to you.",
              "Choose your atmosphere and a useful starting point.",
              "Keep authority and spending preferences explicit.",
            ][step]
          }
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
                onChange={(e) => set("name", e.target.value)}
                placeholder="What should we call you?"
              />
            </label>
            <label>
              Workspace name
              <input
                required
                maxLength={120}
                value={form.workspace}
                onChange={(e) => set("workspace", e.target.value)}
              />
            </label>
            <label>
              What brings you here?
              <select
                value={form.useCase}
                onChange={(e) => set("useCase", e.target.value)}
              >
                <option>Personal</option>
                <option>Founder</option>
                <option>Team</option>
              </select>
            </label>
          </>
        ) : step === 1 ? (
          <>
            <label>
              Appearance
              <select
                value={form.theme}
                onChange={(e) => set("theme", e.target.value)}
              >
                <option value="Light">Light green</option>
                <option value="Dark">Luxury dark</option>
              </select>
            </label>
            <label className="toggle-row">
              Include clearly labeled example projects and agents
              <input
                type="checkbox"
                checked={form.examples}
                onChange={(e) => set("examples", e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              Reduce motion
              <input
                type="checkbox"
                checked={form.motion}
                onChange={(e) => set("motion", e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              Start with a guided tour
              <input
                type="checkbox"
                checked={form.tour}
                onChange={(e) => set("tour", e.target.checked)}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Monthly budget preference (USD)
              <input
                type="number"
                min="0"
                max="1000000"
                step="1"
                required
                value={form.budget}
                onChange={(e) =>
                  set(
                    "budget",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
            <label>
              Authority preference
              <select
                value={form.autonomy}
                onChange={(e) => set("autonomy", e.target.value)}
              >
                <option>Ask before acting</option>
                <option>Draft and review</option>
              </select>
            </label>
            <div className="notice">
              These preferences do not enable execution or enforce a spending
              limit. Authentication, providers and cloud sync are not connected.
              Your records stay in this browser; export backups from Settings.
            </div>
            <a href="#integrations" onClick={pause}>
              Review optional connections later →
            </a>
          </>
        )}
        <div className="onboard-bottom">
          {step > 0 && (
            <button
              type="button"
              className="button"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          <button className="button dark">
            {step < 2 ? "Continue →" : "Open my workspace →"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
