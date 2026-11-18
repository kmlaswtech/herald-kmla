import type { Route } from "./+types/editions";
import { getEditions } from "../features/publication/data/queries.server";
import { EditionArchive } from "../features/publication/components/edition-archive";
import { publicationMetadata } from "../features/publication/model/metadata";

export async function loader() {
  return { editions: await getEditions() };
}
export function meta() {
  return publicationMetadata({
    title: "Edition archive",
    description:
      "Read the original Minjok Herald semester editions, preserved as published by KMLA students.",
    path: "/editions",
  });
}
export default function Editions({ loaderData }: Route.ComponentProps) {
  return <EditionArchive editions={loaderData.editions} />;
}
