import { Link } from "react-router";
import type { HeraldEdition } from "~/features/publication/model/types";

export function EditionArchive({ editions }: { editions: HeraldEdition[] }) {
  return (
    <main id="content" className="page-content">
      <div className="archive-heading">
        <p className="section-label">Through the years</p>
        <h1>Edition archive</h1>
        <p>{editions.length} original editions, preserved as published.</p>
      </div>
      <div className="archive-grid">
        {editions.map((edition) => (
          <article className="archive-card" key={edition.id}>
            <Link
              to={`/editions/${edition.id}`}
              aria-label={`${edition.issue} edition ${edition.title}`}
            >
              <div className="archive-cover">
                <img
                  src={edition.cover}
                  width="400"
                  height="560"
                  alt=""
                  loading="lazy"
                />
              </div>
              <h2>{edition.issue} edition</h2>
              <p className="edition-title">{edition.title}</p>
            </Link>
            <p className="small-note">
              {edition.season}
              {edition.pages ? ` · ${edition.pages} pages` : ""}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
