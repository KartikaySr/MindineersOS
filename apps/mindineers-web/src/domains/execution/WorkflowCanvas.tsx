import { useId, useState } from "react";
import { Button } from "../../shared/ui/controls";
import { graphLayout } from "./model";
import type { Graph } from "./model";
export default function WorkflowCanvas({
  graph,
  selected,
  select,
  save,
  readOnly = false,
}: {
  readOnly?: boolean;
  graph: Graph;
  selected: string;
  select: (id: string) => void;
  save: (graph: Graph) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const marker = useId().replaceAll(":", "");
  const positions = graphLayout(graph);
  const width = Math.max(600, ...[...positions.values()].map((p) => p.x + 240)),
    height = Math.max(280, ...[...positions.values()].map((p) => p.y + 120));
  const move = (id: string, dx: number, dy: number) => {
    const current = positions.get(id);
    if (current)
      save({
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                position: {
                  x: Math.min(100000, Math.max(10, current.x + dx)),
                  y: Math.min(100000, Math.max(10, current.y + dy)),
                },
              }
            : n,
        ),
      });
  };
  return (
    <section>
      <div className="wb-actions">
        <Button
          disabled={zoom <= 0.5}
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
        >
          Zoom out
        </Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button
          disabled={zoom >= 1.5}
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.25))}
        >
          Zoom in
        </Button>
        <Button
          disabled={readOnly}
          onClick={() =>
            save({
              ...graph,
              nodes: graph.nodes.map((n) => {
                const { position: _, ...node } = n;
                return node;
              }),
            })
          }
        >
          Auto-layout
        </Button>
      </div>
      <p className="muted">
        {readOnly
          ? "Select a node to inspect its recorded details. Connections show supplied dependencies."
          : "Select a node to edit it below. Focus a node and use arrow keys to move it; Enter selects it. Connections show configured dependencies, not execution."}
      </p>
      <div className="execution-canvas">
        <svg
          width={width * zoom}
          height={height * zoom}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label="Workflow dependency canvas"
        >
          <defs>
            <marker
              id={marker}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8" fill="currentColor" />
            </marker>
          </defs>
          {graph.edges.map((e, i) => {
            const a = positions.get(e.from),
              b = positions.get(e.to);
            if (!a || !b) return null;
            return (
              <g key={i}>
                <path
                  className="execution-edge"
                  d={`M${a.x + 210},${a.y + 40} C${a.x + 240},${a.y + 40} ${b.x - 30},${b.y + 40} ${b.x},${b.y + 40}`}
                  markerEnd={`url(#${marker})`}
                />
                {e.fromPort && (
                  <text x={(a.x + 210 + b.x) / 2} y={(a.y + b.y) / 2 + 27}>
                    {e.fromPort} → {e.toPort}
                  </text>
                )}
              </g>
            );
          })}
          {graph.nodes.map((n) => {
            const p = positions.get(n.id)!;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${n.name}, ${n.type}. ${readOnly ? "Enter selects node." : "Arrow keys move node."}`}
                aria-pressed={n.id === selected}
                onClick={() => select(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(n.id);
                  }
                  const delta: Record<string, [number, number]> = {
                    ArrowLeft: [-20, 0],
                    ArrowRight: [20, 0],
                    ArrowUp: [0, -20],
                    ArrowDown: [0, 20],
                  };
                  const d = delta[e.key];
                  if (d && !readOnly) {
                    e.preventDefault();
                    move(n.id, ...d);
                  }
                }}
              >
                <rect
                  width="210"
                  height="80"
                  rx="12"
                  className={n.id === selected ? "selected" : ""}
                />
                <text x="14" y="26">
                  {n.type}
                </text>
                <text x="14" y="51">
                  {n.name.length > 24 ? n.name.slice(0, 23) + "…" : n.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
