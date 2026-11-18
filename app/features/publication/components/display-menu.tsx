import { Link, useLocation, useSearchParams } from "react-router";
import { useDismissableDetails } from "../../../shared/use-dismissable-details";
import { SeasonSelector } from "./season-selector";

const layouts = [
  { value: "classic", label: "Classic" },
  { value: "magazine", label: "Magazine" },
] as const;

// A native <details> keeps the menu and its layout links usable without JavaScript.
export function DisplayMenu() {
  const menu = useDismissableDetails();
  const location = useLocation();
  const [params] = useSearchParams();
  const onFrontPage = location.pathname === "/";
  const layout = params.get("layout") === "magazine" ? "magazine" : "classic";
  const section = params.get("section");

  return (
    <details
      ref={menu}
      className={onFrontPage ? "display-menu has-layout" : "display-menu"}
    >
      <summary className="pill">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Display
      </summary>
      <div className="display-panel">
        <SeasonSelector />
        {onFrontPage && (
          <div className="layout-choice" role="group" aria-label="Layout">
            <span className="display-label" aria-hidden="true">
              Layout
            </span>
            <div className="layout-switch">
              {layouts.map((choice) => (
                <Link
                  key={choice.value}
                  to={`/?${section ? `section=${encodeURIComponent(section)}&` : ""}layout=${choice.value}`}
                  aria-current={layout === choice.value ? "true" : undefined}
                >
                  {choice.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
