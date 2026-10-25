import type {
  Workspace,
  WorkspaceUpdate,
  LegacyRecord,
} from "./shared/contracts/workspace";
import ArtifactPreview from "./shared/ui/ArtifactPreview";
import { useState, useRef } from "react";
import { saveFile, downloadFile } from "./files";
const size = (n = 0) =>
  n >= 1048576
    ? (n / 1048576).toFixed(1) + " MB"
    : Math.ceil((n || 0) / 1024) + " KB";
export default function Artifacts({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null),
    items = data.records.files || [],
    item = items.find((i) => i.id === selected);
  const patch = (id: string, value: Partial<LegacyRecord>) =>
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        files: (d.records.files || []).map((i) =>
          i.id === id ? { ...i, ...value } : i,
        ),
      },
    }));
  const ingest = async (files: File[]) => {
    setBusy(true);
    let stored = 0;
    for (const file of files) {
      try {
        const id = crypto.randomUUID();
        await saveFile(file, id);
        update((d) => ({
          ...d,
          records: {
            ...d.records,
            files: [
              {
                id,
                name: file.name,
                description: "",
                status: "Local",
                owner: "You",
                mime: file.type,
                bytes: file.size,
                createdAt: new Date().toISOString(),
                review: "Unreviewed",
                tags: "",
              },
              ...(d.records.files || []),
            ],
          },
        }));
        stored++;
        setSelected(id);
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to complete this action.",
        );
      }
    }
    if (stored)
      setNotice(
        `${stored} file${stored === 1 ? "" : "s"} saved on this device.`,
      );
    setBusy(false);
  };
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "Archived"
        ? i.status === "Archived"
        : i.status !== "Archived" &&
          (filter === "All" ||
            (filter === "Images" && i.mime?.startsWith("image/")) ||
            (filter === "Documents" && !i.mime?.startsWith("image/")))),
  );
  return (
    <section className="artifacts">
      <div className="toolbar">
        <div className="tabs" role="group">
          {["All", "Images", "Documents", "Archived"].map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          className="button dark"
          disabled={busy}
          onClick={() => upload.current?.click()}
        >
          {busy ? "Uploading…" : "+ Upload files"}
        </button>
        <input
          ref={upload}
          hidden
          type="file"
          multiple
          onChange={(e) => {
            ingest(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
      </div>
      <div
        className="artifact-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) ingest(Array.from(e.dataTransfer.files));
        }}
      >
        <span>↥</span>
        <div>
          <strong>A place for everything you make.</strong>
          <p>
            Drop files here or use Upload. Up to 25 MB per file. Originals stay
            on this device.
          </p>
        </div>
      </div>
      <div className="mission-filters">
        <input
          aria-label="Search files"
          placeholder="Find an artifact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>
          {filtered.length} files ·{" "}
          {size(filtered.reduce((n, i) => n + (i.bytes || 0), 0))}
        </span>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <div className="artifact-workspace">
        <div className="artifact-grid">
          {filtered.map((i) => (
            <button
              key={i.id}
              className={"artifact-card " + (selected === i.id ? "active" : "")}
              onClick={() => setSelected(i.id)}
            >
              <div className="artifact-type">
                {i.mime?.startsWith("image/")
                  ? "▧"
                  : i.mime === "application/pdf"
                    ? "PDF"
                    : "↳"}
                <span>{i.mime?.split("/")[1]?.slice(0, 12) || "FILE"}</span>
              </div>
              <strong>{i.name}</strong>
              <small>
                {size(i.bytes)} · {i.review || "Unreviewed"}
              </small>
            </button>
          ))}
          {!filtered.length && (
            <div className="empty">
              <h2>
                {filter === "Archived"
                  ? "Nothing archived."
                  : "Your work belongs here."}
              </h2>
              <p>
                Upload a reference, a deliverable, or the beginning of an idea.
              </p>
            </div>
          )}
        </div>
        {item && (
          <aside className="artifact-inspector">
            <div className="wb-row">
              <h2>Artifact details</h2>
              <button
                className="icon-button"
                aria-label="Close artifact"
                onClick={() => setSelected("")}
              >
                ×
              </button>
            </div>
            <ArtifactPreview item={item} />
            <label>
              Name
              <input
                value={item.name}
                maxLength={300}
                onChange={(e) => patch(item.id, { name: e.target.value })}
              />
            </label>
            <label>
              Notes
              <textarea
                value={item.description}
                rows={3}
                onChange={(e) =>
                  patch(item.id, { description: e.target.value })
                }
              />
            </label>
            <label>
              Tags
              <input
                value={item.tags || ""}
                onChange={(e) => patch(item.id, { tags: e.target.value })}
                placeholder="Research, launch, reference…"
              />
            </label>
            <label>
              Review
              <select
                value={item.review || "Unreviewed"}
                onChange={(e) => patch(item.id, { review: e.target.value })}
              >
                {[
                  "Unreviewed",
                  "In review",
                  "Accepted",
                  "Changes requested",
                ].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <dl>
              <dt>Owner</dt>
              <dd>{item.owner}</dd>
              <dt>Stored</dt>
              <dd>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : "Unknown"}
              </dd>
              <dt>Source</dt>
              <dd>User upload · this device</dd>
            </dl>
            <div className="wb-actions">
              <button
                className="button dark"
                onClick={async () => {
                  try {
                    await downloadFile(item.id, item.name);
                  } catch (e) {
                    setNotice(
                      e instanceof Error
                        ? e.message
                        : "Unable to download file.",
                    );
                  }
                }}
              >
                Download
              </button>
              <button
                className="button"
                onClick={() =>
                  patch(item.id, {
                    status: item.status === "Archived" ? "Local" : "Archived",
                  })
                }
              >
                {item.status === "Archived" ? "Restore" : "Archive"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
