import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Database,
  Layers,
  LockKeyhole,
  Play,
  Pause,
  RotateCcw,
  Bot,
  Cloud,
  HardDrive,
} from "lucide-react";
import "./architecture.css";

const layers = [
  {
    name: "Your workspace",
    icon: Layers,
    stack: "React · TypeScript · Vite",
    status: "Implemented",
    detail:
      "Plan missions, manage documents, review decisions, and organize agent work in one interface. Typed contracts and input validation help keep each module consistent.",
    boundary:
      "Screens describe saved workspace data. Agent execution requires a connected runtime.",
  },
  {
    name: "Device storage",
    icon: HardDrive,
    stack: "Browser storage · IndexedDB",
    status: "Implemented",
    detail:
      "Workspace records persist locally. Attachments and voice recordings are stored on the device. Recovery and import checks help preserve work when storage or validation fails.",
    boundary:
      "Server snapshots contain attachment references. The attachment bytes remain on the original device.",
  },
  {
    name: "Session & API",
    icon: LockKeyhole,
    stack: "Node.js · REST · Browser sessions",
    status: "Implemented · deployment required",
    detail:
      "The existing API host signs users in and checks their session. Workspace ownership comes from that server session. Writes require a CSRF token and pass size and structure validation.",
    boundary:
      "The frontend connects through same-origin API routes when server integration is enabled.",
  },
  {
    name: "Workspace store",
    icon: Database,
    stack: "Drizzle ORM · PostgreSQL / PGlite",
    status: "Implemented · integration verification open",
    detail:
      "A transaction saves the workspace and its revision history together. Revision checks prevent stale overwrites. A request ID lets interrupted saves return their previously committed result.",
    boundary:
      "Account isolation and concurrent saves have isolated database and HTTP checks. Full host startup and automatic migration still need verification.",
  },
  {
    name: "Agent execution",
    icon: Bot,
    stack: "Existing agent framework · Tools · Models",
    status: "Product integration in progress",
    detail:
      "The repository includes an agent runtime and plugin infrastructure. The product roadmap connects mission execution, approval policies, tool access, and results to the workspace.",
    boundary:
      "End-to-end mission execution, team authorization, billing, and shared file services remain under development.",
  },
] as const;
const flows = [
  {
    title: "Save on this device",
    nodes: [0, 1],
    steps: [
      "Edit a mission, document, or workspace preference.",
      "Persist the workspace locally. Attachment bytes stay in device storage.",
    ],
  },
  {
    title: "Save a private server copy",
    nodes: [0, 2, 3],
    steps: [
      "Choose a server copy and send its last observed revision with a stable request ID.",
      "Check the session, ownership, CSRF token, and request body.",
      "Commit the new revision and history atomically. A repeated request returns the original result.",
    ],
  },
  {
    title: "Recover an earlier version",
    nodes: [2, 3, 0, 1],
    steps: [
      "Authenticate the request to read your private history.",
      "Load a saved revision belonging to your account.",
      "Validate the downloaded workspace before opening it.",
      "Create a separate local workspace with the recovered contents.",
    ],
  },
];
export default function ArchitectureExplorer({ motion }: { motion: boolean }) {
  const [selected, setSelected] = useState(0),
    [flow, setFlow] = useState(0),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const journey = flows[flow]!;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || reduced || !motion) return;
    const timer = setTimeout(() => {
      if (step === journey.nodes.length - 1) {
        setPlaying(false);
        return;
      }
      setStep(step + 1);
      setSelected(journey.nodes[step + 1]!);
    }, 2300);
    return () => clearTimeout(timer);
  }, [playing, reduced, motion, step, journey]);
  const active = layers[selected]!;
  function selectFlow(index: number) {
    setFlow(index);
    setStep(0);
    setPlaying(false);
    setSelected(flows[index]!.nodes[0]!);
  }
  return (
    <div
      className="architecture-explorer"
      data-animate={playing && motion && !reduced}
    >
      <p className="architecture-intro">
        MindineersOS brings project planning, documents, and agent supervision
        into one workspace. Explore the components, then follow a real data
        flow.
      </p>
      <div className="architecture-layout">
        <section className="architecture-map" aria-label="System components">
          {layers.map((layer, index) => (
            <div key={layer.name}>
              {index > 0 && (
                <div className="architecture-link" aria-hidden="true">
                  <ArrowDown size={18} />
                </div>
              )}
              <button
                className="architecture-node"
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setPlaying(false);
                }}
              >
                <layer.icon size={23} />
                <span>
                  <strong>{layer.name}</strong>
                  <small>{layer.stack}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
          <p className="architecture-caption">
            Component overview. Select a flow below to see its actual path.
          </p>
        </section>
        <section
          className="architecture-detail"
          aria-label="Selected component"
        >
          <active.icon size={30} />
          <span className="architecture-status">{active.status}</span>
          <h3>{active.name}</h3>
          <p>{active.detail}</p>
          <div className="architecture-boundary">
            <Cloud size={18} />
            <p>{active.boundary}</p>
          </div>
          <div className="architecture-principle">
            <strong>Human-directed work</strong>
            <p>
              People review changes and retain control over the workspace.
              Server-side permissions and execution approvals must govern
              connected agents.
            </p>
          </div>
        </section>
      </div>
      <section className="architecture-flow" aria-label="Explore a data flow">
        <label>
          Follow a workflow
          <select
            value={flow}
            onChange={(e) => selectFlow(Number(e.target.value))}
          >
            {flows.map((item, index) => (
              <option value={index} key={item.title}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <ol className="architecture-path">
          {journey.nodes.map((node, index) => (
            <li key={index}>
              <button
                aria-current={step === index ? "step" : undefined}
                onClick={() => {
                  setPlaying(false);
                  setStep(index);
                  setSelected(node);
                }}
              >
                {layers[node]!.name}
              </button>
              {index < journey.nodes.length - 1 && (
                <ArrowRight size={16} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <p className="architecture-step" aria-live={playing ? "off" : "polite"}>
          {journey.steps[step]}
        </p>
        <div className="architecture-controls">
          {motion && !reduced && (
            <button
              className="exp-button"
              onClick={() => {
                if (step === journey.nodes.length - 1) {
                  setStep(0);
                  setSelected(journey.nodes[0]!);
                }
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
              {playing ? "Pause" : "Animate flow"}
            </button>
          )}
          <button
            className="exp-button"
            disabled={step === journey.nodes.length - 1}
            onClick={() => {
              setPlaying(false);
              setStep(step + 1);
              setSelected(journey.nodes[step + 1]!);
            }}
          >
            Next step <ArrowRight size={16} />
          </button>
          <button className="exp-button" onClick={() => selectFlow(flow)}>
            <RotateCcw size={16} /> Restart
          </button>
        </div>
      </section>
    </div>
  );
}
