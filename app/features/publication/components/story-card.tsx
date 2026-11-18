import { Link } from "react-router";
import type { HeraldArticle } from "~/features/publication/model/types";

export function StoryCard({
  article,
  lead = false,
}: {
  article: HeraldArticle;
  lead?: boolean;
}) {
  return (
    <article className={lead ? "story-card lead-story" : "story-card"}>
      <div className="story-picture">
        <img
          src={article.image}
          alt=""
          width="960"
          height="720"
          loading={lead ? "eager" : "lazy"}
        />
      </div>
      <div className="story-copy">
        <p className="section-label">{article.category}</p>
        <h2>
          <Link to={`/articles/${article.id}`} className="story-link">
            {article.title}
          </Link>
        </h2>
        <p className="story-deck">{article.deck}</p>
        <p className="byline">
          Minjok Herald <span aria-hidden="true">·</span> {article.date}
        </p>
      </div>
    </article>
  );
}
