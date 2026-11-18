import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Native <details> menus stay usable without JavaScript. With scripting they also close on
 * Escape (returning focus to the summary), on an outside click and after navigation.
 */
export function useDismissableDetails() {
  const menu = useRef<HTMLDetailsElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [location.key]);

  useEffect(() => {
    const close = (event: Event) => {
      const current = menu.current;
      if (!current?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        current.open = false;
        current.querySelector("summary")?.focus();
        return;
      }
      if (!current.contains(event.target as Node)) current.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return menu;
}
