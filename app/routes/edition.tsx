import type { Route } from "./+types/edition";
import { getEdition } from "../features/publication/data/queries.server";
import { EditionReader } from "../features/publication/components/edition-reader";
import { publicationMetadata } from "../features/publication/model/metadata";

export async function loader({ params }: Route.LoaderArgs) {
  return { edition: await getEdition(params.issue) };
}
export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Edition not found · Minjok Herald" }];
  const { edition } = loaderData;
  return publicationMetadata({
    title: `${edition.issue} edition · ${edition.title}`,
    description: `${edition.pages ? `${edition.pages} pages. ` : ""}Read the original Minjok Herald ${edition.issue} edition.`,
    path: `/editions/${edition.id}`,
    image: edition.cover,
  });
}
export default function Edition({ loaderData }: Route.ComponentProps) {
  return <EditionReader edition={loaderData.edition} />;
}
