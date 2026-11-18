import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatch,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import { Masthead } from "./features/publication/components/masthead";
import { initialTheme } from "./features/publication/data/theme.server";
import {
  SeasonThemeContext,
  useSeasonState,
} from "./features/publication/components/season-theme";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/figtree";
import "@fontsource/caveat-brush";
import "./styles/publication.css";
import "./styles/seasons.css";
import "./styles/polls.css";

export function loader({ request }: Route.LoaderArgs) {
  return data(initialTheme(request), {
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

export function headers() {
  // HTML varies with a browser preference and the current season.
  return { "Cache-Control": "private, no-store", Vary: "Cookie" };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const initial = useRouteLoaderData<typeof loader>("root");
  const theme = useSeasonState(initial ?? { preference: "auto", now: 0 });
  return (
    <SeasonThemeContext value={theme}>
      <html lang="en" data-season={theme.season}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content={theme.paper} />
          <noscript>
            <style>
              {
                ".season-control, .display-menu:not(.has-layout) { display: none; }"
              }
            </style>
          </noscript>
          <Meta />
          <Links />
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </SeasonThemeContext>
  );
}

export default function Root() {
  const readingEdition = useMatch("/editions/:issue");
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      {!readingEdition && <Masthead />}
      <Outlet />
      {!readingEdition && (
        <footer className="publication-footer">
          <Link to="/">Minjok Herald</Link>
          <p>Student-led press based in KMLA</p>
          <a href="/herald/brand/font-licenses.txt">Font licenses</a>
          <Link to="/editions">Edition archive</Link>
        </footer>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main id="content" className="page-content error-page">
      <p className="section-label">Minjok Herald</p>
      <h1>{missing ? "Page not found" : "This page could not be loaded"}</h1>
      <p>
        {missing
          ? "The story or edition may have moved."
          : "Please try again in a moment."}
      </p>
      <Link className="button primary" to="/">
        Back to the front page
      </Link>
    </main>
  );
}
