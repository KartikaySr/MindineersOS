import { useEffect, useState } from "react";
import { readRoute } from "./routes";
export function useRoute(): string {
  const [route, setRoute] = useState(() => readRoute(window.location.hash).id);
  useEffect(() => {
    const update = () => {
      if (window.location.hash === "#main") {
        document.getElementById("main")?.focus();
        return;
      }
      setRoute(readRoute(window.location.hash).id);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
