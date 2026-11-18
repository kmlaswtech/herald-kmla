import type { Route } from "./+types/article";
import { getArticle } from "../features/publication/data/queries.server";
import { ArticleReader } from "../features/publication/components/article-reader";
import { publicationMetadata } from "../features/publication/model/metadata";

export function loader({ params }: Route.LoaderArgs) {
  return getArticle(params.slug);
}
export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Article not found · Minjok Herald" }];
  const { article } = loaderData;
  return publicationMetadata({
    title: article.title,
    description: article.deck,
    path: `/articles/${article.id}`,
    image: article.image,
    article: true,
  });
}
export default function Article({ loaderData }: Route.ComponentProps) {
  return <ArticleReader article={loaderData.article} />;
}
