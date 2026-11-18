import {
  heraldCategories,
  type HeraldArticle,
  type HeraldCategory,
  type HeraldEdition,
} from "~/features/publication/model/types";
import {
  checkStem,
  flag,
  optionalText,
  parseYamlFields,
  requiredDate,
  requiredText,
  splitFrontmatter,
} from "../../../shared/fields";

export interface PublishedArticle extends HeraldArticle {
  /** `yyyy-MM-dd`, for ordering. */
  publishedOn: string;
}

const displayDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** A story file (`articles/<id>.md`); `null` while it is marked as a draft. */
export function parseArticle(
  stem: string,
  text: string,
): PublishedArticle | null {
  const id = checkStem(stem);
  const { fields, body } = splitFrontmatter(text);
  if (flag(fields, "draft")) return null;
  const category = requiredText(fields, "category");
  if (!heraldCategories.includes(category as HeraldCategory)) {
    throw new Error(`category must be one of ${heraldCategories.join(", ")}`);
  }
  const publishedOn = requiredDate(fields, "date");
  return {
    id,
    title: requiredText(fields, "title"),
    category: category as HeraldCategory,
    deck: requiredText(fields, "deck"),
    body: body.trim(),
    image: requiredText(fields, "image"),
    credit: optionalText(fields, "credit") ?? "",
    date: displayDate.format(new Date(`${publishedOn}T00:00:00Z`)),
    publishedOn,
  };
}

export function sortArticles(articles: PublishedArticle[]) {
  return [...articles].sort(
    (a, b) =>
      b.publishedOn.localeCompare(a.publishedOn) ||
      a.title.localeCompare(b.title),
  );
}

function ordinal(number: number) {
  const tens = number % 100;
  const suffix =
    tens >= 11 && tens <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[
          number % 10
        ] ?? "th");
  return `${number}${suffix}`;
}

/**
 * A new semester edition (`editions/*.yml`). Its number, not the file name, sets the id, so
 * it lines up with the repository archive's `edition-NN` URLs.
 */
export function parseEdition(_stem: string, text: string): HeraldEdition {
  const fields = parseYamlFields(text);
  const number = fields.number;
  if (typeof number !== "number" || !Number.isInteger(number) || number < 1) {
    throw new Error("number must be a whole edition number");
  }
  const pages = fields.pages;
  if (
    pages !== undefined &&
    (typeof pages !== "number" || !Number.isInteger(pages) || pages < 1)
  ) {
    throw new Error("pages must be a whole number");
  }
  return {
    id: `edition-${number}`,
    title: requiredText(fields, "title"),
    issue: ordinal(number),
    season: requiredText(fields, "season"),
    cover: optionalText(fields, "cover"),
    pdf: requiredText(fields, "pdf"),
    ...(pages === undefined ? {} : { pages }),
  };
}

const issueNumber = (edition: HeraldEdition) =>
  parseInt(edition.issue, 10) || 0;

/** New editions join the read-only archive by issue; an archived issue is never replaced. */
export function mergeEditions(
  published: HeraldEdition[],
  archive: HeraldEdition[],
) {
  const archived = new Set(archive.map((edition) => edition.id));
  return [
    ...archive,
    ...published.filter((edition) => !archived.has(edition.id)),
  ].sort((a, b) => issueNumber(b) - issueNumber(a));
}

/**
 * Pages CMS writes uploads as `/media/...`. Until the R2 bucket's public address is set they
 * are served from the site itself; afterwards from R2, which the content repository's sync
 * workflow keeps under the same `media/` prefix.
 */
export function resolveMedia(path: string, base: string | undefined) {
  if (!base || !path.startsWith("/media/")) return path;
  return `${base.replace(/\/+$/, "")}${path}`;
}
