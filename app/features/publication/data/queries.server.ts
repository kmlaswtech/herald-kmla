import { archiveEditions } from "~/features/publication/content/editions";
import { readFrontPageView } from "../model/front-page";
import { parseEach, readCollection } from "../../../shared/content.server";
import {
  mergeEditions,
  parseArticle,
  parseEdition,
  resolveMedia,
  sortArticles,
} from "../model/content";

// Set once the R2 bucket has a public address; until then uploads are served by the site.
function mediaBase() {
  const base = process.env.HERALD_MEDIA_BASE_URL?.trim();
  // An empty value in .env.local means "not configured yet".
  return base?.length ? base : undefined;
}

async function readArticles() {
  const base = mediaBase();
  const entries = await readCollection("articles", [".md"]);
  return sortArticles(
    parseEach(entries, (entry) => parseArticle(entry.stem, entry.text)),
  ).map((article) => ({
    ...article,
    image: resolveMedia(article.image, base),
  }));
}

async function readEditions() {
  const base = mediaBase();
  const entries = await readCollection("editions", [".yml", ".yaml"]);
  const published = parseEach(entries, (entry) =>
    parseEdition(entry.stem, entry.text),
  ).map((edition) => ({
    ...edition,
    cover: edition.cover && resolveMedia(edition.cover, base),
    pdf: edition.pdf && resolveMedia(edition.pdf, base),
  }));
  return mergeEditions(published, archiveEditions);
}

export async function getFrontPage(request: Request) {
  const { section, layout } = readFrontPageView(
    new URL(request.url).searchParams,
  );
  const [articles, editions] = await Promise.all([
    readArticles(),
    readEditions(),
  ]);
  return {
    section,
    layout,
    articles: section
      ? articles.filter((article) => article.category === section)
      : articles,
    latest: editions[0],
    recentEditions: editions.slice(1, 5),
  };
}

export async function getArticle(slug: string) {
  const article = (await readArticles()).find((item) => item.id === slug);
  if (!article) throw new Response("Article not found", { status: 404 });
  return { article };
}

export function getEditions() {
  return readEditions();
}

export async function getEdition(issue: string) {
  const edition = (await readEditions()).find((item) => item.id === issue);
  if (!edition) throw new Response("Edition not found", { status: 404 });
  return edition;
}
