import type {
  Workspace,
  WorkspaceUpdate,
  Conversation,
} from "./shared/contracts/workspace";
import { useState, useRef, useEffect } from "react";
export default function Conversations({
  data,
  update,
}: {
  data: Workspace;
  update: WorkspaceUpdate;
}) {
  const [selected, setSelected] = useState(""),
    [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [contextOpen, setContextOpen] = useState(false),
    [notice, setNotice] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const conversations = data.conversations || [];
  const thread =
    conversations.find((t) => t.id === selected) || conversations[0];
  const mutate = (fn: (rows: Conversation[]) => Conversation[]) =>
    update((d) => ({ ...d, conversations: fn(d.conversations || []) }));
  const create = () => {
    const t = {
      id: crypto.randomUUID(),
      title: "New conversation",
      agent: data.agents[0]?.id || "",
      messages: [],
      context: [],
      createdAt: new Date().toISOString(),
    };
    mutate((all) => [t, ...all]);
    setSelected(t.id);
    setDraft("");
  };
  const patch = (fields: Partial<Conversation>) =>
    mutate((all) =>
      all.map((t) => (t.id === thread?.id ? { ...t, ...fields } : t)),
    );
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const message = {
      id: crypto.randomUUID(),
      text: draft.trim(),
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    if (thread)
      patch({
        messages: [...thread.messages, message],
        title: thread.messages.length
          ? thread.title
          : message.text.slice(0, 45),
      });
    else {
      const t = {
        id: crypto.randomUUID(),
        title: message.text.slice(0, 45),
        agent: data.agents[0]?.id || "",
        messages: [message],
        context: [],
        createdAt: new Date().toISOString(),
      };
      mutate((all) => [t, ...all]);
      setSelected(t.id);
    }
    setDraft("");
  };
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [thread?.messages.length]);
  const toMission = (m: Conversation["messages"][number]) => {
    const item = {
      id: crypto.randomUUID(),
      name: (m.text.split("\n")[0] || "").slice(0, 120),
      description: m.text,
      status: "Draft",
      owner: "You",
      sourceConversation: thread?.id || "",
    };
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        missions: [item, ...(d.records.missions || [])],
      },
    }));
    setNotice("Mission created from this message.");
  };
  return (
    <div className="conversation-app">
      <aside className="conversation-threads">
        <button className="button dark" onClick={create}>
          + New conversation
        </button>
        <input
          aria-label="Search conversations"
          placeholder="Search conversations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {conversations
          .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
          .map((t) => (
            <button
              className={t.id === thread?.id ? "active" : ""}
              key={t.id}
              onClick={() => {
                setSelected(t.id);
                setDraft("");
                setNotice("");
              }}
            >
              <strong>{t.title}</strong>
              <small>{t.messages.length} saved messages</small>
            </button>
          ))}
        {!conversations.length && <p>Your conversations will appear here.</p>}
        {!!data.messages.length && (
          <button
            className="button"
            onClick={() => {
              const t = {
                id: crypto.randomUUID(),
                title: "Earlier drafts",
                agent: "",
                messages: data.messages
                  .filter((m) => m.role === "user")
                  .map((m) => ({
                    ...m,
                    pinned: false,
                    createdAt: new Date().toISOString(),
                  })),
                context: [],
                createdAt: new Date().toISOString(),
              };
              update((d) => ({
                ...d,
                messages: [],
                conversations: [t, ...(d.conversations || [])],
              }));
              setSelected(t.id);
            }}
          >
            Import earlier drafts
          </button>
        )}
      </aside>
      <section className="conversation-main">
        <header>
          <div>
            <span className="eyebrow">YOUR THINKING SPACE</span>
            <h2>{thread?.title || "Where should we begin?"}</h2>
          </div>
          <button className="button" onClick={() => setContextOpen((v) => !v)}>
            Context {thread?.context.length || 0}
          </button>
        </header>
        {contextOpen && (
          <div className="conversation-context">
            <h3>Included project context</h3>
            <p>
              Choose what the backend may use when this conversation is
              connected.
            </p>
            {!thread ? (
              <p>Start a conversation to choose context.</p>
            ) : (
              data.projects.map((p) => (
                <label key={p.id}>
                  <input
                    type="checkbox"
                    checked={thread.context.includes(p.id)}
                    onChange={(e) =>
                      patch({
                        context: e.target.checked
                          ? [...thread.context, p.id]
                          : thread.context.filter((x) => x !== p.id),
                      })
                    }
                  />
                  {p.name}
                </label>
              ))
            )}
            {!data.projects.length && <a href="#projects">Create a project</a>}
          </div>
        )}
        <div className="conversation-messages">
          {!thread?.messages.length ? (
            <div className="chat-empty">
              <span className="chat-mark">✳</span>
              <h1>
                A little clarity.
                <br />A lot of possibility.
              </h1>
              <p>
                Save your ideas now. Bring your agents into the conversation
                when your backend is connected.
              </p>
              <div className="prompt-grid">
                {[
                  "Plan my next product launch",
                  "Research a customer problem",
                  "Organize this week’s priorities",
                  "Explore a new idea",
                ].map((s) => (
                  <button key={s} onClick={() => setDraft(s)}>
                    {s}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread.messages.map((m) => (
              <article className="conversation-message" key={m.id}>
                <div className="conversation-avatar">
                  {data.settings.name[0]}
                </div>
                <div>
                  <strong>
                    {data.settings.name}
                    <small>
                      Saved draft ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </strong>
                  <p>{m.text}</p>
                  <div className="conversation-message-actions">
                    <button
                      onClick={() =>
                        patch({
                          messages: thread.messages.map((x) =>
                            x.id === m.id ? { ...x, pinned: !x.pinned } : x,
                          ),
                        })
                      }
                    >
                      {m.pinned ? "Unpin decision" : "Pin decision"}
                    </button>
                    <button onClick={() => toMission(m)}>Create mission</button>
                  </div>
                </div>
              </article>
            ))
          )}
          <div ref={end} />
        </div>
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <form className="composer" onSubmit={send}>
          <textarea
            aria-label="Conversation draft"
            placeholder="Bring the messy thought…"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="composer-bottom">
            <select
              aria-label="Preferred agent"
              disabled={!thread}
              value={thread?.agent || ""}
              onChange={(e) => patch({ agent: e.target.value })}
            >
              <option value="">Choose an agent</option>
              {data.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button className="button dark" disabled={!draft.trim()}>
              Save draft ↑
            </button>
          </div>
        </form>
        <p className="chat-disclaimer">
          Saved on this device · ⌘/Ctrl + Enter to save · Agent responses
          require a connected backend
        </p>
      </section>
    </div>
  );
}
