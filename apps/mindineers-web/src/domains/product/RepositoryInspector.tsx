import { useState } from "react";
import { Button, Field, Empty } from "../../shared/ui/controls";
import { useResource } from "../../shared/services/useResource";
import { ErrorState, LoadingState } from "../../shared/ui/AsyncState";
import { ServiceError } from "../../shared/services/errors";
import { object } from "./model";
import { validateDataTree } from "../../shared/services/input-safety";
export interface RepositorySnapshot {
  repository: string;
  ref: string;
  revision: string;
  files: { path: string; content: string }[];
  checks: {
    name: string;
    status: "Pending" | "Passed" | "Failed";
    evidence: string;
  }[];
}
export interface RepositoryService {
  available: boolean;
  read(repository: string, ref: string, signal: AbortSignal): Promise<unknown>;
}
export const disconnectedRepository: RepositoryService = {
  available: false,
  async read() {
    throw new ServiceError("unavailable");
  },
};
export function checkedRepository(
  value: unknown,
  repository: string,
  ref: string,
): RepositorySnapshot {
  validateDataTree(value);
  if (
    !object(value) ||
    value.repository !== repository ||
    value.ref !== ref ||
    typeof value.revision !== "string" ||
    !value.revision ||
    !Array.isArray(value.files) ||
    value.files.length > 500 ||
    !Array.isArray(value.checks) ||
    value.checks.length > 100
  )
    throw new ServiceError("validation");
  const files = value.files.map((f: unknown) => {
    if (
      !object(f) ||
      typeof f.path !== "string" ||
      !f.path ||
      f.path.startsWith("/") ||
      f.path.includes("\\") ||
      f.path.split("/").some((p) => p === ".." || p === "." || !p) ||
      typeof f.content !== "string" ||
      f.content.length > 100000
    )
      throw new ServiceError("validation");
    return { path: f.path, content: f.content };
  });
  if (
    new Set(files.map((f) => f.path)).size !== files.length ||
    files.reduce((n, f) => n + f.content.length, 0) > 1000000
  )
    throw new ServiceError("validation");
  const checks = value.checks.map(
    (c: unknown): RepositorySnapshot["checks"][number] => {
      if (
        !object(c) ||
        typeof c.name !== "string" ||
        typeof c.evidence !== "string" ||
        (c.status !== "Pending" &&
          c.status !== "Passed" &&
          c.status !== "Failed")
      )
        throw new ServiceError("validation");
      return { name: c.name, status: c.status, evidence: c.evidence };
    },
  );
  return { repository, ref, revision: value.revision, files, checks };
}
function ConnectedRepository({
  repository,
  refName,
  service,
}: {
  repository: string;
  refName: string;
  service: RepositoryService;
}) {
  const { state, retry } = useResource(
    repository + "\0" + refName,
    async (signal) =>
      checkedRepository(
        await service.read(repository, refName, signal),
        repository,
        refName,
      ),
  );
  const [query, setQuery] = useState(""),
    [path, setPath] = useState("");
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error")
    return <ErrorState error={state.error} retry={retry} />;
  const snapshot = state.data,
    file = snapshot.files.find((f) => f.path === path);
  return (
    <>
      <p>
        Revision {snapshot.revision} · {snapshot.files.length} supplied files
      </p>
      <Button onClick={retry}>Refresh repository snapshot</Button>
      <Field label="Filter file paths" value={query} onChange={setQuery} />
      <div className="product-split">
        <aside className="product-list">
          {snapshot.files
            .filter((f) => f.path.toLowerCase().includes(query.toLowerCase()))
            .map((f) => (
              <button key={f.path} onClick={() => setPath(f.path)}>
                {f.path}
              </button>
            ))}
        </aside>
        {file ? (
          <pre className="product-code">{file.content}</pre>
        ) : (
          <Empty title="Select a file">
            Repository text is displayed as inert content.
          </Empty>
        )}
      </div>
      <h4>Provider checks</h4>
      {snapshot.checks.map((c, i) => (
        <article key={i} className="panel">
          <strong>
            {c.name} · {c.status}
          </strong>
          <p>{c.evidence}</p>
        </article>
      ))}
    </>
  );
}
export default function RepositoryInspector({
  repository,
  refName,
  service = disconnectedRepository,
}: {
  repository: string;
  refName: string;
  service?: RepositoryService;
}) {
  return (
    <section>
      <h3>Repository and CI inspection</h3>
      {service.available ? (
        <ConnectedRepository
          key={repository + "\0" + refName}
          repository={repository}
          refName={refName}
          service={service}
        />
      ) : (
        <Empty title="Repository service not connected">
          Connect an authorized backend adapter to inspect repository files and
          CI results. Supplied proposal files remain available in Files.
        </Empty>
      )}
      <h4>Terminal capability</h4>
      <p>
        Command execution is unavailable. A future runtime must provide an
        isolated working directory, approved command scope, timeout, network
        policy, output limits and cancellation. No credentials or executable
        shell input are collected here.
      </p>
    </section>
  );
}
