import { createRoot } from "react-dom/client";
import App from "../main.jsx";
import { RouteBoundary } from "../shared/ui/AsyncState";
const container = document.getElementById("root");
if (!container) throw new Error("Missing application root.");
createRoot(container).render(
  <RouteBoundary>
    <App />
  </RouteBoundary>,
);
