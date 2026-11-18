import { Link } from "react-router";
import type { HeraldArticle } from "~/features/publication/model/types";

export function ArticleReader({ article }: { article: HeraldArticle }) {
  return (
    <main id="content" className="page-content article-page">
      <Link className="text-link" to="/">
        ← Back to stories
      </Link>
      <article>
        <header className="article-heading">
          <p className="section-label">{article.category}</p>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.deck}</p>
          <p className="byline">Minjok Herald · {article.date}</p>
        </header>
        <figure>
          <img
            className="article-photo"
            src={article.image}
            width="1200"
            height="800"
            alt={article.credit}
          />
          {article.credit && <figcaption>{article.credit}</figcaption>}
        </figure>
        <div className="article-body">
          {article.body.split(/\r?\n\s*\r?\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
