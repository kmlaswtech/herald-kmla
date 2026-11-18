import { Link } from "react-router";
import type {
  HeraldArticle,
  HeraldCategory,
  HeraldEdition,
} from "~/features/publication/model/types";
import { EditionShelf } from "./edition-shelf";
import { StoryCard } from "./story-card";

export function FrontPage({
  articles,
  latest,
  recentEditions,
  section,
  layout,
  polls,
}: {
  articles: HeraldArticle[];
  latest: HeraldEdition;
  recentEditions: HeraldEdition[];
  section: HeraldCategory | null;
  layout: "classic" | "magazine";
  /** The polls feature's sidebar panel, composed by the route. */
  polls: React.ReactNode;
}) {
  return (
    <main id="content" className="page-content">
      <div className="news-columns">
        <div className="stories-column">
          <div className="section-heading front-heading">
            <h1>{section ?? "Front page"}</h1>
            <span className="season-sprig" aria-hidden="true" />
          </div>
          {articles.length ? (
            <>
              <div className={`front-stories ${layout}`}>
                {articles.slice(0, 3).map((article, index) => (
                  <StoryCard
                    article={article}
                    lead={index === 0}
                    key={article.id}
                  />
                ))}
              </div>
              {articles.length > 3 && (
                <section className="more-stories">
                  <div className="section-heading">
                    <h2>Around the school</h2>
                  </div>
                  <div className="story-grid">
                    {articles.slice(3).map((article) => (
                      <StoryCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="empty-state">
              {section ? (
                <>
                  <h2>No stories in this section yet.</h2>
                  <Link className="button" to="/">
                    Back to all stories
                  </Link>
                </>
              ) : (
                <h2>No stories have been published yet.</h2>
              )}
            </div>
          )}
        </div>
        <aside className="publication-sidebar" aria-label="Editions and polls">
          <EditionShelf latest={latest} recent={recentEditions} />
          {polls}
        </aside>
      </div>
    </main>
  );
}
