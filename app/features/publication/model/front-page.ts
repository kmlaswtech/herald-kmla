import { heraldCategories } from "~/features/publication/model/types";

export type FrontPageLayout = "classic" | "magazine";

/** The front page's view, read from its `?section=` and `?layout=` links. */
export function readFrontPageView(params: URLSearchParams) {
  const section =
    heraldCategories.find((item) => item === params.get("section")) ?? null;
  const layout: FrontPageLayout =
    params.get("layout") === "magazine" ? "magazine" : "classic";
  return { section, layout };
}

/** The same view as a query string, dropping anything the front page does not use. */
export function frontPageSearch(search: string) {
  const { section, layout } = readFrontPageView(new URLSearchParams(search));
  const params = new URLSearchParams();
  if (section) params.set("section", section);
  if (layout === "magazine") params.set("layout", layout);
  const query = params.toString();
  return query ? `?${query}` : "";
}
