import { lazy, Suspense, useMemo, useState } from "react";
import type { AgentRecord, Workspace } from "./shared/contracts/workspace";
import { Button } from "./shared/ui/controls";
const Office = lazy(() => import("./Office"));
export default function SpatialOffice({
  agents,
  onSelect,
  reduced,
  teams = [],
  posts = [],
}: {
  agents: AgentRecord[];
  teams?: { id: string; name: string; agentIds: string[] }[];
  posts?: Workspace["posts"];
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const [room, setRoom] = useState(0);
  const [lowResource, setLowResource] = useState(false);
  const [layout, setLayout] = useState<"studio" | "circle">("studio");
  const [query, setQuery] = useState("");
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("");
  const [activityVisible, setActivityVisible] = useState(false);
  const selectedTeam = teams.find((team) => team.id === teamId);
  const filtered = useMemo(
    () =>
      agents.filter(
        (agent) =>
          (!selectedTeam || selectedTeam.agentIds.includes(agent.id)) &&
          (!role || agent.role === role) &&
          `${agent.name} ${agent.role}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [agents, selectedTeam, role, query],
  );
  const rooms = Math.max(1, Math.ceil(filtered.length / 4));
  const current = Math.min(room, rooms - 1);
  const visible = useMemo(
    () => filtered.slice(current * 4, current * 4 + 4),
    [filtered, current],
  );
  const activityFor = (agent: AgentRecord) =>
    posts.filter(
      (post) =>
        post.agent === agent.id ||
        (post.agent === agent.name &&
          agents.filter((candidate) => candidate.name === agent.name).length ===
            1),
    );
  return (
    <>
      <div className="toolbar">
        <label>
          Search office
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setRoom(0);
            }}
            placeholder="Agent name or role"
          />
        </label>
        <label>
          Team group
          <select
            value={selectedTeam?.id || ""}
            onChange={(event) => {
              setTeamId(event.target.value);
              setRoom(0);
            }}
          >
            <option value="">All agents</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setRoom(0);
            }}
          >
            <option value="">All roles</option>
            {[...new Set(agents.map((agent) => agent.role))].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      {selectedTeam && (
        <p className="muted">
          Showing agents linked to this team. Manage these links in{" "}
          <a href="#teams">Teams → Details & tools → Links</a>.
        </p>
      )}
      <div className="toolbar">
        <label>
          Office layout{" "}
          <select
            value={layout}
            onChange={(e) =>
              setLayout(e.target.value === "circle" ? "circle" : "studio")
            }
          >
            <option value="studio">Studio desks</option>
            <option value="circle">Circular desks</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={lowResource}
            onChange={(e) => setLowResource(e.target.checked)}
          />{" "}
          Low-resource 2D view
        </label>
        <div className="wb-actions" aria-label="Office rooms">
          <Button disabled={current === 0} onClick={() => setRoom(current - 1)}>
            Previous room
          </Button>
          <span role="status">
            Room {current + 1} of {rooms}
          </span>
          <Button
            disabled={current + 1 >= rooms}
            onClick={() => setRoom(current + 1)}
          >
            Next room
          </Button>
        </div>
      </div>
      {!filtered.length ? (
        <div className="panel" role="status">
          <p>
            {!agents.length
              ? "No agents yet. Create an agent to populate your office."
              : "No agents match this group and search."}
          </p>
          <Button
            onClick={() => {
              setQuery("");
              setTeamId("");
              setRole("");
              setRoom(0);
            }}
          >
            Clear filters
          </Button>
          <a href="#agents">Manage agents</a>
        </div>
      ) : lowResource ? (
        <section className="panel" aria-label="Office room">
          <h3>Room {current + 1}</h3>
          <p>3D rendering is paused. Select an agent to inspect its profile.</p>
          {visible.map((agent) => (
            <Button key={agent.id} onClick={() => onSelect(agent.id)}>
              {agent.name}
            </Button>
          ))}
        </section>
      ) : (
        <div className="office-full panel">
          <Suspense
            fallback={<div className="scene-loading">Opening your studio…</div>}
          >
            <Office
              agents={visible}
              onSelect={onSelect}
              reduced={reduced}
              layout={layout}
            />
          </Suspense>
        </div>
      )}
      <section
        className="panel"
        aria-label="Office roster and recorded activity"
      >
        <h3>Room roster · {filtered.length} matching agents</h3>
        <p className="muted">
          Profile status and saved activity only. Live presence and execution
          are not connected.
        </p>
        <label>
          <input
            type="checkbox"
            checked={activityVisible}
            onChange={(event) => setActivityVisible(event.target.checked)}
          />{" "}
          Show recorded activity in this view
        </label>
        {visible.map((agent) => (
          <article key={agent.id} className="wb-body">
            <Button onClick={() => onSelect(agent.id)}>
              {agent.name} · {agent.role}
            </Button>
            <span>Profile status: {agent.status || "Not set"}</span>
            {activityVisible && (
              <ul>
                {activityFor(agent)
                  .slice(0, 3)
                  .map((post) => (
                    <li key={post.id}>
                      <a href="#feed">{post.title}</a>
                    </li>
                  ))}
                {!activityFor(agent).length && <li>No recorded activity.</li>}
              </ul>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
