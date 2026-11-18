import { parseEach, readCollection } from "../../../shared/content.server";
import { arrangePolls, parsePoll, pollView } from "../model/poll";
import { readVoter } from "./voter.server";
import { readBallots } from "./votes.server";

export async function readPolls() {
  const entries = await readCollection("polls", [".yml", ".yaml"]);
  return parseEach(entries, (entry) => parsePoll(entry.stem, entry.text));
}

/** Every published poll as this browser may see it, arranged for the sidebar. */
export async function getPolls(request: Request) {
  const [polls, ballots] = await Promise.all([readPolls(), readBallots()]);
  const voter = readVoter(request);
  const now = Date.now();
  return arrangePolls(
    polls.map((poll) => pollView(poll, ballots[poll.id] ?? {}, voter, now)),
  );
}
