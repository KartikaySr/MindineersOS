import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Sun,
  Moon,
  Layers,
  GitBranch,
  Sparkles,
  ShieldCheck,
  Compass,
  Check,
} from "lucide-react";
export function ThemeToggle({ theme, toggle }) {
  return (
    <button
      className="exp-theme"
      onClick={toggle}
      aria-label={
        theme === "Dark"
          ? "Switch to light green theme"
          : "Switch to luxury dark theme"
      }
    >
      {theme === "Dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span>{theme === "Dark" ? "Light green" : "Luxury dark"}</span>
    </button>
  );
}
const previews = {
  Plan: [
    "Define the outcome",
    "Map your milestones",
    "Give every task an owner",
  ],
  Create: [
    "Bring context together",
    "Draft documents and variants",
    "Review, refine, keep versions",
  ],
  Review: [
    "Inspect the exact action",
    "Check evidence and scope",
    "Decide what happens next",
  ],
};
const audiences = {
  Personal: [
    "A clearer day. A little more headspace.",
    "Keep commitments, notes, knowledge and creative projects together. Customize your dashboard around what matters to you.",
    ["Calendar", "calendar"],
    ["Knowledge", "knowledge"],
    ["Documents", "documents"],
  ],
  Founder: [
    "Small team energy. Big-picture control.",
    "Coordinate customer work, product delivery, content and operations from a single workspace. Keep important decisions in your hands.",
    ["Customers", "customers"],
    ["Engineering", "engineering"],
    ["Finance", "finance"],
  ],
  Team: [
    "Shared direction. Visible responsibility.",
    "Structure projects, define agent roles and prepare repeatable workflows. Cloud membership and collaborative execution are planned backend capabilities.",
    ["Projects", "projects"],
    ["Workflows", "workflows"],
    ["Security", "security"],
  ],
};
export default function Welcome({ theme, toggle }) {
  const [preview, setPreview] = useState("Plan"),
    [audience, setAudience] = useState("Personal");
  const jump = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  return (
    <div className="welcome-page">
      <a
        className="skip-link"
        href="#welcome-main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("welcome-main").focus();
        }}
      >
        Skip to content
      </a>
      <header className="welcome-nav">
        <a className="exp-brand" href="#welcome">
          <span className="exp-mark">m✳</span>mindineers<span>OS</span>
        </a>
        <nav aria-label="Website">
          <button onClick={() => jump("possibilities")}>Possibilities</button>
          <button onClick={() => jump("how-it-works")}>How it works</button>
          <button onClick={() => jump("plans")}>Access</button>
        </nav>
        <div>
          <ThemeToggle theme={theme} toggle={toggle} />
          <a href="#sign-in" className="welcome-login">
            Sign in
          </a>
          <a href="#home" className="exp-button primary">
            Open workspace <ArrowUpRight size={16} />
          </a>
        </div>
      </header>
      <main id="welcome-main" tabIndex={-1}>
        <section className="welcome-hero">
          <div className="hero-editorial">
            <span className="exp-kicker">
              <span /> YOUR AMBITION. A PLACE TO GROW.
            </span>
            <h1>
              A world of work.
              <br />
              One <em>clear mind.</em>
            </h1>
            <p>
              Meet your personal command center for ideas, projects and the work
              of running a business. Make room for your ambition—with a
              workspace that brings it all together.
            </p>
            <div className="exp-actions">
              <a className="exp-button primary" href="#home">
                Make it yours <ArrowRight size={18} />
              </a>
              <button
                className="exp-button"
                onClick={() => jump("product-preview")}
              >
                Explore the workspace <Compass size={18} />
              </button>
            </div>
            <div className="hero-footnote">
              <span>
                <Check size={14} /> Start without an account
              </span>
              <span>
                <Check size={14} /> Your browser, your workspace
              </span>
            </div>
          </div>
          <div className="orb-composition" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="core-orb">
              m<span>✳</span>
            </div>
            <span className="orbit-label label-one">
              <Layers size={16} /> Your projects
            </span>
            <span className="orbit-label label-two">
              <Sparkles size={16} /> Your possibilities
            </span>
            <span className="orbit-label label-three">
              <ShieldCheck size={16} /> Your decisions
            </span>
            <small>CONNECTED THINKING · HUMAN DIRECTION</small>
          </div>
        </section>
        <div className="welcome-strip">
          <span>THINK CLEARLY</span>
          <span>BUILD INTENTIONALLY</span>
          <span>REVIEW CONFIDENTLY</span>
          <span>MAKE IT YOURS</span>
        </div>
        <section className="welcome-section" id="product-preview">
          <div className="section-top">
            <div>
              <span className="exp-kicker">
                01 / A WORKSPACE WITH PERSPECTIVE
              </span>
              <h2>
                Less scattered.
                <br />
                More in motion.
              </h2>
            </div>
            <p>
              Your next step should be easy to find. Move between planning,
              creating and reviewing without losing the context of your work.
            </p>
          </div>
          <div className="product-preview">
            <aside>
              <span className="exp-mark">m✳</span>
              <strong>Your workspace</strong>
              {Object.keys(previews).map((p) => (
                <button
                  key={p}
                  aria-pressed={preview === p}
                  className={preview === p ? "active" : ""}
                  onClick={() => setPreview(p)}
                >
                  {p === "Plan" ? (
                    <Layers size={18} />
                  ) : p === "Create" ? (
                    <Sparkles size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}{" "}
                  {p}
                </button>
              ))}
              <small>INTERACTIVE PRODUCT PREVIEW</small>
            </aside>
            <div>
              <div className="preview-title">
                <span>YOUR SPACE / {preview.toUpperCase()}</span>
                <span className="exp-pill">Illustrative content</span>
              </div>
              <h3>
                {preview === "Plan"
                  ? "Make the next move meaningful."
                  : preview === "Create"
                    ? "Give your ideas a place to grow."
                    : "Stay in control of the outcome."}
              </h3>
              <p>
                {preview === "Plan"
                  ? "A launch, a client project, a personal goal. Start with a clear outcome."
                  : preview === "Create"
                    ? "Documents, sheets, presentations and creative variants, with room for review."
                    : "Review requests with destinations, payloads and expiry visible before deciding."}
              </p>
              <div className="preview-steps">
                {previews[preview].map((text, i) => (
                  <div key={text}>
                    <span>0{i + 1}</span>
                    <strong>{text}</strong>
                    <ArrowUpRight size={20} />
                  </div>
                ))}
              </div>
              <a
                href={
                  "#" +
                  { Plan: "missions", Create: "documents", Review: "inbox" }[
                    preview
                  ]
                }
              >
                Explore {preview.toLowerCase()} tools <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
        <section className="welcome-section" id="possibilities">
          <div className="section-top">
            <div>
              <span className="exp-kicker">02 / YOUR OWN KIND OF POSSIBLE</span>
              <h2>
                Built around the way
                <br />
                you want to work.
              </h2>
            </div>
            <div className="exp-segments" aria-label="Use cases">
              {Object.keys(audiences).map((a) => (
                <button
                  key={a}
                  aria-pressed={audience === a}
                  onClick={() => setAudience(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="audience-panel">
            <span className="audience-number">
              {audience === "Personal"
                ? "01"
                : audience === "Founder"
                  ? "02"
                  : "03"}
              <i> / MADE FOR YOU</i>
            </span>
            <div>
              <h3>{audiences[audience][0]}</h3>
              <p>{audiences[audience][1]}</p>
              <div className="exp-actions">
                {audiences[audience].slice(2).map(([label, route]) => (
                  <a className="exp-pill" key={route} href={"#" + route}>
                    {label} <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="capability-grid">
            {[
              [
                Layers,
                "Work with context",
                "Projects, missions, conversations, documents and knowledge belong in the same conversation.",
                "projects",
              ],
              [
                GitBranch,
                "Design your agent workspace",
                "Define roles, teams, workflow drafts and model preferences. Connect execution later.",
                "agents",
              ],
              [
                ShieldCheck,
                "Keep human judgment central",
                "Review exact requests, inspect imported traces and preserve decisions with their context.",
                "inbox",
              ],
              [
                Compass,
                "Find your next step",
                "A persistent guide helps you navigate features and summarize your saved commitments.",
                "home",
              ],
            ].map(([Icon, title, body, route]) => (
              <a href={"#" + route} key={title}>
                <Icon size={26} />
                <h3>{title}</h3>
                <p>{body}</p>
                <span>
                  Explore <ArrowUpRight size={16} />
                </span>
              </a>
            ))}
          </div>
        </section>
        <section className="welcome-section process-section" id="how-it-works">
          <span className="exp-kicker">03 / FROM INTENTION TO DIRECTION</span>
          <h2>
            A thoughtful start.
            <br />A workspace that grows with you.
          </h2>
          <div className="process-grid">
            {[
              [
                "01",
                "Make it personal",
                "Choose a workspace, your preferred appearance and optional example content.",
              ],
              [
                "02",
                "Bring your work into focus",
                "Create a project, capture a mission, add context and organize the next steps.",
              ],
              [
                "03",
                "Build your operating rhythm",
                "Use the dashboard, review queue and guided tour to keep moving with clarity.",
              ],
            ].map(([n, t, b]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="welcome-section">
          <div className="trust-panel">
            <ShieldCheck size={40} />
            <div>
              <span className="exp-kicker">
                CLEAR BOUNDARIES. BETTER TRUST.
              </span>
              <h2>Your work deserves clarity.</h2>
              <p>
                The current release saves workspace records on this device. You
                choose whether to add example content, and you can export a
                backup. No cloud agent executes or publishes work from this
                frontend.
              </p>
              <div className="trust-facts">
                <span>Local records & file storage</span>
                <span>Explicit example labels</span>
                <span>Review before external action</span>
              </div>
              <p className="exp-muted">
                Provider connections, cloud sync, authentication and live
                execution require the future backend. Catalog entries describe
                configuration options, not connected accounts.
              </p>
            </div>
          </div>
        </section>
        <section className="welcome-section" id="plans">
          <div className="section-top">
            <div>
              <span className="exp-kicker">04 / START WITH WHAT IS HERE</span>
              <h2>
                Room to begin.
                <br />
                Space to grow.
              </h2>
            </div>
            <p>
              Explore the frontend today. Subscription pricing and paid services
              have not launched.
            </p>
          </div>
          <div className="access-grid">
            <article>
              <span className="exp-pill">AVAILABLE NOW</span>
              <h3>Personal workspace</h3>
              <p>Plan, create, organize and review with browser-local tools.</p>
              <ul>
                <li>Customizable personal dashboard</li>
                <li>Projects, documents and business workspaces</li>
                <li>Profile, themes and guided discovery</li>
                <li>Local backups and optional examples</li>
              </ul>
              <a className="exp-button primary" href="#home">
                Open your workspace <ArrowRight size={16} />
              </a>
            </article>
            <article>
              <span className="exp-pill">PLANNED · BACKEND REQUIRED</span>
              <h3>Connected organization</h3>
              <p>
                The next layer for shared work and authorized agent execution.
              </p>
              <ul>
                <li>Verified identity and team access</li>
                <li>Connected providers and tool execution</li>
                <li>Cloud persistence and collaboration</li>
                <li>Metered usage and subscription billing</li>
              </ul>
              <a className="exp-button" href="#integrations">
                Explore connection catalog <ArrowUpRight size={16} />
              </a>
            </article>
          </div>
        </section>
        <section className="welcome-section faq-section">
          <div>
            <span className="exp-kicker">A FEW THINGS TO KNOW</span>
            <h2>
              Good questions.
              <br />
              Clear answers.
            </h2>
          </div>
          <div>
            {[
              [
                "Do I need an account?",
                "No. Open a local workspace now. Sign-in and recovery require the future cloud service; they do not create an authenticated session in this release.",
              ],
              [
                "Can my agents work autonomously today?",
                "Agent profiles, workflow drafts and review tools are available. Inference and autonomous execution need the backend and authorized providers.",
              ],
              [
                "Where does my work live?",
                "Records and files live in browser storage. Export records from Settings and download important files separately. Clearing site data can remove local work.",
              ],
              [
                "Can I use it on mobile?",
                "The interface adapts to smaller screens. Core operations do not require the optional 3D office. Comprehensive device and accessibility verification is still in progress.",
              ],
              [
                "Does it replace my existing tools?",
                "MindineersOS organizes work across domains. External services retain their own accounts and permissions. Live integrations will need explicit connections.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="welcome-final">
          <span className="exp-kicker">YOUR NEXT CHAPTER</span>
          <h2>
            Give your ambition
            <br />a little more space.
          </h2>
          <a href="#home" className="exp-button primary">
            Start your workspace <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <footer className="welcome-footer">
        <a href="#welcome" className="exp-brand">
          m✳ mindineersOS
        </a>
        <span>A place for a mind like yours.</span>
        <div>
          <a href="#sign-in">Sign in</a>
          <a href="#help">Help</a>
          <a href="#profile">Profile</a>
          <a href="#settings">Privacy & backups</a>
        </div>
      </footer>
    </div>
  );
}
