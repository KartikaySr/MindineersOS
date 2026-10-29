import SpatialOffice from "./SpatialOffice";
import ConflictReview from "./domains/recovery/ConflictReview";
import type {
  Workspace,
  WorkspaceUpdate,
  LegacyRecord,
  AgentRecord,
} from "./shared/contracts/workspace";
import type { LucideProps } from "lucide-react";
import { parseWorkspace } from "./shared/services/workspace-repository";
interface DraftRecord extends Partial<LegacyRecord> {
  name: string;
  description: string;
  status: string;
}
type ModalState = {
  type:
    | "project"
    | "agent"
    | "record"
    | "post"
    | "comment"
    | "import"
    | "reset"
    | "clearChat"
    | "mission";
  id?: string;
  domain?: string;
  record?: LegacyRecord;
  post?: string;
  date?: string;
  value?: Workspace;
};
type SaveRecord = (domain: string, record: DraftRecord) => void;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to complete this action.";
import { useNavigationFocus } from "./shared/ui/useNavigationFocus";
import { useWorkspaceHistory } from "./domains/recovery/useWorkspaceHistory";
import RecoveryPanel from "./domains/recovery/RecoveryPanel";
import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
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
const CustomerPortal = lazy(() => import("./domains/delivery/CustomerPortal"));
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

import { saveFile, downloadFile } from "./files";
import { fields } from "./fields";
const Workbench = lazy(() => import("./Workbench"));
import Onboarding from "./Onboarding";
import MissionPlanner, { MissionEditor } from "./MissionPlanner";
const Conversations = lazy(() => import("./Conversations"));
const Connections = lazy(() => import("./Connections"));
const Artifacts = lazy(() => import("./Artifacts"));
const CalendarWorkspace = lazy(() => import("./CalendarWorkspace"));
const Customers = lazy(() => import("./Customers"));
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
const fresh = (): Workspace => ({
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
      error: errorMessage(error),
    };
  }
}
const initialWorkspace = boot();

function Icon({
  name = "Circle",
  size = 19,
  ...props
}: LucideProps & { name?: string }) {
  const C = Object.hasOwn(Icons, name)
    ? Icons[name as keyof typeof Icons]
    : Icons.Circle;
  return <C size={size} strokeWidth={1.65} {...props} />;
}
function Button({
  children,
  icon,
  onClick,
  kind = "",
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: string;
  kind?: string;
}) {
  return (
    <button className={"button " + kind} onClick={onClick} {...p}>
      {icon && <Icon name={icon} size={16} />} {children}
    </button>
  );
}
function Avatar({
  agent,
  size = "",
}: {
  agent?: { color?: string; name: string; symbol?: string } | undefined;
  size?: string;
}) {
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
  const [assistant, setAssistant] = useState<{ prompt: string } | null>(null),
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
  const setWorkbenchMode = (value: boolean) =>
    setModeSelection({ route, value });
  const [saveFailed, setSaveFailed] = useState(false),
    [saveAttempt, setSaveAttempt] = useState(0);
  const [workspaceIndex, setWorkspaceIndex] = useState(initialWorkspace.index),
    [workspacePicker, setWorkspacePicker] = useState(false),
    [recovery, setRecovery] = useState(initialWorkspace.error),
    [recoveryRaw, setRecoveryRaw] = useState(initialWorkspace.raw),
    [storageConflict, setStorageConflict] = useState<Workspace | null>(null);
  const {
    data,
    replace: setData,
    update,
    history,
    restore,
  } = useWorkspaceHistory(() => initialWorkspace.data || fresh());
  const [query, setQuery] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [modal, setModal] = useState<ModalState | null>(null),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [more, setMore] = useState(false),
    [filter, setFilter] = useState("All"),
    [settingsScope, setSettingsScope] = useState("User"),
    [view, setView] = useState("Grid"),
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
    const sync = (e: StorageEvent) => {
      if (e.key !== workspaceKey(workspaceIndex.active) || !e.newValue) return;
      try {
        const next = parseWorkspace(JSON.parse(e.newValue));
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

  const current: [string, string, string, string] =
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
          : modules.find((m) => m[0] === route) ||
            modules[0] || ["home", "Overview", "Home", "Your workspace"];
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
    const fn = (e: KeyboardEvent) => {
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
  const selectWorkspace = (id: string) => {
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
      notify(errorMessage(error));
    }
  };
  const createWorkspace = (name: string) => {
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
  const navigate = (id: string) => {
    location.hash = id;
    setSearchOpen(false);
  };
  const agentSelect = useCallback(
    (id: string) => setModal({ type: "agent", id }),
    [],
  );
  const notify = (message: string) => setToast(message);
  const records = data.records[route] || [];
  const useTemplate = (r: (typeof resources)[number]) => {
    const domain = domains[r.target] ? r.target : "missions";
    saveRecord(domain, {
      name: r.templateTitle || r.name,
      description:
        r.templateDescription +
        "\n\nSource: " +
        r.name +
        " (" +
        r.archive +
        "). Runtime not connected.",
      status: domains[domain]?.[2] || "Draft",
      owner: "You",
    });
    notify("Template added as a local draft");
    navigate(domain);
  };
  const newRecord = (id = route) => setModal({ type: "record", domain: id });
  const saveRecord: SaveRecord = (domain, record) =>
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        [domain]:
          record.id && (d.records[domain] || []).some((r) => r.id === record.id)
            ? (d.records[domain] || []).map((r) =>
                r.id === record.id ? { ...record, id: r.id } : r,
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
  ].filter((m) => (m[1] || "").toLowerCase().includes(query.toLowerCase()));
  function SectionHead({
    title,
    sub,
    action,
    target,
  }: {
    title: string;
    sub?: string;
    action?: string;
    target?: string;
  }) {
    return (
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {action && (
          <button
            className="text-button"
            onClick={() => navigate(target || "home")}
          >
            {action}
            <Icon name="ArrowUpRight" size={16} />
          </button>
        )}
      </div>
    );
  }
  function ProjectCard({ p }: { p: LegacyRecord }) {
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
  function AgentCard({ a }: { a: AgentRecord }) {
    return (
      <button className="agent-card" onClick={() => agentSelect(a.id)}>
        <div
          className="agent-art"
          style={{
            background: `radial-gradient(ellipse at 30% 20%,#ffffffaa,${a.color})`,
          }}
        >
          <div
            className="agent-orb"
            style={{ "--orb": a.color } as React.CSSProperties}
          >
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
  }: {
    action?: string;
    onAction?: () => void;
    statuses?: string[];
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
    const spec = domains[route] || ["New record", "Description", "Draft"];
    const list = records.filter((r) => filter === "All" || r.status === filter);
    return (
      <>
        <Toolbar
          action={spec[0]}
          onAction={() =>
            route === "files"
              ? document.getElementById("file-upload")?.click()
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
              const files = Array.from(e.target.files || []);
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
                  notify(errorMessage(error) || "Unable to store file");
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
                    {(r.description.split("\n\nSource:")[0] || "")
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
                ? document.getElementById("file-upload")?.click()
                : newRecord()
            }
          />
        )}
      </>
    );
  }
  function Empty({
    icon,
    title,
    text,
    action,
    onAction,
  }: {
    icon: string;
    title: string;
    text: string;
    action?: string;
    onAction?: () => void;
  }) {
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
        <SpatialOffice
          agents={data.agents}
          teams={(data.records.teams || []).map((team) => ({
            id: team.id,
            name: team.name,
            agentIds: (data.suite?.details[`teams:${team.id}`]?.links || [])
              .filter((link) => link.startsWith("agents:"))
              .map((link) => link.slice(7)),
          }))}
          posts={data.posts}
          onSelect={agentSelect}
          reduced={data.settings.motion}
        />
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
  function decide(id: string, state: string) {
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
          ].map(([name, description]) => (
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
            "Team",
            "Agent",
            "Run",
          ].map((s) => (
            <button
              className={settingsScope === s ? "active" : ""}
              key={s}
              onClick={() => {
                setSettingsScope(s);
                if (s !== "User") setWorkbenchMode(true);
              }}
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
                        settings: {
                          ...d.settings,
                          theme: e.target.value === "Dark" ? "Dark" : "Light",
                        },
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
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 5 * 1024 * 1024)
                      throw new Error("Backup is too large");
                    const value = JSON.parse(await file.text());
                    parseWorkspace(value);
                    setModal({ type: "import", value });
                  } catch (error) {
                    notify(errorMessage(error));
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
            onClick={() => navigate(r || "home")}
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
  if (route === "portal")
    return (
      <RouteBoundary>
        <Suspense fallback={<LoadingState />}>
          <CustomerPortal />
        </Suspense>
      </RouteBoundary>
    );
  if (!recovery && route === "welcome")
    return <Welcome theme={data.settings.theme} toggle={toggleTheme} />;
  if (
    !recovery &&
    (route === "sign-in" ||
      route === "sign-up" ||
      route === "recovery" ||
      route === "join")
  )
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
        workspaceId={workspaceIndex.active}
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
      <CreativeStudio
        workspaceId={workspaceIndex.active}
        data={data}
        update={update}
      />
    ) : route === "models" ? (
      <RuntimeSettings
        workspaceId={workspaceIndex.active}
        data={data}
        update={update}
        route={route}
      />
    ) : route === "research" ? (
      <ResearchWorkspace data={data} update={update} />
    ) : route === "knowledge" ? (
      <KnowledgeHub
        workspaceId={workspaceIndex.active}
        data={data}
        update={update}
      />
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
        selectAgent={agentSelect}
        data={data}
        update={update}
        startTour={startTour}
        openAssistant={(prompt) => setAssistant({ prompt: prompt || "" })}
        createProject={() => setModal({ type: "project" })}
        createMission={(name) =>
          setModal({
            type: "mission",
            record: {
              id: crypto.randomUUID(),
              name: name || "",
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
          finish={(result) => {
            if ("setupLater" in result) {
              update((d) => ({ ...d, onboarded: true }));
              return;
            }
            const { examples, tour, useCase, ...settings } = result;
            const setupLater = false;
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
                budget: Number(settings.budget),
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
          document.getElementById("main")?.focus();
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
              <Icon name={icon || "Circle"} />
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
              <Icon name={icon || "Circle"} />
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
            <ConflictReview
              key={JSON.stringify(storageConflict)}
              local={data}
              incoming={storageConflict}
              exportLocal={exportData}
              commit={(resolved, expected) => {
                const latest = readWorkspace(
                  localStorage,
                  workspaceIndex.active,
                  fresh,
                );
                if (latest.error || !latest.data)
                  throw new Error(
                    "The incoming copy cannot be read. Export your open copy before recovery.",
                  );
                if (JSON.stringify(latest.data) !== JSON.stringify(expected)) {
                  setStorageConflict(latest.data);
                  throw new Error(
                    "Another update arrived. Review the latest incoming copy.",
                  );
                }
                saveWorkspace(localStorage, workspaceIndex.active, resolved);
                setData(resolved);
                setStorageConflict(null);
              }}
            />
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
            <Suspense fallback={<LoadingState />}>
              {workbenchMode ? (
                <Workbench
                  workspaceId={workspaceIndex.active}
                  key={route}
                  route={route}
                  settingsScope={settingsScope}
                  data={data}
                  update={update}
                />
              ) : (
                page
              )}
            </Suspense>
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
              <button key={id} onClick={() => navigate(id || "home")}>
                <Icon name={icon || "Circle"} />
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
      {modal?.type === "mission" && modal.record && (
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
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const close = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", close);
    return () => {
      el.removeEventListener("cancel", close);
      if (previous instanceof HTMLElement) previous.focus();
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
}: {
  replaceWorkspace: (
    value: Workspace | ((current: Workspace) => Workspace),
  ) => void;
  modal: ModalState;
  data: Workspace;
  update: WorkspaceUpdate;
  saveRecord: SaveRecord;
  close: () => void;
  notify: (message: string) => void;
  navigate: (id: string) => void;
}) {
  const existing =
    m.type === "agent" ? data.agents.find((a) => a.id === m.id) : m.record;
  const [form, setForm] = useState<DraftRecord & { role: string }>({
    name: "",
    description: "",
    status: domains[m.domain || ""]?.[2] || "Planning",
    owner: "You",
    progress: 0,
    color: "#c2d2ac",
    role: "",
    tools: "",
    autonomy: "Draft only",
    date: m.date || new Date().toISOString().slice(0, 10),
    ...existing,
  });
  const field = (key: string, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));
  const save = (e: React.FormEvent) => {
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
      saveRecord(m.domain || "missions", form);
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
                  : domains[m.domain || ""]?.[0] || "New item"
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
            : domains[m.domain || ""]?.[1] || "Description"}
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
          (fields[m.domain || ""] || []).map(([key, label, type, options]) => (
            <label key={key}>
              {label}
              {type === "select" ? (
                <select
                  value={String(form[key] || "")}
                  onChange={(e) => field(key, e.target.value)}
                >
                  <option value="">Choose…</option>
                  {(options || []).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={String(form[key] || "")}
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
                notify(errorMessage(error));
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
                value={String(form.tools || "")}
                onChange={(e) => field("tools", e.target.value)}
              />
            </label>
            <label>
              Preferred autonomy
              <select
                value={String(form.autonomy || "")}
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
                    : domains[m.domain || ""]?.slice(2) || ["Draft"]
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
                saveRecord(m.domain || "missions", {
                  ...form,
                  status: domains[m.domain || ""]?.at(-1) || "Archived",
                });
                notify("Status updated");
                close();
              }}
            >
              Mark{" "}
              {(domains[m.domain || ""]?.at(-1) || "Archived").toLowerCase()}
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
