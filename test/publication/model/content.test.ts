import { describe, expect, it } from "vitest";
import type { HeraldEdition } from "~/features/publication/model/types";
import {
  mergeEditions,
  parseArticle,
  parseEdition,
  resolveMedia,
  sortArticles,
} from "../../../app/features/publication/model/content";

const story = (fields: string, body = "First paragraph.\n\nSecond.") =>
  `---\n${fields}\n---\n${body}\n`;

const complete = [
  "title: The stories we carry",
  "category: Feature",
  "deck: A look at the little moments.",
  "date: 2026-11-04",
  "image: /media/campus.jpg",
  "credit: Minjok Herald",
].join("\n");

describe("Pages CMS stories", () => {
  it("reads a story file into an article keyed by its file name", () => {
    expect(parseArticle("stories-we-carry", story(complete))).toEqual({
      id: "stories-we-carry",
      title: "The stories we carry",
      category: "Feature",
      deck: "A look at the little moments.",
      body: "First paragraph.\n\nSecond.",
      image: "/media/campus.jpg",
      credit: "Minjok Herald",
      date: "Nov 4, 2026",
      publishedOn: "2026-11-04",
    });
  });

  it("keeps drafts off the site", () => {
    expect(parseArticle("held", story(`${complete}\ndraft: true`))).toBeNull();
  });

  it("rejects a story missing a required field or using an unknown section", () => {
    expect(() =>
      parseArticle("no-title", story(complete.replace(/^title:.*$/m, ""))),
    ).toThrow(/title/);
    expect(() =>
      parseArticle("bad-section", story(complete.replace("Feature", "Sports"))),
    ).toThrow(/category/);
    expect(() =>
      parseArticle("bad-date", story(complete.replace("2026-11-04", "soon"))),
    ).toThrow(/date/);
  });

  it("rejects a file without frontmatter or with an unusable file name", () => {
    expect(() => parseArticle("plain", "Just text")).toThrow(/frontmatter/);
    expect(() => parseArticle("../escape", story(complete))).toThrow(/name/);
  });

  it("accepts Korean file names that Pages CMS may produce from a title", () => {
    expect(parseArticle("신문-소식", story(complete))?.id).toBe("신문-소식");
  });

  it("orders stories newest first, then by title", () => {
    const make = (id: string, publishedOn: string, title: string) => ({
      ...parseArticle(id, story(complete))!,
      publishedOn,
      title,
    });
    expect(
      sortArticles([
        make("a", "2026-10-01", "Older"),
        make("b", "2026-11-01", "Zebra"),
        make("c", "2026-11-01", "Apple"),
      ]).map((article) => article.id),
    ).toEqual(["c", "b", "a"]);
  });
});

const archive: HeraldEdition[] = [
  { id: "edition-72", title: "Changes", issue: "72nd", season: "October 2025" },
  { id: "edition-71", title: "Mainstream", issue: "71st", season: "Semester" },
];

describe("Pages CMS editions", () => {
  it("derives the id and ordinal issue from the edition number", () => {
    expect(
      parseEdition(
        "whatever-name",
        [
          "number: 73",
          "title: New Leaves",
          "season: March 2026",
          "cover: /media/edition-73.jpg",
          "pdf: /media/edition-73.pdf",
          "pages: 60",
        ].join("\n"),
      ),
    ).toEqual({
      id: "edition-73",
      title: "New Leaves",
      issue: "73rd",
      season: "March 2026",
      cover: "/media/edition-73.jpg",
      pdf: "/media/edition-73.pdf",
      pages: 60,
    });
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [104, "104th"],
  ])("writes %i as %s", (number, issue) => {
    expect(
      parseEdition(
        "x",
        `number: ${number}\ntitle: T\nseason: S\npdf: /media/x.pdf\ncover: /media/x.jpg`,
      ).issue,
    ).toBe(issue);
  });

  it("requires a whole edition number and a PDF", () => {
    expect(() =>
      parseEdition("x", "number: 7.5\ntitle: T\nseason: S\npdf: /m.pdf"),
    ).toThrow(/number/);
    expect(() =>
      parseEdition("x", "number: 73\ntitle: T\nseason: S\ncover: /c.jpg"),
    ).toThrow(/pdf/);
  });

  it("merges new editions into the archive newest first; the archive keeps its own issues", () => {
    const merged = mergeEditions(
      [
        { id: "edition-73", title: "New", issue: "73rd", season: "2026" },
        { id: "edition-72", title: "Duplicate", issue: "72nd", season: "x" },
      ],
      archive,
    );
    expect(merged.map((edition) => [edition.id, edition.title])).toEqual([
      ["edition-73", "New"],
      ["edition-72", "Changes"],
      ["edition-71", "Mainstream"],
    ]);
  });
});

describe("media addresses", () => {
  it("serves uploads from the site until an R2 address is configured", () => {
    expect(resolveMedia("/media/a.jpg", undefined)).toBe("/media/a.jpg");
  });

  it("points uploads at the R2 public address once configured", () => {
    expect(resolveMedia("/media/a.jpg", "https://media.example/")).toBe(
      "https://media.example/media/a.jpg",
    );
  });

  it("leaves the static archive and outside links alone", () => {
    expect(resolveMedia("/herald/a.jpg", "https://media.example")).toBe(
      "/herald/a.jpg",
    );
    expect(resolveMedia("https://x.example/a.jpg", "https://m.example")).toBe(
      "https://x.example/a.jpg",
    );
  });
});
