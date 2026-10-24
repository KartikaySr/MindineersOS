import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeError } from "./errors";
import type { ServiceError } from "./errors";
export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: ServiceError };
/** Keys must include the workspace/resource identity. Cancellation and a request
 * generation guard prevent old responses from replacing a newly selected record. */
export function useResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
) {
  const [stored, setStored] = useState<{
      key: string;
      attempt: number;
      state: ResourceState<T>;
    }>({ key, attempt: 0, state: { status: "loading" } }),
    [attempt, setAttempt] = useState(0);
  const state: ResourceState<T> =
    stored.key === key && stored.attempt === attempt
      ? stored.state
      : { status: "loading" };
  const load = useRef(loader);
  load.current = loader;
  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    const selectedLoader = load.current;
    setStored({ key, attempt, state: { status: "loading" } });
    Promise.resolve()
      .then(() => selectedLoader(controller.signal))
      .then(
        (data) => {
          if (current)
            setStored({ key, attempt, state: { status: "ready", data } });
        },
        (error) => {
          if (current && !controller.signal.aborted)
            setStored({
              key,
              attempt,
              state: { status: "error", error: normalizeError(error) },
            });
        },
      );
    return () => {
      current = false;
      controller.abort();
    };
  }, [key, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
