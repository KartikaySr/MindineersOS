import { useEffect, useRef } from "react";
const focusable =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
export function useNavigationFocus(open: boolean, route: string) {
  const previousRoute = useRef(route);
  useEffect(() => {
    if (previousRoute.current !== route)
      document.getElementById("main")?.focus();
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    if (!open) return;
    const drawer = document.getElementById("workspace-navigation");
    if (!drawer) return;
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.querySelector<HTMLElement>(focusable)?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || document.querySelector("dialog[open]")) return;
      const elements = [
        ...drawer.querySelectorAll<HTMLElement>(focusable),
      ].filter((el) => el.getClientRects().length && !el.closest("[inert]"));
      const first = elements[0],
        last = elements.at(-1);
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = overflow;
      if (
        before instanceof HTMLElement &&
        before.isConnected &&
        !before.closest("[inert]")
      )
        before.focus();
    };
  }, [open]);
}
