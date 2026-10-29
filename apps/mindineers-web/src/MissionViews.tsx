import type { LegacyRecord } from "./shared/contracts/workspace";
export function missionWorkload(
  tasks: LegacyRecord[],
  allTasks: LegacyRecord[] = tasks,
) {
  const owners = new Map<
    string,
    {
      owner: string;
      open: number;
      blocked: number;
      review: number;
      done: number;
    }
  >();
  for (const task of tasks) {
    const owner = task.owner?.trim() || "Unassigned";
    const row = owners.get(owner) || {
      owner,
      open: 0,
      blocked: 0,
      review: 0,
      done: 0,
    };
    if (task.status === "Done") row.done++;
    else {
      row.open++;
      if (task.status === "In review") row.review++;
      if (
        (task.dependsOn || []).some(
          (id) =>
            allTasks.find((candidate) => candidate.id === id)?.status !==
            "Done",
        )
      )
        row.blocked++;
    }
    owners.set(owner, row);
  }
  return [...owners.values()].sort(
    (a, b) => b.open - a.open || a.owner.localeCompare(b.owner),
  );
}
export default function MissionViews({
  view,
  tasks,
  allTasks,
  select,
}: {
  view: "Workload" | "Dependencies";
  tasks: LegacyRecord[];
  allTasks: LegacyRecord[];
  select: (task: LegacyRecord) => void;
}) {
  if (view === "Workload")
    return (
      <section className="panel">
        <h2>Owner workload</h2>
        <p>
          Counts describe saved missions, not hours, availability or runtime
          utilization. Blocked counts include dependencies outside the active
          filters.
        </p>
        <div
          className="table-wrap"
          role="region"
          aria-label="Mission workload"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Owner</th>
                <th scope="col">Open</th>
                <th scope="col">Blocked</th>
                <th scope="col">In review</th>
                <th scope="col">Done</th>
              </tr>
            </thead>
            <tbody>
              {missionWorkload(tasks, allTasks).map((row) => (
                <tr key={row.owner}>
                  <th scope="row">{row.owner}</th>
                  <td>{row.open}</td>
                  <td>{row.blocked}</td>
                  <td>{row.review}</td>
                  <td>{row.done}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  return (
    <section className="panel">
      <h2>Mission dependencies</h2>
      <p>
        Each mission lists its prerequisites. Open either record to inspect or
        edit it; missing dependencies remain visible as blockers.
      </p>
      {tasks.map((task) => (
        <article className="wb-body" key={task.id}>
          <button className="button" onClick={() => select(task)}>
            {task.name} · {task.status}
          </button>
          {!(task.dependsOn || []).length ? (
            <p>No prerequisites</p>
          ) : (
            <ul>
              {task.dependsOn!.map((id) => {
                const dependency = allTasks.find(
                  (candidate) => candidate.id === id,
                );
                return (
                  <li key={id}>
                    {dependency ? (
                      <button
                        className="exp-button"
                        onClick={() => select(dependency)}
                      >
                        Requires {dependency.name} · {dependency.status}
                      </button>
                    ) : (
                      <span role="status">Missing prerequisite: {id}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
