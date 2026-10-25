import RepositoryInspector from "./domains/product/RepositoryInspector";
import { releaseErrors } from "./domains/product/model";
import ReviewPanel from "./domains/product/ReviewPanel";
import type {
  Workspace,
  WorkspaceUpdate,
  ChangeRecord,
} from "./shared/contracts/workspace";
import { useState } from "react";
import { Button, Field, Dialog, Tabs, Empty, useCollection } from "./ProductUI";
import { uid, download } from "./product-model";
export default function EngineeringDesk({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [changes, setChanges] = useCollection(data, update, "changes"),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("Files"),
    [editing, setEditing] = useState(false),
    [name, setName] = useState("");
  const change = changes.find((c) => c.id === selected) || changes[0];
  const patch = (value: Partial<ChangeRecord>) =>
    setChanges((rows) =>
      rows.map((c) => (c.id === change?.id ? { ...c, ...value } : c)),
    );
  const create = () => {
    const c = {
      id: uid(),
      name: name || "Untitled change",
      repository: "",
      branch: "",
      files: [{ id: uid(), path: "README.md", before: "", after: "" }],
      checks: [],
      comments: [],
      release: "",
      rollback: "",
      status: "Draft",
    };
    setChanges((rows) => [c, ...rows]);
    setSelected(c.id);
    setEditing(false);
    setName("");
  };
  return (
    <section className="product-page">
      <div className="toolbar">
        <div>
          <span className="eyebrow">ENGINEERING WORKSPACE</span>
          <p>Inspect changes, capture verification, and prepare a release.</p>
        </div>
        <Button onClick={() => setEditing(true)}>+ Change proposal</Button>
      </div>
      <div className="product-split">
        <aside className="product-list">
          {changes.map((c) => (
            <button
              key={c.id}
              className={c.id === change?.id ? "active" : ""}
              onClick={() => setSelected(c.id)}
            >
              <strong>{c.name}</strong>
              <small>
                {c.status} · {c.branch || "No branch"}
              </small>
            </button>
          ))}
        </aside>
        {change ? (
          <article className="product-detail">
            <div className="product-editor-title">
              <input
                aria-label="Change title"
                value={change.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <Button onClick={() => download("change-proposal.json", change)}>
                Export proposal
              </Button>
            </div>
            <div className="product-form-grid">
              <Field
                label="Repository URL"
                value={change.repository}
                onChange={(repository) => patch({ repository })}
              />
              <Field
                label="Branch"
                value={change.branch}
                onChange={(branch) => patch({ branch })}
              />
            </div>
            <Tabs
              values={["Files", "Repository", "Checks", "Review", "Release"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Files" ? (
              <FileDiff
                key={"files-" + change.id}
                change={change}
                patch={patch}
              />
            ) : tab === "Repository" ? (
              <RepositoryInspector
                repository={change.repository}
                refName={change.branch}
              />
            ) : tab === "Checks" ? (
              <CheckResults change={change} patch={patch} />
            ) : tab === "Review" ? (
              <>
                <Field
                  label="Review status"
                  options={[
                    "Draft",
                    "In review",
                    "Changes requested",
                    "Approved",
                  ]}
                  value={change.status}
                  onChange={(status) => patch({ status })}
                />
                <Field
                  label="Reviewer notes"
                  type="textarea"
                  value={change.review || ""}
                  onChange={(review) => patch({ review })}
                />
                <p className="notice">
                  Review status is local. No pull request has been created or
                  merged.
                </p>
              </>
            ) : (
              <>
                <Field
                  label="Release notes"
                  type="textarea"
                  value={change.release}
                  onChange={(release) => patch({ release })}
                />
                <Field
                  label="Rollback plan"
                  type="textarea"
                  value={change.rollback}
                  onChange={(rollback) => patch({ rollback })}
                />
                <div className="wb-actions">
                  <Button disabled>Create pull request</Button>
                  <Button disabled>Deploy release</Button>
                </div>
                <p className="muted">
                  Repository authorization and deployment capabilities require
                  the backend.
                </p>
              </>
            )}
            <ReviewPanel
              key={change.id}
              data={data}
              update={update}
              domain="Engineering"
              entityId={change.id}
              content={change}
              errors={releaseErrors(change)}
            />
          </article>
        ) : (
          <Empty title="From an idea to a reviewed change.">
            Create a proposal, add file changes, and attach verification
            evidence.
          </Empty>
        )}
      </div>
      {editing && (
        <Dialog title="New change proposal" close={() => setEditing(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <Field
              label="Change title"
              required
              value={name}
              onChange={setName}
            />
            <button className="button dark">Create proposal</button>
          </form>
        </Dialog>
      )}
    </section>
  );
}
type ChangeProps = {
  change: ChangeRecord;
  patch: (fields: Partial<ChangeRecord>) => void;
};
function FileDiff({ change, patch }: ChangeProps) {
  const [selected, setSelected] = useState(""),
    [mode, setMode] = useState("Compare");
  const file = change.files.find((f) => f.id === selected) || change.files[0];
  const edit = (value: Partial<ChangeRecord["files"][number]>) =>
    patch({
      files: change.files.map((f) =>
        f.id === file?.id ? { ...f, ...value } : f,
      ),
    });
  if (!file)
    return (
      <Empty title="No supplied files">
        Add a file by creating a new change proposal.
      </Empty>
    );
  return (
    <>
      <div className="document-tools">
        {change.files.map((f) => (
          <Button key={f.id} onClick={() => setSelected(f.id)}>
            {f.path}
          </Button>
        ))}
        <Button
          onClick={() => {
            const f = {
              id: uid(),
              path: "new-file.txt",
              before: "",
              after: "",
            };
            patch({ files: [...change.files, f] });
            setSelected(f.id);
          }}
        >
          + File
        </Button>
      </div>
      <Field
        label="File path"
        value={file.path}
        onChange={(path) => edit({ path })}
      />
      <Tabs values={["Compare", "Edit"]} value={mode} onChange={setMode} />
      {mode === "Edit" ? (
        <div className="product-form-grid">
          <Field
            label="Original content"
            type="textarea"
            rows={18}
            value={file.before}
            onChange={(before) => edit({ before })}
          />
          <Field
            label="Proposed content"
            type="textarea"
            rows={18}
            value={file.after}
            onChange={(after) => edit({ after })}
          />
        </div>
      ) : (
        <div className="diff-columns">
          <section>
            <h4>Original</h4>
            {file.before.split("\n").map((line, i) => (
              <pre
                className={line !== file.after.split("\n")[i] ? "removed" : ""}
                key={i}
              >
                <span>{i + 1}</span>
                {line || " "}
              </pre>
            ))}
          </section>
          <section>
            <h4>Proposed</h4>
            {file.after.split("\n").map((line, i) => (
              <pre
                className={line !== file.before.split("\n")[i] ? "added" : ""}
                key={i}
              >
                <span>{i + 1}</span>
                {line || " "}
              </pre>
            ))}
          </section>
        </div>
      )}
      <p className="muted">
        Line-by-line comparison of supplied content. Repository files are not
        fetched or modified.
      </p>
    </>
  );
}
function CheckResults({ change, patch }: ChangeProps) {
  const [name, setName] = useState("");
  return (
    <>
      <form
        className="wb-inline"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          patch({
            checks: [
              ...change.checks,
              { id: uid(), name: name.trim(), status: "Not run", evidence: "" },
            ],
          });
          setName("");
        }}
      >
        <input
          aria-label="Check name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Unit tests, accessibility, build…"
        />
        <button className="button">Add check</button>
      </form>
      {change.checks.map((c) => (
        <article className="panel" key={c.id}>
          <h3>{c.name}</h3>
          <div className="product-form-grid">
            <Field
              label="Reported result"
              options={["Not run", "Passed", "Failed", "Skipped"]}
              value={c.status}
              onChange={(status) =>
                patch({
                  checks: change.checks.map((x) =>
                    x.id === c.id ? { ...x, status } : x,
                  ),
                })
              }
            />
            <Field
              label="Evidence or CI reference"
              value={c.evidence}
              onChange={(evidence) =>
                patch({
                  checks: change.checks.map((x) =>
                    x.id === c.id ? { ...x, evidence } : x,
                  ),
                })
              }
            />
          </div>
        </article>
      ))}
      <p className="muted">
        Results are entered manually. This frontend does not execute commands.
      </p>
    </>
  );
}
