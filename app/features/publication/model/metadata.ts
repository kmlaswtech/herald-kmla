const origin = "https://news.kmla.online";

export function publicationMetadata({
  title,
  description,
  path,
  image = "/herald/banner.png",
  article = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  article?: boolean;
}) {
  return [
    { title: `${title} · Minjok Herald` },
    { name: "description", content: description },
    { tagName: "link" as const, rel: "canonical", href: `${origin}${path}` },
    { property: "og:site_name", content: "Minjok Herald" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: article ? "article" : "website" },
    { property: "og:url", content: `${origin}${path}` },
    // R2 uploads are already absolute once the bucket's public address is configured.
    { property: "og:image", content: new URL(image, origin).href },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
