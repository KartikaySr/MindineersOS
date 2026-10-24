import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Compass,
  Check,
  Target,
  CalendarDays,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { dashboardSections, dashboardSummary } from "./experience-model";
import { Dialog } from "./ProductUI";
const sectionRoutes = {
  Priorities: "missions",
  Projects: "projects",
  Agenda: "calendar",
  Decisions: "inbox",
  "Recent documents": "documents",
  "Agent roster": "agents",
};
export default function PersonalDashboard({
  data,
  update,
  startTour,
  openAssistant,
  createMission,
  createProject,
}) {
  const [customize, setCustomize] = useState(false),
    [note, setNote] = useState("");
  const s = dashboardSummary(data),
    layout = data.settings.dashboard || dashboardSections;
  const saveLayout = (next) =>
    update((d) => ({ ...d, settings: { ...d.settings, dashboard: next } }));
  const move = (name, direction) => {
    const next = [...layout],
      i = next.indexOf(name),
      j = i + direction;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    saveLayout(next);
  };
  const row = (name, description, route, key) => (
    <a key={key || name} className="dashboard-row" href={"#" + route}>
      <div>
        <strong>{name}</strong>
        <span>{description}</span>
      </div>
      <ArrowRight size={16} />
    </a>
  );
  const empty = (text, route) => (
    <div className="dashboard-empty">
      <p>{text}</p>
      <a href={"#" + route}>
        Get started <ArrowRight size={14} />
      </a>
    </div>
  );
  const content = {
    Priorities: s.priorities.length
      ? s.priorities
          .slice(0, 5)
          .map((m) =>
            row(
              m.name,
              `${m.reason} · ${m.owner || "Unassigned"}`,
              "missions",
              m.id,
            ),
          )
      : empty("A clear space. Capture your first commitment.", "missions"),
    Projects: s.projects.length
      ? s.projects.slice(0, 4).map((p) => (
          <a className="dashboard-project" href="#projects" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <span>{p.progress}%</span>
            </div>
            <progress
              aria-label={p.name + " progress"}
              value={p.progress}
              max={100}
            />
            <small>{p.status} · User-entered progress</small>
          </a>
        ))
      : empty("Give your next idea a home.", "projects"),
    Agenda: s.events.length
      ? s.events
          .slice(0, 4)
          .map((e) =>
            row(
              e.name,
              `${e.date} · ${e.time || "All day"}${e.timezone ? " · " + e.timezone : ""}`,
              "calendar",
              e.id,
            ),
          )
      : empty("No upcoming commitments on your calendar.", "calendar"),
    Decisions: s.decisions.length
      ? s.decisions
          .slice(0, 4)
          .map((d) =>
            row(
              d.name,
              `${d.destination} · ${Date.parse(d.expiresAt) < Date.now() ? "Expired — revise before review" : "Awaiting your review"}`,
              "inbox",
              d.id,
            ),
          )
      : empty("Nothing waiting for review.", "inbox"),
    "Recent documents": s.documents.length
      ? s.documents
          .slice(0, 4)
          .map((d) =>
            row(
              d.name,
              `${d.kind} · Updated ${d.updatedAt.slice(0, 10)}`,
              "documents",
              d.id,
            ),
          )
      : empty("Your ideas deserve more than an open tab.", "documents"),
    "Agent roster": data.agents.length
      ? data.agents
          .slice(0, 4)
          .map((a) => row(a.name, `${a.role} · Profile only`, "agents", a.id))
      : empty("Define the roles that support your work.", "agents"),
  };
  return (
    <div className="personal-dashboard">
      <header className="dashboard-heading">
        <div>
          <span className="exp-kicker">YOUR PERSONAL COMMAND CENTER</span>
          <h1>
            A little clarity,{" "}
            {data.settings.name === "You"
              ? "a lot of possibility"
              : data.settings.name.split(" ")[0] + "."}
          </h1>
          <p>
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}{" "}
            · {data.settings.workspace}
          </p>
        </div>
        <button className="exp-button" onClick={() => setCustomize(true)}>
          <SlidersHorizontal size={16} />
          Make it yours
        </button>
      </header>
      <section className="dashboard-brief">
        <div>
          <span className="exp-kicker">TODAY, IN PERSPECTIVE</span>
          <h2>
            {data.settings.profile?.focus ||
              "Make room for your most meaningful work."}
          </h2>
          <p>
            {s.priorities.length
              ? `${s.priorities.length} open commitments. ${s.decisions.length} decisions awaiting review. Start with what needs your attention.`
              : "A fresh canvas for your ambitions. Capture one meaningful next step to begin."}
          </p>
          <button
            className="exp-button primary"
            onClick={() => openAssistant("Give me a briefing")}
          >
            <Sparkles size={17} />
            Review my day
          </button>
        </div>
        <div className="brief-emblem" aria-hidden="true">
          ✳
        </div>
        <span className="brief-source">
          {data.includesExamples
            ? "Saved records include examples"
            : "Grounded in your saved records"}{" "}
          · no live agent activity
        </span>
      </section>
      <div className="dashboard-stats">
        {[
          [Target, s.priorities.length, "Open missions", "missions"],
          [Layers, s.projects.length, "Active projects", "projects"],
          [ShieldCheck, s.decisions.length, "Pending reviews", "inbox"],
          [CalendarDays, s.events.length, "Upcoming events", "calendar"],
        ].map(([Icon, n, label, route]) => (
          <a href={"#" + route} key={label}>
            <Icon size={20} />
            <strong>{n}</strong>
            <span>{label}</span>
          </a>
        ))}
      </div>
      <div className="dashboard-work">
        <section className="exp-panel quick-capture">
          <span className="exp-kicker">A THOUGHT WORTH KEEPING</span>
          <h2>What’s your next move?</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) {
                createMission(note.trim());
                setNote("");
              }
            }}
          >
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              required
              placeholder="Capture a mission to review…"
              aria-label="New mission idea"
            />
            <button className="exp-button primary" type="submit">
              <Plus size={16} />
              Review draft
            </button>
          </form>
          <div className="exp-actions">
            <button onClick={createProject}>
              <Layers size={15} />
              New project
            </button>
            <a href="#documents">
              <Plus size={15} />
              Create a document
            </a>
            <a href="#calendar">
              <CalendarDays size={15} />
              Plan your time
            </a>
          </div>
        </section>
        <section className="exp-panel setup-panel">
          <Compass size={24} />
          <h2>
            {data.settings.tour?.state === "Complete"
              ? "Your workspace, discovered."
              : "Find your way around."}
          </h2>
          <p>
            A guided introduction to the tools, decisions and possibilities in
            your workspace.
          </p>
          <button className="exp-button" onClick={startTour}>
            {data.settings.tour?.state === "Paused"
              ? "Resume tour"
              : data.settings.tour?.state === "Complete"
                ? "Replay tour"
                : "Take the tour"}{" "}
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="dashboard-grid">
        {layout.map((name) => (
          <section className="exp-panel" key={name}>
            <header>
              <h2>{name}</h2>
              <a href={"#" + sectionRoutes[name]} aria-label={"Open " + name}>
                <ArrowUp size={18} style={{ transform: "rotate(45deg)" }} />
              </a>
            </header>
            {content[name]}
          </section>
        ))}
      </div>
      {layout.length === 0 && (
        <div className="dashboard-empty">
          <p>All dashboard sections are hidden.</p>
          <button
            className="exp-button"
            onClick={() => saveLayout(dashboardSections)}
          >
            Restore sections
          </button>
        </div>
      )}
      <section className="dashboard-footer-note">
        <ShieldCheck size={18} />
        <p>
          Saved locally. Export regular backups in{" "}
          <a href="#settings">Settings</a>. Usage charges and connected activity
          will appear after the backend is connected.
        </p>
        <a href="#profile">
          Edit your profile <ArrowRight size={16} />
        </a>
      </section>
      {customize && (
        <Dialog
          title="Make your dashboard yours"
          close={() => setCustomize(false)}
        >
          <p>
            Choose the sections you see and the order that works for you.
            Changes save immediately in this workspace.
          </p>
          {dashboardSections.map((name) => (
            <div className="layout-row" key={name}>
              <label>
                <input
                  type="checkbox"
                  checked={layout.includes(name)}
                  onChange={(e) =>
                    saveLayout(
                      e.target.checked
                        ? [...layout, name]
                        : layout.filter((x) => x !== name),
                    )
                  }
                />
                {name}
              </label>
              <div>
                <button
                  className="exp-button"
                  aria-label={"Move " + name + " up"}
                  disabled={
                    !layout.includes(name) || layout.indexOf(name) === 0
                  }
                  onClick={() => move(name, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="exp-button"
                  aria-label={"Move " + name + " down"}
                  disabled={
                    !layout.includes(name) ||
                    layout.indexOf(name) === layout.length - 1
                  }
                  onClick={() => move(name, 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="exp-actions">
            <button
              className="exp-button"
              onClick={() => saveLayout(dashboardSections)}
            >
              Restore default
            </button>
            <button
              className="exp-button primary"
              onClick={() => setCustomize(false)}
            >
              <Check size={16} />
              Done
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
