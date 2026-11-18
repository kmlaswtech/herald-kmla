import { data, redirect } from "react-router";
import type { Route } from "./+types/home";
import { getFrontPage } from "../features/publication/data/queries.server";
import { FrontPage } from "../features/publication/components/front-page";
import { publicationMetadata } from "../features/publication/model/metadata";
import { frontPageSearch } from "../features/publication/model/front-page";
import { getPolls } from "../features/polls/data/queries.server";
import { vote } from "../features/polls/data/mutations.server";
import {
  formText,
  requireSameSiteForm,
} from "../features/polls/data/request.server";
import { PollPanel } from "../features/polls/components/poll-panel";

export async function loader({ request }: Route.LoaderArgs) {
  const [front, polls] = await Promise.all([
    getFrontPage(request),
    getPolls(request),
  ]);
  return { ...front, polls };
}

// Voting posts back to the front page, so it works without JavaScript and adds no URL.
export async function action({ request }: Route.ActionArgs) {
  requireSameSiteForm(request);
  const form = await request.formData();
  const poll = formText(form, "poll");
  const result = await vote(request, poll, formText(form, "choice"));
  const headers = new Headers();
  if (result.setCookie) headers.append("Set-Cookie", result.setCookie);
  if (result.status === "ok") {
    // Not request.url: client-side submissions arrive as `/_.data?index`.
    throw redirect(`/${frontPageSearch(formText(form, "view"))}#poll-${poll}`, {
      headers,
    });
  }
  return data(
    { pollError: { poll, message: result.message } },
    { status: result.status === "closed" ? 409 : 400, headers },
  );
}

export function meta() {
  return publicationMetadata({
    title: "Student-led press at KMLA",
    description:
      "Written/Edited by students, for students. Read Minjok Herald stories and semester editions.",
    path: "/",
  });
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const { polls, ...front } = loaderData;
  return (
    <FrontPage
      {...front}
      polls={<PollPanel polls={polls} error={actionData?.pollError} />}
    />
  );
}
