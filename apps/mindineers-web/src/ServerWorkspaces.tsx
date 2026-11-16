import { useEffect, useRef, useState } from "react";
import type { Workspace } from "./shared/contracts/workspace";
import { parseWorkspace } from "./shared/services/workspace-repository";

export const serverEnabled = import.meta.env?.VITE_MINDINEERS_SERVER === "true";
const directory = "/api/mindineers/workspaces";
async function request(
  path: string,
  signal: AbortSignal,
  method = "GET",
  body?: unknown,
) {
  if (!window.isSecureContext) throw Error("Use HTTPS or localhost to connect to the server.");
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("eliza_csrf="))
    ?.slice(11);
  if (method !== "GET" && csrf) headers.set("X-Eliza-CSRF", csrf);
  const response = await fetch(path, {
    method,
    headers,
    signal,
    credentials: "same-origin",
    redirect: "error",
    cache: "no-store",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const errors: Record<number, string> = {
      401: "Sign in with a configured server account.",
      403: "Session verification failed. Sign in again.",
      409: "The server copy changed. Refresh and review it before saving.",
      413: "This workspace exceeds the 1 MiB server limit.",
      429: "Too many requests. Try again shortly.",
    };
    throw Error(
      errors[response.status] ??
        "The workspace service could not complete the request.",
    );
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error("The workspace API is unavailable on this host.");
  return response.json();
}

function useAction() {
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => () => active.current?.abort(), []);
  async function run(action: (signal: AbortSignal) => Promise<string>) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage("");
    try {
      const result = await action(controller.signal);
      if (!controller.signal.aborted) setMessage(result);
    } catch (error) {
      if (!controller.signal.aborted)
        setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return { busy, message, run };
}

export function ServerLogin() {
  const { busy, message, run } = useAction();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget,
          fields = new FormData(form);
        form.reset();
        void run(async (signal) => {
          await request("/api/auth/login/password", signal, "POST", {
            displayName: fields.get("name"),
            password: fields.get("password"),
          });
          if (!signal.aborted) location.hash = "home";
          return "Signed in.";
        });
      }}
    >
      <label>
        Server account name
        <input name="name" autoComplete="username" maxLength={64} required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="exp-button primary" disabled={busy}>
        Sign in to server
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

export function ServerWorkspaces({
  workspace,
  restore,
}: {
  workspace: Workspace;
  restore: (data: Workspace) => void;
}) {
  const { busy, message, run } = useAction();
  const [items, setItems] = useState<
    { id: string; name: string; revision: number }[] | null
  >(null);
  const [selected, setSelected] = useState("");
  return (
    <section className="server-workspaces" aria-label="Server copies">
      <h3>Private server copies</h3>
      <p>
        Save this workspace’s records to your account. Attachments stay on this
        device. Opening a copy creates a separate local workspace.
      </p>
      <button
        className="exp-button"
        disabled={busy}
        onClick={() =>
          void run(async (signal) => {
            setItems(null);
            setSelected("");
            const result = await request(directory, signal);
            if (
              !Array.isArray(result.items) ||
              !result.items.every(
                (i: { id?: unknown; name?: unknown; revision?: unknown }) =>
                  i &&
                  typeof i.id === "string" &&
                  /^[\w-]{1,120}$/.test(i.id) &&
                  typeof i.name === "string" &&
                  Number.isSafeInteger(i.revision),
              )
            )
              throw Error("Invalid workspace directory.");
            if (!signal.aborted) setItems(result.items);
            return result.items.length
              ? "Directory refreshed."
              : "You have no server copies yet.";
          })
        }
      >
        Load server copies
      </button>
      {items && (
        <>
          <label>
            Server workspace
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={busy}
            >
              <option value="">New copy</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · revision {i.revision}
                </option>
              ))}
            </select>
          </label>
          <button
            className="exp-button"
            disabled={busy}
            onClick={() =>
              void run(async (signal) => {
                const item = items.find((i) => i.id === selected),
                  id = item?.id ?? crypto.randomUUID();
                const body = item
                  ? { revision: item.revision, contents: workspace }
                  : { name: workspace.settings.workspace, contents: workspace };
                if (new Blob([JSON.stringify(body)]).size > 1048576)
                  throw Error("This workspace exceeds the 1 MiB server limit.");
                const result = await request(
                  directory + "/" + id + (item ? "/contents" : ""),
                  signal,
                  "PUT",
                  body,
                );
                if (
                  result.id !== id ||
                  typeof result.name !== "string" ||
                  !Number.isSafeInteger(result.revision)
                )
                  throw Error(
                    "Unable to verify the save. Refresh the directory.",
                  );
                if (!signal.aborted) {
                  setItems([...items.filter((i) => i.id !== id), result]);
                  setSelected(id);
                }
                return "Server copy saved.";
              })
            }
          >
            {selected ? "Update selected copy" : "Save new server copy"}
          </button>
          {selected && (
            <button
              className="exp-button"
              disabled={busy}
              onClick={() =>
                void run(async (signal) => {
                  const result = await request(
                    directory + "/" + selected + "/contents",
                    signal,
                  );
                  if (!result.contents)
                    throw Error("This workspace has no saved contents yet.");
                  const data = parseWorkspace(result.contents);
                  if (!signal.aborted) restore(data);
                  return "Opened a local copy.";
                })
              }
            >
              Open as local copy
            </button>
          )}
          <button
            className="exp-button"
            disabled={busy}
            onClick={() =>
              void run(async (signal) => {
                await request("/api/auth/logout", signal, "POST", {});
                setItems(null);
                setSelected("");
                return "Signed out of the server.";
              })
            }
          >
            Sign out of server
          </button>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
