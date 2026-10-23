import React, { useState, useRef, useEffect } from "react";
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export default function CalendarWorkspace({ data, update }) {
  const [month, setMonth] = useState(new Date()),
    [view, setView] = useState("Month"),
    [editing, setEditing] = useState(null);
  const events = data.records.calendar || [],
    today = dateKey(new Date()),
    start = new Date(month.getFullYear(), month.getMonth(), 1),
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const create = (date) =>
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      status: "Planned",
      owner: "You",
      date,
      time: "09:00",
      endTime: "10:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: "",
      recurrence: "Does not repeat",
      notes: "",
      decisions: "",
      followUp: "",
    });
  const save = (event) => {
    update((d) => ({
      ...d,
      records: {
        ...d.records,
        calendar: events.some((e) => e.id === event.id)
          ? events.map((e) => (e.id === event.id ? event : e))
          : [...events, event],
      },
    }));
    setEditing(null);
  };
  const eventButton = (e) => (
    <button
      key={e.id}
      className={
        "calendar-event " + (e.status === "Cancelled" ? "cancelled" : "")
      }
      onClick={() => setEditing(e)}
    >
      <strong>
        {e.time || "All day"} · {e.name}
      </strong>
      <small>{e.location || e.owner}</small>
    </button>
  );
  const visible = events
    .filter((e) => e.date?.startsWith(dateKey(start).slice(0, 7)))
    .sort((a, b) =>
      (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")),
    );
  return (
    <section className="calendar-workspace">
      <div className="calendar-control">
        <div>
          <span className="eyebrow">TIME FOR WHAT MATTERS</span>
          <h2>
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </h2>
        </div>
        <div className="wb-actions">
          <button
            className="button"
            aria-label="Previous month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            ←
          </button>
          <button className="button" onClick={() => setMonth(new Date())}>
            Today
          </button>
          <button
            className="button"
            aria-label="Next month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            →
          </button>
          <button className="button dark" onClick={() => create(today)}>
            + New event
          </button>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs">
          {["Month", "Agenda"].map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="badge">
          {Intl.DateTimeFormat().resolvedOptions().timeZone} · on-device
          calendar
        </span>
      </div>
      {view === "Month" ? (
        <div className="product-calendar">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div className="product-weekday" key={d}>
              {d}
            </div>
          ))}
          {Array.from({ length: start.getDay() }, (_, i) => (
            <div className="product-day blank" key={"blank" + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = dateKey(
              new Date(month.getFullYear(), month.getMonth(), i + 1),
            );
            return (
              <div
                key={date}
                className={"product-day " + (date === today ? "today" : "")}
              >
                <button
                  className="product-date"
                  aria-label={"Add event on " + date}
                  onClick={() => create(date)}
                >
                  {i + 1}
                  <span>+</span>
                </button>
                {events
                  .filter((e) => e.date === date)
                  .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                  .map(eventButton)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="calendar-agenda">
          {visible.map((e) => (
            <article key={e.id}>
              <time>
                {new Date(e.date + "T12:00:00").toLocaleDateString("en", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </time>
              {eventButton(e)}
              <span className="badge">{e.status}</span>
            </article>
          ))}
          {!visible.length && (
            <div className="empty">
              <h2>A little breathing room.</h2>
              <p>
                No events this month. Plan a focus session or your next meeting.
              </p>
            </div>
          )}
        </div>
      )}
      <p className="muted">
        External calendars are not connected. Recurrence is stored as an event
        preference; occurrences are not automatically scheduled.
      </p>
      {editing && (
        <EventEditor
          event={editing}
          events={events}
          save={save}
          close={() => setEditing(null)}
          data={data}
          update={update}
        />
      )}
    </section>
  );
}
function EventEditor({ event, events, save, close, data, update }) {
  const ref = useRef(),
    [draft, setDraft] = useState(event),
    [tab, setTab] = useState("Event"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus();
  }, []);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const conflict = events.some(
    (e) =>
      e.id !== draft.id &&
      e.date === draft.date &&
      e.status !== "Cancelled" &&
      e.time &&
      e.endTime &&
      e.time < draft.endTime &&
      draft.time < e.endTime &&
      (!e.timezone || e.timezone === draft.timezone),
  );
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label="Event details"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <h2>{event.name || "Make time for it."}</h2>
        <button
          className="icon-button"
          aria-label="Close event"
          onClick={close}
        >
          ×
        </button>
      </div>
      <div className="tabs">
        {["Event", "Meeting notes"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) {
            setError("Add an event name.");
            return;
          }
          if (draft.time && draft.endTime && draft.endTime <= draft.time) {
            setError(
              "End time must be later than start time on the same date.",
            );
            return;
          }
          save({ ...draft, name: draft.name.trim() });
        }}
      >
        {tab === "Event" ? (
          <>
            <label>
              Event name
              <input
                required
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <div className="form-two">
              <label>
                Date
                <input
                  type="date"
                  required
                  value={draft.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </label>
              <label>
                Timezone
                <input
                  required
                  value={
                    draft.timezone ||
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  }
                  onChange={(e) => set("timezone", e.target.value)}
                />
              </label>
              <label>
                Start time
                <input
                  type="time"
                  value={draft.time || ""}
                  onChange={(e) => set("time", e.target.value)}
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  value={draft.endTime || ""}
                  onChange={(e) => set("endTime", e.target.value)}
                />
              </label>
            </div>
            {conflict && (
              <p className="notice">
                This event overlaps another event in the same timezone.
              </p>
            )}
            <label>
              Location
              <input
                value={draft.location || ""}
                onChange={(e) => set("location", e.target.value)}
              />
            </label>
            <label>
              Agenda
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <div className="form-two">
              <label>
                Recurrence
                <select
                  value={draft.recurrence || "Does not repeat"}
                  onChange={(e) => set("recurrence", e.target.value)}
                >
                  {["Does not repeat", "Daily", "Weekly", "Monthly"].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {["Planned", "Done", "Cancelled"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        ) : (
          <>
            {[
              ["notes", "Meeting notes"],
              ["decisions", "Decisions"],
              ["followUp", "Follow-up actions"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  rows={4}
                  value={draft[key] || ""}
                  onChange={(e) => set(key, e.target.value)}
                />
              </label>
            ))}
            <button
              className="button"
              type="button"
              disabled={!draft.followUp?.trim()}
              onClick={() => {
                const mission = {
                  id: crypto.randomUUID(),
                  name: "Follow up: " + (draft.name || "Meeting"),
                  description: draft.followUp,
                  status: "Draft",
                  owner: "You",
                  sourceEvent: draft.id,
                };
                update((d) => ({
                  ...d,
                  records: {
                    ...d.records,
                    missions: [mission, ...d.records.missions],
                  },
                }));
                setNotice(
                  "Follow-up mission created. Save your meeting notes before closing.",
                );
              }}
            >
              Create follow-up mission
            </button>
            {notice && <p role="status">{notice}</p>}
          </>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={close}>
            Cancel
          </button>
          <button className="button dark">Save event</button>
        </div>
      </form>
    </dialog>
  );
}
