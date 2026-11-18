import { Link } from "react-router";
import type { HeraldEdition } from "~/features/publication/model/types";

export function EditionShelf({
  latest,
  recent,
}: {
  latest: HeraldEdition;
  recent: HeraldEdition[];
}) {
  return (
    <section
      className="edition-shelf wash-lilac"
      aria-labelledby="editions-heading"
    >
      <div className="section-heading">
        <h2 id="editions-heading">The latest edition</h2>
        <span aria-hidden="true">↗</span>
      </div>
      <Link to={`/editions/${latest.id}`} className="featured-edition">
        <img
          src={latest.cover}
          width="400"
          height="560"
          alt={`${latest.issue} edition: ${latest.title}`}
          loading="lazy"
        />
      </Link>
      <h3>{latest.issue} edition</h3>
      <p className="edition-title">{latest.title}</p>
      <p className="small-note">
        {latest.season}
        {latest.pages ? ` · ${latest.pages} pages` : ""}
      </p>
      <Link className="button primary" to={`/editions/${latest.id}`}>
        Read this edition <span aria-hidden="true">↗</span>
      </Link>
      <h3 className="past-editions-heading">Past editions</h3>
      <ul className="past-editions">
        {recent.map((edition) => (
          <li key={edition.id}>
            <Link to={`/editions/${edition.id}`}>
              <img
                src={edition.cover}
                width="48"
                height="66"
                alt=""
                loading="lazy"
              />
              <span>
                <strong>{edition.issue} edition</strong>
                <span>{edition.title}</span>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link className="button" to="/editions">
        View all editions <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
