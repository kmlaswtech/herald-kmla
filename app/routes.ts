import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("articles/:slug", "routes/article.tsx"),
  route("editions", "routes/editions.tsx"),
  route("editions/:issue", "routes/edition.tsx"),
] satisfies RouteConfig;
