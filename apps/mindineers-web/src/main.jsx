import { useNavigationFocus } from "./shared/ui/useNavigationFocus";
import { useWorkspaceHistory } from "./domains/recovery/useWorkspaceHistory";
import RecoveryPanel from "./domains/recovery/RecoveryPanel";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import { useRoute } from "./app/useRoute";
import { defaultWorkbench, navigationTitle } from "./app/routes";
import {
  RouteBoundary,
  LoadingState,
  SaveFailure,
} from "./shared/ui/AsyncState";
import Welcome, { ThemeToggle } from "./Welcome";
import { AccountEntry, ProfileExperience } from "./AccountExperience";
import PersonalDashboard from "./PersonalDashboard";
import { CoreAssistant, GuidedTour } from "./WorkspaceGuide";
const HelpCenter = lazy(() => import("./HelpCenter"));
const RunWorkspace = lazy(() => import("./RunWorkspace"));
const ExperimentWorkspace = lazy(() => import("./ExperimentWorkspace"));
const FinanceWorkspace = lazy(() => import("./FinanceWorkspace"));
const DeliveryWorkspace = lazy(() => import("./DeliveryWorkspace"));
const OperationsWorkspace = lazy(() => import("./OperationsWorkspace"));
const CreativeStudio = lazy(() => import("./CreativeStudio"));
const RuntimeSettings = lazy(() => import("./RuntimeSettings"));
const ResearchWorkspace = lazy(
  () => import("./domains/product/ResearchWorkspace"),
);
const KnowledgeHub = lazy(() => import("./KnowledgeHub"));
const EngineeringDesk = lazy(() => import("./EngineeringDesk"));
const DocumentsStudio = lazy(() => import("./DocumentsStudio"));
const Decisions = lazy(() => import("./Decisions"));
const Administration = lazy(() => import("./Administration"));
const Subscription = lazy(() =>
  import("./Administration").then((m) => ({ default: m.Subscription })),
);
import "./product.css";

import { validateWorkspace } from "./storage";
import { saveFile, downloadFile } from "./files";
import { fields } from "./fields";
import Workbench from "./Workbench";
import Onboarding from "./Onboarding";
import MissionPlanner, { MissionEditor } from "./MissionPlanner";
import Conversations from "./Conversations";
const Connections = lazy(() => import("./Connections"));
import Artifacts from "./Artifacts";
import CalendarWorkspace from "./CalendarWorkspace";
import Customers from "./Customers";
import WorkspaceManager from "./WorkspaceManager";
import {
  readIndex,
  writeIndex,
  readWorkspace,
  saveWorkspace,
  workspaceKey,
} from "./workspaces";
import { resources } from "./resources";
import { Icons } from "./icons";
import { modules, initialAgents, seedProjects, seeds, domains } from "./data";
import "./style.css";
import "./experience.css";
const Office = lazy(() => import("./Office"));
const KEY = "mindineers.workspace.v1";
const fresh = () => ({
  agents: [],
  projects: [],
  records: Object.fromEntries(Object.keys(seeds).map((k) => [k, []])),
  messages: [],
  posts: [],
  approvals: [],
  settings: {
    name: "You",
    workspace: "My workspace",
    theme: "Light",
    motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    notifications: true,
    autonomy: "Ask before acting",
    budget: 50,
    scope: "User",
    accent: "Sage",
  },
  connections: {},
  bookmarks: [],
  onboarded: false,
});
function boot() {
  try {
    const index = readIndex(localStorage);
    return { index, ...readWorkspace(localStorage, index.active, fresh) };
  } catch (error) {
    return {
      index: {
        active: "original",
        items: [{ id: "original", name: "Personal workspace" }],
      },
      data: null,
      raw: null,
      error: error.message,
    };
  }
}
const initialWorkspace = boot();

function Icon({ name = "Circle", size = 19, ...props }) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.65} {...props} />;
}
function Button({ children, icon, onClick, kind = "", ...p }) {
  return (
    <button className={"button " + kind} onClick={onClick} {...p}>
      {icon && <Icon name={icon} size={16} />} {children}
    </button>
  );
}
function Avatar({ agent, size = "" }) {
  return (
    <span
      className={"avatar " + size}
      style={{ background: agent?.color || "#e3e8dc" }}
    >
      {agent?.symbol || "K"}
    </span>
  );
}
export default function App() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, []);
  const [assistant, setAssistant] = useState(null),
    [tourOpen, setTourOpen] = useState(false);
  const route = useRoute();
  const [modeSelection, setModeSelection] = useState({
    route,
    value: defaultWorkbench(route),
  });
  const workbenchMode =
    modeSelection.route === route
      ? modeSelection.value
      : defaultWorkbench(route);
  const setWorkbenchMode = (value) => setModeSelection({ route, value });
  const [saveFailed, setSaveFailed] = useState(false),
    [saveAttempt, setSaveAttempt] = useState(0);
  const [workspaceIndex, setWorkspaceIndex] = useState(initialWorkspace.index),
    [workspacePicker, setWorkspacePicker] = useState(false),
    [recovery, setRecovery] = useState(initialWorkspace.error),
    [recoveryRaw, setRecoveryRaw] = useState(initialWorkspace.raw),
    [storageConflict, setStorageConflict] = useState(null);
  const {
    data,
    replace: setData,
    update,
    history,
    restore,
  } = useWorkspaceHistory(() => initialWorkspace.data || fresh());
  const [query, setQuery] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [more, setMore] = useState(false),
    [filter, setFilter] = useState("All"),
    [chatInput, setChatInput] = useState(""),
    [selectedAgent, setSelectedAgent] = useState("atlas"),
    [settingsScope, setSettingsScope] = useState("User"),
    [view, setView] = useState("Grid"),
    [month, setMonth] = useState(new Date()),
    [narrow, setNarrow] = useState(
      () => matchMedia("(max-width:740px)").matches,
    );
  useNavigationFocus(narrow && mobile, route);
  useEffect(() => {
    const media = matchMedia("(max-width:740px)");
    const change = () => setNarrow(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const sync = (e) => {
      if (e.key !== workspaceKey(workspaceIndex.active) || !e.newValue) return;
      try {
        const next = validateWorkspace(JSON.parse(e.newValue));
        if (JSON.stringify(data) !== e.newValue) setStorageConflict(next);
      } catch {
        setToast(
          "Another tab wrote data that could not be validated. Your open workspace was preserved.",
        );
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [workspaceIndex.active, data]);

  const officeAgents = useMemo(() => data.agents.slice(0, 4), [data.agents]);
  const current =
    route === "profile"
      ? [
          "profile",
          "Your profile",
          "User",
          "Personal details, preferences, and your account.",
        ]
      : route === "runs"
        ? [
            "runs",
            "Run control",
            "Activity",
            "Execution history, decisions, and verified outcomes.",
          ]
        : route === "resources"
          ? [
              "resources",
              "Resource library",
              "Boxes",
              "Build on the resources you already have.",
            ]
          : modules.find((m) => m[0] === route) || modules[0];
  useEffect(() => {
    if (recovery || storageConflict) return;
    try {
      saveWorkspace(localStorage, workspaceIndex.active, data);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [data, workspaceIndex.active, recovery, storageConflict, saveAttempt]);
  useEffect(() => {
    setMobile(false);
    setFilter("All");
    setView("Grid");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setModal(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme.toLowerCase();
    document.documentElement.dataset.motion = data.settings.motion
      ? "reduced"
      : "full";
  }, [data.settings]);
  useEffect(() => {
    setAssistant(null);
    setTourOpen(false);
    document.title = navigationTitle(route, current[1]);
  }, [route, workspaceIndex.active]);
  const selectWorkspace = (id) => {
    try {
      if (!recovery && !storageConflict)
        saveWorkspace(localStorage, workspaceIndex.active, data);
      const next = readWorkspace(localStorage, id, fresh);
      const index = {
        ...workspaceIndex,
        active: id,
        items: workspaceIndex.items.map((w) =>
          w.id === workspaceIndex.active
            ? { ...w, name: data.settings.workspace }
            : w,
        ),
      };
      writeIndex(localStorage, index);
      setWorkspaceIndex(index);
      setRecovery(next.error);
      setRecoveryRaw(next.raw);
      setData(next.data || fresh());
      setStorageConflict(null);
      setWorkspacePicker(false);
      setModal(null);
      setSearchOpen(false);
      location.hash = "home";
    } catch (error) {
      notify(error.message);
    }
  };
  const createWorkspace = (name) => {
    const id = crypto.randomUUID(),
      workspace = fresh();
    workspace.settings = {
      ...workspace.settings,
      name: data.settings.name,
      workspace: name,
      theme: data.settings.theme,
      motion: data.settings.motion,
    };
    const index = {
      active: id,
      items: [
        ...workspaceIndex.items.map((w) =>
          w.id === workspaceIndex.active
            ? { ...w, name: data.settings.workspace }
            : w,
        ),
        { id, name },
      ],
    };
    saveWorkspace(localStorage, id, workspace);
    writeIndex(localStorage, index);
    if (!recovery && !storageConflict)
      saveWorkspace(localStorage, workspaceIndex.active, data);
    setWorkspaceIndex(index);
    setData(workspace);
    setRecovery(null);
    setStorageConflict(null);
    setWorkspacePicker(false);
    location.hash = "home";
  };
  const navigate = (id) => {
    location.hash = id;
    setSearchOpen(false);
  };
  const agentSelect = useCallback((id) => setModal({ type: "agent", id }), []);
  const notify = (message) => setToast(message);
  const records = data.records[route] || [];
  const useTemplate = (r) => {
    const domain = domains[r.target] ? r.target : "missions";
    saveRecord(domain, {
      name: r.templateTitle,
      description:
        r.templateDescription +
        "\n\nSource: " +
        r.name +
        " (" +
        r.archive +
        "). Runtime not connected.",
      status: domains[domain][2],
      owner: "You",
    });
    notify("Template added as a local draft");
    navigate(domain);
  };
  const newRecord = (id = route) => setModal({ type: "record", domain: id });
  const saveRecord = (domain, record) =>
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        [domain]:
          record.id && (d.records[domain] || []).some((r) => r.id === record.id)
            ? (d.records[domain] || []).map((r) =>
                r.id === record.id ? record : r,
              )
            : [
                {
                  ...record,
                  id: record.id || crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                },
                ...(d.records[domain] || []),
              ],
      },
    }));
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindineers-workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const totalRecords = Object.values(data.records).reduce(
    (n, a) => n + a.length,
    0,
  );
  const visibleModules = [
    ...modules,
    ["resources", "Resource library", "Boxes"],
    ["profile", "Your profile", "User"],
    ["welcome", "Product website", "Home"],
  ].filter((m) => m[1].toLowerCase().includes(query.toLowerCase()));
  const hero = (
    <div className="hero">
      <div className="hero-copy">
        <span className="eyebrow">
          <span className="live-dot" /> A LITTLE SPACE. UNLIMITED POSSIBILITY.
        </span>
        <h2>
          Big ideas.
          <br />
          Your kind of team.
        </h2>
        <p>
          Think freely. Build together. Make room
          <br className="desktop" /> for the work only you can do.
        </p>
        <Button
          kind="dark"
          icon="Plus"
          onClick={() => setModal({ type: "project" })}
        >
          Start something new
        </Button>
      </div>
      <div className="orb-art" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="glass-orb">
          <span>
            m<span className="star">✳</span>
          </span>
        </div>
        <span className="floating-label fl-one">✧ Ideas into action</span>
        <span className="floating-label fl-two">
          <span className="live-dot" /> Your extended mind
        </span>
        <div className="art-grid" />
      </div>
    </div>
  );
  function SectionHead({ title, sub, action, target }) {
    return (
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {action && (
          <button className="text-button" onClick={() => navigate(target)}>
            {action}
            <Icon name="ArrowUpRight" size={16} />
          </button>
        )}
      </div>
    );
  }
  function ProjectCard({ p }) {
    return (
      <button
        className="project-card"
        onClick={() => setModal({ type: "project", record: p })}
      >
        <div className="project-top">
          <span className="project-symbol" style={{ background: p.color }}>
            <Icon name="Layers" size={21} />
          </span>
          <span className="badge">{p.status}</span>
        </div>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <div className="progress">
          <span style={{ width: p.progress + "%", background: p.color }} />
        </div>
        <div className="card-foot">
          <span>{p.owner}</span>
          <span>{p.progress}% complete</span>
        </div>
      </button>
    );
  }
  function AgentCard({ a }) {
    return (
      <button className="agent-card" onClick={() => agentSelect(a.id)}>
        <div
          className="agent-art"
          style={{
            background: `radial-gradient(ellipse at 30% 20%,#ffffffaa,${a.color})`,
          }}
        >
          <div className="agent-orb" style={{ "--orb": a.color }}>
            {a.portrait ||
            {
              atlas: "browser",
              nova: "multimodal",
              forge: "terminal",
              sage: "document",
            }[a.id] ? (
              <img
                src={
                  a.portrait ||
                  "/agent-assets/" +
                    {
                      atlas: "browser",
                      nova: "multimodal",
                      forge: "terminal",
                      sage: "document",
                    }[a.id] +
                    ".png"
                }
                alt=""
              />
            ) : (
              a.symbol
            )}
          </div>
          <span className="agent-state">
            <i />
            {a.status}
          </span>
        </div>
        <div className="agent-info">
          <h3>
            {a.name}
            <Icon name="ArrowUpRight" size={17} />
          </h3>
          <p>{a.role}</p>
        </div>
      </button>
    );
  }
  function Home() {
    return (
      <>
        <div className="greeting">
          <div>
            <span className="eyebrow">YOUR PERSONAL OPERATING SYSTEM</span>
            <h1>
              Good to see you, {data.settings.name.split(" ")[0]}{" "}
              <span className="sun">✳</span>
            </h1>
            <p>A fresh perspective. A little momentum. Let’s make something.</p>
          </div>
          <span className="date-chip">
            <Icon name="CalendarDays" size={15} />
            {new Date().toLocaleDateString("en", {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </span>
        </div>
        {hero}
        <div className="quick-actions">
          {[
            [
              "MessageCircle",
              "Start a conversation",
              "A thought is enough",
              "chat",
            ],
            [
              "Target",
              "Plan a mission",
              "Give your idea direction",
              "missions",
            ],
            [
              "Box",
              "Step into your office",
              "See the bigger picture",
              "office",
            ],
          ].map(([i, t, s, r]) => (
            <button key={r} onClick={() => navigate(r)}>
              <span className="quick-icon">
                <Icon name={i} />
              </span>
              <span>
                <strong>{t}</strong>
                <small>{s}</small>
              </span>
              <Icon name="ArrowUpRight" size={17} />
            </button>
          ))}
        </div>
        <SectionHead
          title="Your circle"
          sub="Different strengths. One shared direction."
          action="All agents"
          target="agents"
        />
        <div className="agent-grid">
          {!data.agents.length && (
            <button
              className="create-card"
              onClick={() => setModal({ type: "agent" })}
            >
              <Icon name="Plus" />
              <strong>Create your first agent profile</strong>
              <span>Give your future team a role and purpose.</span>
            </button>
          )}
          {data.agents.slice(0, 4).map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
        <SectionHead
          title="Work in motion"
          action="All projects"
          target="projects"
        />
        <div className="project-grid">
          {!data.projects.length && (
            <button
              className="create-card"
              onClick={() => setModal({ type: "project" })}
            >
              <Icon name="Plus" />
              <strong>Start your first project</strong>
              <span>Set a direction. Keep the next step clear.</span>
            </button>
          )}
          {data.projects.slice(0, 3).map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
        <div className="bottom-grid">
          <div className="panel">
            <SectionHead
              title="A place to come together"
              action="Enter office"
              target="office"
            />
            <Suspense
              fallback={
                <div className="scene-loading">Opening your studio…</div>
              }
            >
              <Office
                agents={officeAgents}
                compact
                onSelect={agentSelect}
                reduced={data.settings.motion}
              />
            </Suspense>
          </div>
          <div className="panel note">
            <span className="eyebrow">A MOMENT OF CLARITY</span>
            <h2>
              What would you build
              <br />
              if you had a little
              <br />
              more space to think?
            </h2>
            <p>Your next chapter can start with a sentence.</p>
            <button className="text-button" onClick={() => navigate("chat")}>
              Let’s explore it <Icon name="ArrowUpRight" />
            </button>
          </div>
        </div>
      </>
    );
  }
  function Chat() {
    return (
      <div className="chat-layout">
        <div className="chat-toolbar">
          <span className="badge">Conversation drafts</span>
          <select
            aria-label="Conversation agent"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            {data.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.role}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label="New conversation"
            onClick={() => setModal({ type: "clearChat" })}
          >
            <Icon name="SquarePen" />
          </button>
        </div>
        <div className="messages">
          {!data.messages.length ? (
            <div className="chat-empty">
              <span className="chat-mark">✳</span>
              <h1>
                A good idea starts
                <br />
                with a conversation.
              </h1>
              <p>Bring the messy thought. We’ll give it a place to grow.</p>
              <div className="prompt-grid">
                {[
                  "Help me plan my next big idea",
                  "Create a research brief",
                  "Organize my week",
                  "Explore a new product concept",
                ].map((s) => (
                  <button key={s} onClick={() => setChatInput(s)}>
                    <Icon name="Sparkles" size={16} />
                    {s}
                    <Icon name="ArrowUpRight" size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            data.messages.map((m) => (
              <div className={"message " + m.role} key={m.id}>
                <Avatar agent={data.agents.find((a) => a.id === m.agent)} />
                <div>
                  <strong>
                    {m.role === "user" ? data.settings.name : "Workspace"}
                  </strong>
                  <p>{m.text}</p>
                  <small>
                    {m.role === "user" ? "Saved locally" : "Connection notice"}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;
            update((d) => ({
              ...d,
              messages: [
                ...d.messages,
                {
                  id: crypto.randomUUID(),
                  role: "user",
                  text: chatInput,
                  agent: selectedAgent,
                },
              ],
            }));
            setChatInput("");
          }}
        >
          <textarea
            aria-label="Message"
            placeholder="What’s on your mind?"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form.requestSubmit();
              }
            }}
          />
          <div className="composer-bottom">
            <button
              type="button"
              className="text-button"
              onClick={() => newRecord("missions")}
            >
              <Icon name="Plus" size={17} /> Create mission
            </button>
            <span>
              <Icon name="LockKeyhole" size={13} /> Stored on this device
            </span>
            <button
              className="send"
              aria-label="Save draft"
              disabled={!chatInput.trim()}
            >
              <Icon name="ArrowUp" />
            </button>
          </div>
        </form>
        <p className="chat-disclaimer">
          Drafts are saved on this device. Connect your backend to send messages
          to an agent.
        </p>
      </div>
    );
  }
  function Feed() {
    return (
      <>
        <div className="feed-compose">
          <Avatar />
          <button onClick={() => setModal({ type: "post" })}>
            Share a thought or a project update…
          </button>
          <Button icon="Plus" onClick={() => setModal({ type: "post" })}>
            Post
          </Button>
        </div>
        <div className="feed-layout">
          <div>
            {!data.posts.length && (
              <Empty
                icon="Radio"
                title="Your story starts here."
                text="Share a project update or record a decision for your workspace."
              />
            )}
            {data.posts.map((p) => (
              <article className="feed-card" key={p.id}>
                <div className="feed-author">
                  <Avatar agent={data.agents.find((a) => a.name === p.agent)} />
                  <div>
                    <strong>{p.agent}</strong>
                    <small>Studio update · local workspace</small>
                  </div>
                  <Icon name="MoreHorizontal" />
                </div>
                <h2>{p.title}</h2>
                <p>{p.body}</p>
                {p.id === "welcome" && (
                  <div className="feed-art">
                    <span>
                      Room to
                      <br />
                      <i>imagine.</i>
                    </span>
                    <div className="mini-orb">✳</div>
                  </div>
                )}
                <div className="feed-actions">
                  <button
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        posts: d.posts.map((x) =>
                          x.id === p.id
                            ? {
                                ...x,
                                liked: !x.liked,
                                likes: x.likes + (x.liked ? -1 : 1),
                              }
                            : x,
                        ),
                      }))
                    }
                  >
                    <Icon
                      name="Heart"
                      fill={p.liked ? "currentColor" : "none"}
                    />
                    {p.likes}
                  </button>
                  <button
                    onClick={() => setModal({ type: "comment", post: p.id })}
                  >
                    <Icon name="MessageCircle" />
                    {p.comments.length}
                  </button>
                  <button
                    className="save"
                    aria-label="Save post"
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        posts: d.posts.map((x) =>
                          x.id === p.id ? { ...x, saved: !x.saved } : x,
                        ),
                      }))
                    }
                  >
                    <Icon
                      name="Bookmark"
                      fill={p.saved ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                {p.comments.map((c, i) => (
                  <p className="comment" key={i}>
                    <strong>You</strong> {c}
                  </p>
                ))}
              </article>
            ))}
          </div>
          <aside className="panel feed-aside">
            <span className="eyebrow">YOUR CIRCLE</span>
            {data.agents.map((a) => (
              <button
                className="person-row"
                key={a.id}
                onClick={() => agentSelect(a.id)}
              >
                <Avatar agent={a} />
                <span>
                  <strong>{a.name}</strong>
                  <small>{a.role}</small>
                </span>
                <Icon name="ArrowUpRight" size={15} />
              </button>
            ))}
            <p className="muted">
              This is your private local activity feed. Posts are not published
              to a social network.
            </p>
          </aside>
        </div>
      </>
    );
  }
  function ResourceLibrary() {
    return (
      <>
        <div className="notice">
          <Icon name="PackageOpen" size={18} /> All ten supplied archives are
          indexed here. Imported references and local draft templates are
          available; backend frameworks are not running in your browser.
        </div>
        <div className="resource-grid">
          {resources.map((r) => (
            <article className="panel resource-card" key={r.name}>
              <div className="resource-head">
                <Icon name="Boxes" />
                <span className="badge">{r.license}</span>
              </div>
              <h2>{r.name}</h2>
              <p>{r.role}</p>
              <small>{r.status}</small>
              <div className="resource-actions">
                {r.reference && (
                  <a
                    className="button"
                    href={r.reference}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read source reference <Icon name="ArrowUpRight" size={14} />
                  </a>
                )}
                {r.templateTitle && (
                  <Button
                    kind="dark"
                    icon="Plus"
                    onClick={() => useTemplate(r)}
                  >
                    Use draft template
                  </Button>
                )}
              </div>
              <details>
                <summary>Source provenance</summary>
                <p>{r.archive}</p>
                <code>{r.sha256}</code>
                <p>{r.files.length} imported files</p>
              </details>
            </article>
          ))}
        </div>
      </>
    );
  }
  function Projects() {
    return (
      <>
        <Toolbar
          action="New project"
          onAction={() => setModal({ type: "project" })}
          statuses={["All", "Planning", "In progress", "Done"]}
        />
        <div
          className={
            view === "List" ? "project-grid project-list" : "project-grid"
          }
        >
          {data.projects
            .filter((p) => filter === "All" || p.status === filter)
            .map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          <button
            className="create-card"
            onClick={() => setModal({ type: "project" })}
          >
            <Icon name="Plus" size={25} />
            <strong>Make room for a new idea</strong>
            <span>Create a project</span>
          </button>
        </div>
      </>
    );
  }
  function Toolbar({
    action,
    onAction,
    statuses = ["All", "Draft", "Reviewed", "Archived"],
  }) {
    return (
      <div className="toolbar">
        <div className="tabs">
          {statuses.map((s) => (
            <button
              key={s}
              className={filter === s ? "active" : ""}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <button
            className="icon-button"
            aria-label="Toggle list or grid"
            onClick={() => setView((v) => (v === "Grid" ? "List" : "Grid"))}
          >
            <Icon name={view === "Grid" ? "List" : "LayoutGrid"} />
          </button>
          <Button icon="Plus" kind="dark" onClick={onAction}>
            {action}
          </Button>
        </div>
      </div>
    );
  }
  function RecordPage() {
    const spec = domains[route];
    const list = records.filter((r) => filter === "All" || r.status === filter);
    return (
      <>
        <Toolbar
          action={spec[0]}
          onAction={() =>
            route === "files"
              ? document.getElementById("file-upload").click()
              : newRecord()
          }
          statuses={["All", ...spec.slice(2)]}
        />
        {route === "files" && (
          <input
            hidden
            id="file-upload"
            type="file"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              e.target.value = "";
              for (const f of files) {
                try {
                  const id = crypto.randomUUID();
                  await saveFile(f, id);
                  saveRecord("files", {
                    id,
                    name: f.name,
                    description: `${(f.size / 1024).toFixed(1)} KB · ${f.type || "File"} · stored locally in this browser`,
                    status: "Local",
                    owner: "You",
                  });
                  notify("File stored on this device");
                } catch (error) {
                  notify(error.message || "Unable to store file");
                }
              }
            }}
          />
        )}
        {["simulation", "evaluations", "finance", "observability"].includes(
          route,
        ) && (
          <div className="notice">
            <Icon name="Info" size={17} />{" "}
            {route === "evaluations"
              ? "Evaluation plans only. No benchmark results have been generated."
              : route === "observability"
                ? "Local incident notes. Live telemetry is not connected."
                : "Local planning workspace. Execution, publishing, and external actions require the backend."}
          </div>
        )}
        {list.length && route === "missions" && view === "Grid" ? (
          <div className="kanban">
            {spec.slice(2).map((status) => (
              <section className="kanban-column" key={status}>
                <h3>
                  {status}
                  <span>{list.filter((r) => r.status === status).length}</span>
                </h3>
                {list
                  .filter((r) => r.status === status)
                  .map((r) => (
                    <div className="kanban-card" key={r.id}>
                      <button
                        onClick={() =>
                          setModal({ type: "record", domain: route, record: r })
                        }
                      >
                        <h3>{r.name}</h3>
                        <p>{r.description}</p>
                      </button>
                      <span className="badge">{r.owner}</span>
                      <select
                        aria-label={"Status for " + r.name}
                        value={r.status}
                        onChange={(e) =>
                          saveRecord(route, { ...r, status: e.target.value })
                        }
                      >
                        {spec.slice(2).map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </section>
            ))}
          </div>
        ) : list.length ? (
          <div className={view === "List" ? "record-list" : "record-grid"}>
            {list.map((r) => (
              <button
                className="record-card"
                key={r.id}
                onClick={() =>
                  setModal({ type: "record", domain: route, record: r })
                }
              >
                <div className="record-card-top">
                  <span className="record-symbol">
                    <Icon name={current[2]} />
                  </span>
                  <span className="badge">{r.status}</span>
                </div>
                <h3>{r.name}</h3>
                {route === "workflows" ? (
                  <div className="workflow-nodes">
                    {r.description
                      .split("\n\nSource:")[0]
                      .split(/→|\n/)
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((step, i) => (
                        <div key={i}>
                          <span>{i + 1}</span>
                          {step}
                          <Icon name="ChevronDown" size={13} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <p>{r.description}</p>
                )}
                <div className="card-foot">
                  <span>{r.owner || "You"}</span>
                  <Icon name="ArrowUpRight" size={16} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            icon={current[2]}
            title={`A little space for ${current[1].toLowerCase()}.`}
            text="Create your first item. Your work is saved locally as you go."
            action={spec[0]}
            onAction={() =>
              route === "files"
                ? document.getElementById("file-upload").click()
                : newRecord()
            }
          />
        )}
      </>
    );
  }
  function Empty({ icon, title, text, action, onAction }) {
    return (
      <div className="empty">
        <span className="empty-icon">
          <Icon name={icon} size={30} />
        </span>
        <h2>{title}</h2>
        <p>{text}</p>
        {action && (
          <Button kind="dark" icon="Plus" onClick={onAction}>
            {action}
          </Button>
        )}
      </div>
    );
  }
  function Agents() {
    return (
      <>
        <div className="toolbar">
          <div className="tabs">
            <button className="active">
              Your agents <span>{data.agents.length}</span>
            </button>
          </div>
          <Button
            kind="dark"
            icon="Plus"
            onClick={() => setModal({ type: "agent" })}
          >
            Create agent
          </Button>
        </div>
        <div className="agent-grid expanded">
          {data.agents.map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
        <div className="notice">
          <Icon name="Info" /> Agent profiles are configurable. Running agents
          requires a connected model and runtime.
        </div>
      </>
    );
  }
  function OfficePage() {
    return (
      <>
        <div className="toolbar">
          <span className="badge">
            Spatial workspace · {data.agents.length} agents
          </span>
          <Button icon="Settings2" onClick={() => navigate("settings")}>
            Customize
          </Button>
        </div>
        <div className="office-full panel">
          <Suspense
            fallback={<div className="scene-loading">Opening your studio…</div>}
          >
            <Office
              agents={officeAgents}
              onSelect={agentSelect}
              reduced={data.settings.motion}
            />
          </Suspense>
        </div>
        <SectionHead
          title="Find your people"
          sub="Click an agent in the office or choose one below."
        />
        <div className="agent-grid">
          {data.agents.map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
      </>
    );
  }
  function Integrations() {
    return (
      <>
        <div className="notice">
          <Icon name="LockKeyhole" size={17} /> Connections need a backend OAuth
          flow. You can save the integrations you want to configure.
        </div>
        <div className="integration-grid">
          {[
            [
              "Google Workspace",
              "Mail, calendar, and documents",
              "G",
              "#e9ece4",
            ],
            ["GitHub", "Repositories, issues, and changes", "GH", "#e6e5e3"],
            ["Slack", "Conversations and team context", "S", "#eeddeb"],
            ["Notion", "Your knowledge and documents", "N", "#eeeae2"],
            ["OpenAI", "Language, reasoning, and tools", "O", "#d5e5d9"],
            ["Anthropic", "Claude models and capabilities", "A", "#ecddce"],
            ["Meta", "Business messaging and publishing", "M", "#dce7ec"],
            [
              "Local runtime",
              "Private inference on your device",
              "L",
              "#e1deed",
            ],
            ["Wallet", "Optional identity connection", "W", "#e6e9d7"],
          ].map(([name, desc, letter, color]) => (
            <div className="integration-card" key={name}>
              <span className="integration-logo" style={{ background: color }}>
                {letter}
              </span>
              <h3>{name}</h3>
              <p>{desc}</p>
              <Button
                onClick={() => {
                  update((d) => ({
                    ...d,
                    connections: {
                      ...d.connections,
                      [name]: !d.connections[name],
                    },
                  }));
                  notify(
                    data.connections[name]
                      ? "Removed from setup list"
                      : "Added to setup list. No account has been connected.",
                  );
                }}
                icon={data.connections[name] ? "Check" : "Plus"}
              >
                {data.connections[name] ? "Setup requested" : "Add to setup"}
              </Button>
            </div>
          ))}
        </div>
      </>
    );
  }
  function Calendar() {
    const days = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
      ).getDate(),
      first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    return (
      <>
        <div className="toolbar">
          <div className="month-nav">
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1))
              }
            >
              <Icon name="ChevronLeft" />
            </button>
            <h2>
              {month.toLocaleDateString("en", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1))
              }
            >
              <Icon name="ChevronRight" />
            </button>
          </div>
          <Button kind="dark" icon="Plus" onClick={() => newRecord("calendar")}>
            New event
          </Button>
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div className="day-name" key={d}>
              {d}
            </div>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <div className="calendar-day blank" key={"blank" + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                className="calendar-day"
                key={date}
                onClick={() =>
                  setModal({ type: "record", domain: "calendar", date })
                }
              >
                <span>{i + 1}</span>
                {(data.records.calendar || [])
                  .filter((e) => e.date === date)
                  .map((e) => (
                    <span className="event-pill" key={e.id}>
                      {e.name}
                    </span>
                  ))}
              </button>
            );
          })}
        </div>
        <p className="muted">
          Local calendar · external calendars are not connected.
        </p>
      </>
    );
  }
  function Inbox() {
    return (
      <>
        <div className="notice">
          <Icon name="Info" size={16} /> Action requests from your connected
          backend will appear here with their destination, payload, and required
          permissions.
        </div>
        {!data.approvals.length && (
          <Empty
            icon="Inbox"
            title="You’re all caught up."
            text="There are no decisions waiting for your review."
          />
        )}
        {data.approvals.map((a) => (
          <div className="approval panel" key={a.id}>
            <span className="empty-icon">
              <Icon name="CheckCheck" />
            </span>
            <div>
              <h3>{a.name}</h3>
              <p>{a.detail}</p>
              <span className="badge">{a.state}</span>
            </div>
            {a.state === "Pending" && (
              <div className="approval-buttons">
                <Button onClick={() => decide(a.id, "Declined")}>
                  Decline
                </Button>
                <Button
                  kind="dark"
                  onClick={() => decide(a.id, "Approved locally")}
                >
                  Approve draft
                </Button>
              </div>
            )}
          </div>
        ))}
      </>
    );
  }
  function decide(id, state) {
    update((d) => ({
      ...d,
      approvals: d.approvals.map((a) => (a.id === id ? { ...a, state } : a)),
    }));
    notify("Local decision saved");
  }
  function Models() {
    return (
      <>
        <div className="notice">
          <Icon name="Info" size={17} /> No inference provider or worker is
          connected. Preferences below are local configuration drafts.
        </div>
        <div className="record-grid">
          {[
            ["Cloud reasoning", "OpenAI · Anthropic · Google", "Cloud"],
            ["Local inference", "llamafile · compatible endpoints", "Local"],
            ["Execution workers", "Sandboxed tool execution", "Runtime"],
          ].map(([name, description, status]) => (
            <div className="panel model-card" key={name}>
              <Icon name="Cpu" size={30} />
              <h2>{name}</h2>
              <p>{description}</p>
              <span className="badge">Not connected</span>
              <Button
                icon="ArrowUpRight"
                onClick={() => navigate("integrations")}
              >
                Configure providers
              </Button>
            </div>
          ))}
        </div>
      </>
    );
  }
  function Usage() {
    return (
      <>
        <div className="stats-grid">
          {[
            ["Local projects", data.projects.length],
            ["Agent profiles", data.agents.length],
            ["Workspace records", totalRecords],
            ["Provider spend", "Not connected"],
          ].map(([n, v]) => (
            <div className="stat panel" key={n}>
              <span>{n}</span>
              <strong>{v}</strong>
              <small>
                {n === "Provider spend"
                  ? "No billing data available"
                  : "Stored on this browser"}
              </small>
            </div>
          ))}
        </div>
        <div className="panel budget">
          <h2>Your spending preferences</h2>
          <p>
            Choose a planned monthly budget. Backend enforcement is required
            before paid execution.
          </p>
          <label>
            Monthly budget (USD)
            <input
              type="number"
              min="0"
              value={data.settings.budget}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  settings: {
                    ...d.settings,
                    budget: Math.max(0, Number(e.target.value)),
                  },
                }))
              }
            />
          </label>
          <div className="notice">
            <Icon name="Info" /> No subscription or payment method is connected.
          </div>
        </div>
      </>
    );
  }
  function Security() {
    return (
      <>
        <div className="panel security-intro">
          <Icon name="ShieldCheck" size={38} />
          <h2>Your workspace, your control.</h2>
          <p>
            This local frontend has no server authentication or enterprise
            access enforcement. Do not use it to store confidential production
            data.
          </p>
        </div>
        <div className="record-grid">
          {[
            [
              "Identity & access",
              "SSO, team membership, and roles require the backend.",
            ],
            [
              "Audit & governance",
              "Server audit trails, legal holds, and verified deletion require the backend.",
            ],
            [
              "Local data",
              "Export or clear the data saved on this browser from settings.",
            ],
          ].map(([t, p]) => (
            <div className="panel" key={t}>
              <h3>{t}</h3>
              <p>{p}</p>
              <Button onClick={() => navigate("settings")} icon="ArrowUpRight">
                Workspace settings
              </Button>
            </div>
          ))}
        </div>
      </>
    );
  }
  function Settings() {
    return (
      <div className="settings-layout">
        <div className="settings-nav">
          {[
            "User",
            "Workspace",
            "Organization",
            "Device",
            "Project",
            "Agent",
            "Run",
          ].map((s) => (
            <button
              className={settingsScope === s ? "active" : ""}
              key={s}
              onClick={() => setSettingsScope(s)}
            >
              {s}
              <Icon name="ChevronRight" size={15} />
            </button>
          ))}
        </div>
        <div className="settings-content">
          <div className="panel">
            <span className="eyebrow">
              {settingsScope.toUpperCase()} PREFERENCES
            </span>
            <h2>Make yourself at home.</h2>
            <a href="#profile" className="exp-button">
              Edit your full profile & appearance
            </a>
            {["User", "Workspace", "Device"].includes(settingsScope) ? (
              <>
                <label>
                  Display name
                  <input
                    value={data.settings.name}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        settings: { ...d.settings, name: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  Workspace name
                  <input
                    value={data.settings.workspace}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        settings: { ...d.settings, workspace: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  Appearance
                  <select
                    value={data.settings.theme}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        settings: { ...d.settings, theme: e.target.value },
                      }))
                    }
                  >
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                </label>
                <label className="toggle-row">
                  <span>
                    <strong>Reduce motion</strong>
                    <small>Keep the office and interface calm.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={data.settings.motion}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        settings: { ...d.settings, motion: e.target.checked },
                      }))
                    }
                  />
                </label>
                <label className="toggle-row">
                  <span>
                    <strong>Show local notifications</strong>
                    <small>Display in-app update messages.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={data.settings.notifications}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        settings: {
                          ...d.settings,
                          notifications: e.target.checked,
                        },
                      }))
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <div className="notice">
                  {settingsScope} policy settings require backend scope
                  resolution. These are not enforced security controls.
                </div>
                <Button
                  onClick={() =>
                    navigate(
                      settingsScope === "Agent"
                        ? "agents"
                        : settingsScope === "Project"
                          ? "projects"
                          : settingsScope === "Run"
                            ? "missions"
                            : "security",
                    )
                  }
                >
                  Open {settingsScope.toLowerCase()} controls
                </Button>
              </>
            )}
            <p className="muted">
              Personal preferences save automatically on this device.
            </p>
          </div>
          <div className="panel">
            <h3>Workspace data</h3>
            <p>
              Keep a portable copy of your local projects, profiles, and drafts.
            </p>
            <Button icon="Download" onClick={exportData}>
              Export workspace
            </Button>
            <label className="button import-button">
              Import backup
              <input
                type="file"
                accept="application/json"
                className="accessible-file-input"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    if (file.size > 5 * 1024 * 1024)
                      throw new Error("Backup is too large");
                    const value = JSON.parse(await file.text());
                    validateWorkspace(value);
                    setModal({ type: "import", value });
                  } catch (error) {
                    notify(error.message);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <Button
              kind="danger"
              icon="Trash2"
              onClick={() => setModal({ type: "reset" })}
            >
              Clear workspace
            </Button>
          </div>
        </div>
      </div>
    );
  }
  function Help() {
    return (
      <div className="help-grid">
        {[
          [
            "Start with a thought",
            "Open Chat to save an idea, then create a mission with a clear objective.",
            "chat",
          ],
          [
            "Build your circle",
            "Configure agents by role, capabilities, and preferred autonomy.",
            "agents",
          ],
          [
            "Give work a home",
            "Create a project, set its owner, and track your progress.",
            "projects",
          ],
          [
            "Explore your studio",
            "Drag the 3D office to rotate. Select an agent to inspect its profile.",
            "office",
          ],
          [
            "Bring your tools",
            "Save the providers you want to connect. Actual OAuth requires a backend.",
            "integrations",
          ],
          [
            "Keep your data",
            "Export a workspace snapshot whenever you need a portable backup.",
            "settings",
          ],
        ].map(([t, p, r]) => (
          <button
            className="panel help-card"
            key={r}
            onClick={() => navigate(r)}
          >
            <Icon name="ArrowUpRight" />
            <h2>{t}</h2>
            <p>{p}</p>
          </button>
        ))}
      </div>
    );
  }
  const toggleTheme = () =>
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        theme: d.settings.theme === "Dark" ? "Light" : "Dark",
      },
    }));
  const startTour = () => {
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        tour: {
          step: d.settings.tour?.state === "Paused" ? d.settings.tour.step : 0,
          state: "Active",
        },
      },
    }));
    setTourOpen(true);
  };
  if (!recovery && route === "welcome")
    return <Welcome theme={data.settings.theme} toggle={toggleTheme} />;
  if (!recovery && ["sign-in", "sign-up", "recovery", "join"].includes(route))
    return (
      <AccountEntry
        key={route}
        route={route}
        theme={data.settings.theme}
        toggle={toggleTheme}
      />
    );
  let page =
    route === "profile" ? (
      <ProfileExperience
        key={workspaceIndex.active}
        data={data}
        update={update}
        startTour={startTour}
        resumeSetup={() => update((d) => ({ ...d, onboarded: false }))}
      />
    ) : route === "help" ? (
      <HelpCenter data={data} />
    ) : ["runs", "observability"].includes(route) ? (
      <RunWorkspace data={data} update={update} route={route} />
    ) : ["simulation", "evaluations", "improvement"].includes(route) ? (
      <ExperimentWorkspace
        key={route}
        data={data}
        update={update}
        route={route}
      />
    ) : route === "finance" ? (
      <FinanceWorkspace data={data} update={update} />
    ) : route === "delivery" ? (
      <DeliveryWorkspace data={data} update={update} />
    ) : route === "operations" ? (
      <OperationsWorkspace data={data} update={update} />
    ) : route === "creative" ? (
      <CreativeStudio data={data} update={update} />
    ) : route === "models" ? (
      <RuntimeSettings data={data} update={update} route={route} />
    ) : route === "research" ? (
      <ResearchWorkspace data={data} update={update} />
    ) : route === "knowledge" ? (
      <KnowledgeHub data={data} update={update} />
    ) : route === "engineering" ? (
      <EngineeringDesk data={data} update={update} />
    ) : route === "documents" ? (
      <DocumentsStudio data={data} update={update} />
    ) : route === "inbox" ? (
      <Decisions data={data} update={update} />
    ) : route === "security" ? (
      <Administration data={data} update={update} />
    ) : route === "usage" ? (
      <Subscription data={data} update={update} />
    ) : route === "customers" ? (
      <Customers data={data} update={update} />
    ) : route === "files" ? (
      <Artifacts data={data} update={update} />
    ) : route === "missions" ? (
      <MissionPlanner data={data} update={update} />
    ) : route === "resources" ? (
      ResourceLibrary()
    ) : route === "home" ? (
      <PersonalDashboard
        data={data}
        update={update}
        startTour={startTour}
        openAssistant={(prompt) => setAssistant({ prompt })}
        createProject={() => setModal({ type: "project" })}
        createMission={(name) =>
          setModal({
            type: "mission",
            record: {
              id: crypto.randomUUID(),
              name,
              description: "",
              status: "Draft",
              owner: "You",
              priority: "Normal",
              due: "",
              dependsOn: [],
              criteria: [],
            },
          })
        }
      />
    ) : route === "chat" ? (
      <Conversations data={data} update={update} />
    ) : route === "feed" ? (
      Feed()
    ) : route === "projects" ? (
      Projects()
    ) : route === "agents" ? (
      Agents()
    ) : route === "office" ? (
      OfficePage()
    ) : route === "integrations" ? (
      <Connections data={data} update={update} />
    ) : route === "calendar" ? (
      <CalendarWorkspace data={data} update={update} />
    ) : route === "inbox" ? (
      Inbox()
    ) : route === "settings" ? (
      Settings()
    ) : route === "help" ? (
      Help()
    ) : route === "models" ? (
      Models()
    ) : route === "usage" ? (
      Usage()
    ) : route === "security" ? (
      Security()
    ) : domains[route] ? (
      RecordPage()
    ) : (
      <div className="empty">
        <h1>This page could not be found.</h1>
        <p>Choose a workspace destination or return to your dashboard.</p>
        <a className="exp-button" href="#home">
          Open dashboard
        </a>
        <a className="exp-button" href="#help">
          Browse help
        </a>
      </div>
    );
  return (
    <>
      {workspacePicker && (
        <WorkspaceManager
          index={workspaceIndex}
          activeName={data.settings.workspace}
          onSwitch={selectWorkspace}
          onCreate={createWorkspace}
          onClose={() => setWorkspacePicker(false)}
        />
      )}{" "}
      {recovery && (
        <Dialog title="Recover your workspace" onClose={() => {}}>
          <p>{recovery}</p>
          <p>
            Automatic saving is paused so your stored data is not overwritten.
          </p>
          {recoveryRaw && (
            <Button
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([recoveryRaw], { type: "application/json" }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "mindineers-recovery.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Download original data
            </Button>
          )}
          <Button onClick={() => setWorkspacePicker(true)}>
            Choose another workspace
          </Button>
          <p className="muted">
            To repair this workspace, keep a copy of the original data before
            importing a valid backup.
          </p>
        </Dialog>
      )}{" "}
      {!data.onboarded && !recovery && (
        <Onboarding
          settings={data.settings}
          draft={data.onboardingDraft}
          saveDraft={(onboardingDraft) =>
            update((d) => ({ ...d, onboardingDraft }))
          }
          finish={({ examples, tour, useCase, setupLater, ...settings }) => {
            if (tour && !setupLater) setTourOpen(true);
            update((d) => ({
              ...d,
              ...(examples &&
              !d.projects.length &&
              !d.agents.length &&
              !Object.values(d.records).some((items) => items.length)
                ? {
                    projects: structuredClone(seedProjects),
                    agents: structuredClone(initialAgents).map((a) => ({
                      ...a,
                      status: "Configured",
                    })),
                    records: structuredClone(seeds),
                    includesExamples: true,
                  }
                : {}),
              onboarded: true,
              onboardingDraft: setupLater ? d.onboardingDraft : null,
              settings: {
                ...d.settings,
                ...settings,
                ...(useCase
                  ? { profile: { ...d.settings.profile, useCase } }
                  : {}),
                ...(tour ? { tour: { step: 0, state: "Active" } } : {}),
              },
            }));
          }}
        />
      )}
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main").focus();
        }}
      >
        Skip to content
      </a>
      {mobile && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        aria-label="Workspace navigation"
        inert={narrow && !mobile}
        className={"sidebar " + (mobile ? "open" : "")}
      >
        {narrow && mobile && (
          <button className="button" onClick={() => setMobile(false)}>
            Close navigation
          </button>
        )}
        <a href="#home" className="brand">
          <span className="brand-icon">m✳</span>
          <span>
            mindineers<span className="brand-os">OS</span>
          </span>
        </a>
        <button
          className="workspace-switch"
          onClick={() => setWorkspacePicker(true)}
        >
          <span className="workspace-avatar">K</span>
          <span>
            <strong>{data.settings.workspace}</strong>
            <small>Personal workspace</small>
          </span>
          <Icon name="ChevronsUpDown" size={15} />
        </button>
        <button className="side-search" onClick={() => setSearchOpen(true)}>
          <Icon name="Search" size={17} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav aria-label="Main navigation">
          <span className="nav-heading">WORKSPACE</span>
          {modules.slice(0, 9).map(([id, label, icon]) => (
            <a
              key={id}
              href={"#" + id}
              className={route === id ? "selected" : ""}
              aria-current={route === id ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {id === "chat" && <span className="nav-new">NEW</span>}
              {id === "office" && <span className="nav-pill">3D</span>}
            </a>
          ))}
          <a href="#runs" className={route === "runs" ? "selected" : ""}>
            <Icon name="Activity" />
            <span>Run control</span>
          </a>
          <a
            href="#resources"
            className={route === "resources" ? "selected" : ""}
          >
            <Icon name="Boxes" />
            <span>Resource library</span>
            <span className="nav-pill">10</span>
          </a>
          <span className="nav-heading">YOUR TOOLKIT</span>
          {modules.slice(9, 13).map(([id, label, icon]) => (
            <a
              key={id}
              href={"#" + id}
              className={route === id ? "selected" : ""}
              aria-current={route === id ? "page" : undefined}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </a>
          ))}
          <button
            className="more-nav"
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            <Icon name="Grid2X2" />
            <span>All apps</span>
            <Icon name={more ? "ChevronUp" : "ChevronDown"} size={15} />
          </button>
          {more && (
            <div className="all-apps">
              {modules.slice(13, 31).map(([id, label, icon]) => (
                <a
                  key={id}
                  href={"#" + id}
                  className={route === id ? "selected" : ""}
                  aria-current={route === id ? "page" : undefined}
                >
                  <Icon name={icon} size={16} />
                  {label}
                </a>
              ))}
            </div>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-label">
            <span className="live-dot" />
            <span>Local workspace</span>
            <button
              className="icon-button"
              aria-label="About local workspace"
              onClick={() => navigate("help")}
            >
              <Icon name="Info" size={14} />
            </button>
          </div>
          <a href="#settings" className="settings-link">
            <Icon name="Settings2" />
            Settings
            <Icon name="ArrowUpRight" size={15} />
          </a>
          <a href="#welcome" className="settings-link">
            <Icon name="Home" />
            Product website
          </a>
          <button className="profile" onClick={() => navigate("profile")}>
            <span className="user-avatar">
              {data.settings.profile?.avatar ? (
                <img src={data.settings.profile.avatar} alt="" />
              ) : (
                data.settings.name.slice(0, 1) || "Y"
              )}
            </span>
            <span>
              <strong>{data.settings.name || "Your profile"}</strong>
              <small>Your own kind of possible</small>
            </span>
            <Icon name="MoreHorizontal" size={17} />
          </button>
        </div>
      </aside>
      <div className="app-body" inert={narrow && mobile}>
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
              onClick={() => setMobile(true)}
            >
              <Icon name="Menu" />
            </button>
            <span className="breadcrumb">
              Workspace <Icon name="ChevronRight" size={13} />{" "}
              <strong>{current[1]}</strong>
            </span>
          </div>
          <div className="top-actions">
            <ThemeToggle theme={data.settings.theme} toggle={toggleTheme} />
            <button
              className="icon-button"
              aria-label="Start guided tour"
              onClick={startTour}
            >
              <Icon name="Compass" />
            </button>
            <span className="preview-label">
              {data.includesExamples
                ? "EXAMPLE CONTENT · ON-DEVICE"
                : "ON-DEVICE"}
            </span>
            <button
              className="icon-button"
              aria-label="Search workspace"
              onClick={() => setSearchOpen(true)}
            >
              <Icon name="Search" />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Open inbox"
              onClick={() => navigate("inbox")}
            >
              <Icon name="Bell" />
              {(data.product?.decisions || []).some(
                (a) => a.state === "Pending",
              ) && <i />}
            </button>
            <button
              className="user-avatar small"
              aria-label="Edit your profile"
              onClick={() => navigate("profile")}
            >
              {data.settings.profile?.avatar ? (
                <img src={data.settings.profile.avatar} alt="" />
              ) : (
                data.settings.name.slice(0, 1) || "Y"
              )}
            </button>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className={route === "chat" ? "main chat-main" : "main"}
        >
          <RecoveryPanel
            history={history}
            restore={restore}
            blocked={!!recovery || !!storageConflict}
          />
          {saveFailed && (
            <SaveFailure
              retry={() => setSaveAttempt((n) => n + 1)}
              exportData={exportData}
            />
          )}
          {!online && (
            <div className="notice" role="status">
              You are offline. Saved local work remains available. Cloud
              services are not connected; this is not a cloud synchronization
              status.
            </div>
          )}
          {storageConflict && (
            <div className="notice conflict-notice">
              <div>
                <strong>This workspace changed in another tab.</strong>
                <p>
                  Saving is paused. Export your open copy before choosing which
                  version to keep.
                </p>
              </div>
              <Button onClick={exportData}>Export open copy</Button>
              <Button
                onClick={() => {
                  setData(storageConflict);
                  setStorageConflict(null);
                }}
              >
                Load incoming copy
              </Button>
              <Button onClick={() => setStorageConflict(null)}>
                Keep open copy
              </Button>
            </div>
          )}
          {route !== "home" && route !== "chat" && route !== "profile" && (
            <div className="page-heading">
              <span className="eyebrow">
                {route === "office"
                  ? "A WORKSPACE WITH PERSPECTIVE"
                  : "MINDINEERS WORKSPACE"}
              </span>
              <h1>{current[1]}</h1>
              <p>{current[3]}</p>
            </div>
          )}
          {!["home", "feed", "office", "resources", "runs", "profile"].includes(
            route,
          ) && (
            <div className="workspace-mode" aria-label="Workspace mode">
              <button
                className={!workbenchMode ? "active" : ""}
                aria-pressed={!workbenchMode}
                onClick={() => setWorkbenchMode(false)}
              >
                Overview
              </button>
              <button
                className={workbenchMode ? "active" : ""}
                aria-pressed={workbenchMode}
                onClick={() => setWorkbenchMode(true)}
              >
                Details & tools
              </button>
            </div>
          )}
          <RouteBoundary
            key={workspaceIndex.active + ":" + route + ":" + history.restores}
          >
            {workbenchMode ? (
              <Workbench
                key={route}
                route={route}
                data={data}
                update={update}
              />
            ) : (
              <Suspense fallback={<LoadingState />}>{page}</Suspense>
            )}
          </RouteBoundary>
          <footer className="footer">
            <span>Made for a mind like yours.</span>
            <span>MindineersOS · Your workspace</span>
          </footer>
        </main>
      </div>
      <button
        className="core-launcher"
        inert={narrow && mobile}
        onClick={() => setAssistant({ prompt: "" })}
        aria-label="Open Mindineers Core guide"
      >
        <Icon name="Sparkles" size={18} /> Ask Core
      </button>
      {assistant && (
        <CoreAssistant
          key={workspaceIndex.active}
          data={data}
          route={route}
          initialPrompt={assistant.prompt}
          navigate={navigate}
          onClose={() => setAssistant(null)}
        />
      )}
      {tourOpen && (
        <GuidedTour
          settings={data.settings}
          update={update}
          navigate={navigate}
          close={() => setTourOpen(false)}
        />
      )}
      {toast && data.settings.notifications && (
        <div className="toast" role="status">
          <Icon name="CheckCircle2" size={18} />
          {toast}
        </div>
      )}
      {searchOpen && (
        <Dialog
          title="Find your next move"
          onClose={() => setSearchOpen(false)}
        >
          <input
            autoFocus
            className="search-input"
            aria-label="Search apps and projects"
            placeholder="Search apps, projects, agents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-results">
            {visibleModules.map(([id, label, icon]) => (
              <button key={id} onClick={() => navigate(id)}>
                <Icon name={icon} />
                <span>{label}</span>
                <Icon name="ArrowUpRight" size={15} />
              </button>
            ))}
            {Object.entries(data.records).flatMap(([domain, items]) =>
              items
                .filter(
                  (r) =>
                    query && r.name.toLowerCase().includes(query.toLowerCase()),
                )
                .slice(0, 8)
                .map((r) => (
                  <button
                    key={domain + r.id}
                    onClick={() => {
                      navigate(domain);
                    }}
                  >
                    <Icon name="FileText" />
                    <span>
                      {r.name}
                      <small>
                        {" "}
                        · {modules.find((m) => m[0] === domain)?.[1] || domain}
                      </small>
                    </span>
                  </button>
                )),
            )}
            {data.projects
              .filter(
                (p) =>
                  query && p.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSearchOpen(false);
                    setModal({ type: "project", record: p });
                  }}
                >
                  <Icon name="Layers" />
                  {p.name}
                </button>
              ))}
            {data.agents
              .filter(
                (a) =>
                  query && a.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSearchOpen(false);
                    agentSelect(a.id);
                  }}
                >
                  <Icon name="Bot" />
                  {a.name}
                </button>
              ))}
          </div>
        </Dialog>
      )}
      {modal?.type === "mission" && (
        <MissionEditor
          task={modal.record}
          tasks={data.records.missions || []}
          agents={data.agents}
          close={() => setModal(null)}
          save={(record) => saveRecord("missions", record)}
        />
      )}
      {modal && modal.type !== "mission" && (
        <Modal
          key={modal.type + (modal.id || modal.record?.id || "")}
          modal={modal}
          replaceWorkspace={setData}
          data={data}
          update={update}
          saveRecord={saveRecord}
          close={() => setModal(null)}
          notify={notify}
          navigate={navigate}
        />
      )}
    </>
  );
}
function Dialog({ title, children, onClose }) {
  const ref = React.useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el.showModal();
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", close);
    return () => {
      el.removeEventListener("cancel", close);
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="X" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Modal({
  replaceWorkspace,
  modal: m,
  data,
  update,
  saveRecord,
  close,
  notify,
  navigate,
}) {
  const existing =
    m.type === "agent" ? data.agents.find((a) => a.id === m.id) : m.record;
  const [form, setForm] = useState(
    existing || {
      name: "",
      description: "",
      status: domains[m.domain]?.[2] || "Planning",
      owner: "You",
      progress: 0,
      color: "#c2d2ac",
      role: "",
      tools: "",
      autonomy: "Draft only",
      date: m.date || new Date().toISOString().slice(0, 10),
    },
  );
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const save = (e) => {
    e.preventDefault();
    if (m.type === "agent") {
      const a = {
        ...form,
        id: existing?.id || crypto.randomUUID(),
        symbol: form.name.slice(0, 1).toUpperCase(),
        color: form.color || "#c2d2ac",
        status: "Configured",
        model: "Provider not connected",
      };
      update((d) => ({
        ...d,
        agents: existing
          ? d.agents.map((x) => (x.id === a.id ? a : x))
          : [...d.agents, a],
      }));
    } else if (m.type === "project") {
      const p = { ...form, id: existing?.id || crypto.randomUUID() };
      update((d) => ({
        ...d,
        projects: existing
          ? d.projects.map((x) => (x.id === p.id ? p : x))
          : [p, ...d.projects],
      }));
    } else if (m.type === "record") {
      saveRecord(m.domain, form);
    } else if (m.type === "post") {
      update((d) => ({
        ...d,
        posts: [
          {
            id: crypto.randomUUID(),
            agent: "You",
            title: form.name,
            body: form.description,
            likes: 0,
            saved: false,
            comments: [],
          },
          ...d.posts,
        ],
      }));
    } else if (m.type === "comment") {
      update((d) => ({
        ...d,
        posts: d.posts.map((p) =>
          p.id === m.post
            ? { ...p, comments: [...p.comments, form.description] }
            : p,
        ),
      }));
    }
    notify("Saved to your local workspace");
    close();
  };
  if (m.type === "import")
    return (
      <Dialog title="Import this workspace?" onClose={close}>
        <p>
          This replaces your current local projects, drafts, and preferences.
          File binaries are not included in JSON backups. Export your current
          workspace first if you want to keep it.
        </p>
        <div className="dialog-actions">
          <Button onClick={close}>Cancel</Button>
          <Button
            kind="dark"
            onClick={() => {
              replaceWorkspace(() => ({ ...fresh(), ...m.value }));
              close();
              notify("Workspace imported");
            }}
          >
            Import workspace
          </Button>
        </div>
      </Dialog>
    );
  if (m.type === "reset" || m.type === "clearChat")
    return (
      <Dialog
        title={
          m.type === "reset"
            ? "Reset this workspace?"
            : "Clear this conversation?"
        }
        onClose={close}
      >
        <p>
          This removes{" "}
          {m.type === "reset"
            ? "all local edits and creates an empty workspace"
            : "your saved messages from this browser"}
          . Export anything you want to keep first.
        </p>
        <div className="dialog-actions">
          <Button onClick={close}>Keep my work</Button>
          <Button
            kind="danger"
            onClick={() => {
              if (m.type === "reset") replaceWorkspace(fresh());
              else update((d) => ({ ...d, messages: [] }));
              close();
            }}
          >
            Confirm reset
          </Button>
        </div>
      </Dialog>
    );
  return (
    <Dialog
      title={
        m.type === "agent"
          ? existing
            ? "Meet " + existing.name
            : "Create an agent"
          : m.type === "project"
            ? existing
              ? "Project details"
              : "Start something new"
            : m.type === "post"
              ? "Share a studio update"
              : m.type === "comment"
                ? "Join the conversation"
                : existing
                  ? "Edit " + existing.name
                  : domains[m.domain]?.[0] || "New item"
      }
      onClose={close}
    >
      <form onSubmit={save}>
        {m.type === "agent" && existing && (
          <div className="agent-modal-intro">
            <Avatar agent={existing} size="large" />
            <p>{existing.description}</p>
          </div>
        )}
        {m.type !== "comment" && (
          <label>
            {m.type === "post" ? "Headline" : "Name"}
            <input
              autoFocus
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
            />
          </label>
        )}
        {m.type === "agent" && (
          <label>
            Role
            <input
              required
              value={form.role}
              onChange={(e) => field("role", e.target.value)}
            />
          </label>
        )}
        <label>
          {m.type === "comment"
            ? "Comment"
            : domains[m.domain]?.[1] || "Description"}
          <textarea
            required
            rows={m.domain === "documents" ? 12 : 4}
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
          />
        </label>
        {m.domain === "calendar" && (
          <label>
            Date
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => field("date", e.target.value)}
            />
          </label>
        )}
        {m.type === "record" &&
          (fields[m.domain] || []).map(([key, label, type, options]) => (
            <label key={key}>
              {label}
              {type === "select" ? (
                <select
                  value={form[key] || ""}
                  onChange={(e) => field(key, e.target.value)}
                >
                  <option value="">Choose…</option>
                  {options.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={form[key] || ""}
                  pattern={
                    key === "amount" ? "[0-9]+(\\.[0-9]{1,8})?" : undefined
                  }
                  onChange={(e) => field(key, e.target.value)}
                />
              )}
            </label>
          ))}
        {m.domain === "files" && existing && (
          <Button
            type="button"
            icon="Download"
            onClick={async () => {
              try {
                await downloadFile(existing.id, existing.name);
              } catch (error) {
                notify(error.message);
              }
            }}
          >
            Download original
          </Button>
        )}
        {m.type === "agent" ? (
          <>
            <label>
              Capabilities
              <input
                value={form.tools}
                onChange={(e) => field("tools", e.target.value)}
              />
            </label>
            <label>
              Preferred autonomy
              <select
                value={form.autonomy}
                onChange={(e) => field("autonomy", e.target.value)}
              >
                <option>Draft only</option>
                <option>Ask before acting</option>
              </select>
            </label>
            <p className="muted">
              Profile preferences only. No live agent is running.
            </p>
          </>
        ) : (
          ["project", "record"].includes(m.type) && (
            <div className="form-two">
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => field("status", e.target.value)}
                >
                  {(m.type === "project"
                    ? ["Planning", "In progress", "Done"]
                    : domains[m.domain]?.slice(2) || ["Draft"]
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Owner
                <select
                  value={form.owner}
                  onChange={(e) => field("owner", e.target.value)}
                >
                  {["You", ...data.agents.map((a) => a.name)].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
            </div>
          )
        )}
        {m.type === "project" && (
          <label>
            Progress · {form.progress}%
            <input
              type="range"
              min="0"
              max="100"
              value={form.progress}
              onChange={(e) => field("progress", Number(e.target.value))}
            />
          </label>
        )}
        <div className="dialog-actions">
          <Button type="button" onClick={close}>
            Cancel
          </Button>
          {existing && m.type === "record" && (
            <Button
              type="button"
              kind="danger"
              onClick={() => {
                saveRecord(m.domain, {
                  ...form,
                  status: domains[m.domain].at(-1),
                });
                notify("Status updated");
                close();
              }}
            >
              Mark {domains[m.domain].at(-1).toLowerCase()}
            </Button>
          )}
          <Button type="submit" kind="dark" icon="Check">
            Save {m.type === "comment" ? "comment" : "changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
