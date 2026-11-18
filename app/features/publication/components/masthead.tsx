import { Link, useLocation, useSearchParams } from "react-router";
import { heraldCategories } from "~/features/publication/model/types";
import { DisplayMenu } from "./display-menu";
import { useSeasonTheme } from "./season-theme";

export function Masthead() {
  const { banner, season } = useSeasonTheme();
  const [params] = useSearchParams();
  const section = params.get("section");
  const { pathname } = useLocation();
  return (
    <header className="masthead">
      <div className="utility">
        <a className="pill" href="https://kmla.online/menu">
          ← KMLA Online
        </a>
        <div className="utility-actions">
          <DisplayMenu />
        </div>
      </div>
      <Link to="/" className="banner-link" aria-label="Minjok Herald home">
        <img
          className="banner"
          src={banner}
          width="1640"
          height="840"
          alt={`Minjok Herald — ${season} illustration`}
          fetchPriority="high"
        />
      </Link>
      <nav className="section-nav" aria-label="Story sections">
        <div>
          <Link
            to="/"
            aria-current={pathname === "/" && !section ? "page" : undefined}
          >
            All stories
          </Link>
          {heraldCategories.map((item) => (
            <Link
              key={item}
              to={`/?section=${item}`}
              aria-current={
                pathname === "/" && section === item ? "page" : undefined
              }
            >
              {item}
            </Link>
          ))}
          <Link
            to="/editions"
            className="archive-nav"
            aria-current={pathname === "/editions" ? "page" : undefined}
          >
            Edition archive ↗
          </Link>
        </div>
      </nav>
      <div className="motto">
        <p>Written/Edited by students, for students</p>
        <p>
          Student-led press based in KMLA (Korean Minjok Leadership Academy).
        </p>
      </div>
    </header>
  );
}
