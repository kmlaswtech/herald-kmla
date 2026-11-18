import { readPolls } from "./queries.server";
import { voterFor } from "./voter.server";
import { castVote, votesFile } from "./votes.server";

const messages = {
  closed: "This poll has closed.",
  invalid: "Choose one of the poll's options.",
  missing: "This poll is no longer available.",
} as const;

export type VoteOutcome =
  | { status: "ok"; setCookie?: string }
  | { status: keyof typeof messages; message: string; setCookie?: string };

export async function vote(
  request: Request,
  pollId: string,
  choice: string,
): Promise<VoteOutcome> {
  const poll = (await readPolls()).find((item) => item.id === pollId);
  if (!poll) return { status: "missing", message: messages.missing };
  if (!poll.options.includes(choice)) {
    return { status: "invalid", message: messages.invalid };
  }
  const { voter, setCookie } = voterFor(request);
  const result = await castVote(votesFile(), poll, voter, choice, Date.now());
  // The cookie is only worth keeping once it identifies a stored vote.
  if (result === "ok") return { status: "ok", setCookie };
  return { status: result, message: messages[result] };
}
