import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Send,
  X,
  Compass,
  ShieldCheck,
} from "lucide-react";
import { assistantReply } from "./experience-model";
const steps = [
  [
    "home",
    "Your day, in perspective",
    "Your dashboard brings together commitments, project progress, upcoming meetings and decisions. “Make it yours” lets you choose and reorder sections.",
    "Try capturing one mission from the dashboard.",
  ],
  [
    "missions",
    "Give ambition a next step",
    "Missions turn intentions into work with an owner, deadline, dependencies and acceptance criteria. A completed task should mean something.",
    "Open a mission to review its completion criteria.",
  ],
  [
    "documents",
    "Keep ideas and context together",
    "Create documents, sheets and presentations. Use comments and checkpoints to preserve the thinking behind your work.",
    "Create a document and save a checkpoint.",
  ],
  [
    "inbox",
    "Keep the important decisions yours",
    "Inspect destinations, exact payloads, scopes and expiry before recording a review. Local decisions do not execute external actions.",
    "Revising a request invalidates the previous decision.",
  ],
  [
    "agents",
    "Design your extended team",
    "Define agent roles and workflow drafts. Profiles describe responsibilities; execution begins only after the runtime is connected.",
    "Start with one useful role and clear boundaries.",
  ],
  [
    "profile",
    "Make yourself at home",
    "Edit your profile, choose light green or luxury dark, reduce motion, and keep your preferences. The Core guide is always one click away.",
    "You can replay this tour from your profile.",
  ],
];
export function GuidedTour({ settings, update, navigate, close }) {
  const step = Math.min(settings.tour?.step || 0, steps.length - 1),
    ref = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
  }, []);
  const progress = (next, state = "Active") =>
    update((d) => ({
      ...d,
      settings: { ...d.settings, tour: { step: next, state } },
    }));
  const pause = () => {
    progress(step, "Paused");
    close();
  };
  return (
    <dialog
      ref={ref}
      className="guided-tour"
      aria-label="Workspace guided tour"
      onCancel={(e) => {
        e.preventDefault();
        pause();
      }}
    >
      <header>
        <span>
          <Compass size={18} /> YOUR GUIDED TOUR
        </span>
        <button aria-label="Pause tour" onClick={pause}>
          <X size={20} />
        </button>
      </header>
      <div className="tour-visual" aria-hidden="true">
        <span>0{step + 1}</span>
        <div>{["◉", "↗", "▤", "✓", "✳", "◈"][step]}</div>
      </div>
      <span className="exp-kicker">
        STEP {step + 1} OF {steps.length}
      </span>
      <h2>{steps[step][1]}</h2>
      <p>{steps[step][2]}</p>
      <div className="tour-tip">{steps[step][3]}</div>
      <div
        className="tour-progress"
        aria-label={`Step ${step + 1} of ${steps.length}`}
      >
        {steps.map((s, i) => (
          <span key={s[0]} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <button
        className="exp-button"
        onClick={() => {
          navigate(steps[step][0]);
          progress(step, "Paused");
          close();
        }}
      >
        Explore this screen <ArrowRight size={16} />
      </button>
      <footer>
        <button onClick={pause}>Save & finish later</button>
        <div>
          <button disabled={step === 0} onClick={() => progress(step - 1)}>
            Back
          </button>
          <button
            className="exp-button primary"
            onClick={() => {
              if (step === steps.length - 1) {
                progress(step, "Complete");
                close();
              } else progress(step + 1);
            }}
          >
            {step === steps.length - 1 ? "Finish tour" : "Next"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </dialog>
  );
}
export function CoreAssistant({
  data,
  route,
  initialPrompt,
  onClose,
  navigate,
}) {
  const [input, setInput] = useState(""),
    [history, setHistory] = useState(() =>
      initialPrompt
        ? [
            {
              query: initialPrompt,
              ...assistantReply(initialPrompt, data, route),
            },
          ]
        : [],
    ),
    ref = useRef(),
    bottom = useRef();
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    return () => before?.focus();
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [history]);
  const ask = (text) => {
    if (!text.trim()) return;
    setHistory((h) =>
      [
        ...h,
        { query: text.trim(), ...assistantReply(text, data, route) },
      ].slice(-30),
    );
    setInput("");
  };
  return (
    <dialog
      ref={ref}
      className="core-assistant"
      aria-label="Mindineers Core guide"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <span className="core-symbol">✳</span>
        <div>
          <h2>Mindineers Core</h2>
          <span>YOUR WORKSPACE GUIDE</span>
        </div>
        <button aria-label="Close Core guide" onClick={onClose}>
          <X size={22} />
        </button>
      </header>
      <div className="core-context">
        <span className="exp-pill">Local navigation & summaries</span>
        <small>
          Context: {route} · {data.settings.workspace}
        </small>
      </div>
      <div className="core-history" role="log" aria-live="polite">
        {history.length === 0 && (
          <div className="core-intro">
            <Sparkles size={32} />
            <h3>
              A little help finding
              <br />
              your next move.
            </h3>
            <p>
              Find a feature, understand this page, or get a briefing from your
              saved commitments.
            </p>
          </div>
        )}
        {history.map((m, i) => (
          <div className="core-exchange" key={i}>
            <p className="core-question">{m.query}</p>
            <div className="core-answer">
              <span>✳</span>
              <p>{m.text}</p>
            </div>
            <div className="core-links">
              {m.links.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    navigate(id);
                    onClose();
                  }}
                >
                  {label}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="core-prompts">
        {["Give me a briefing", "Explain this page", "Find workflows"].map(
          (q) => (
            <button key={q} onClick={() => ask(q)}>
              {q}
            </button>
          ),
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label className="visually-hidden" htmlFor="core-query">
          Ask the Core guide
        </label>
        <input
          id="core-query"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Where would you like to go?"
          autoFocus
        />
        <button
          className="exp-button primary"
          aria-label="Send request"
          disabled={!input.trim()}
        >
          <Send size={17} />
        </button>
      </form>
      <footer>
        <ShieldCheck size={14} />
        <p>
          Uses local matching and record counts. Generative AI is not connected.
          Nothing is sent to a provider; this conversation clears when closed.
        </p>
        <button onClick={() => setHistory([])}>Clear</button>
      </footer>
    </dialog>
  );
}
