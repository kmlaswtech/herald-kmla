import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { isPollOpen, type Ballots, type Poll } from "../model/poll";

/**
 * Votes live in one JSON file beside the server: Pages CMS content is read-only to readers and
 * the newspaper has no database. This suits one local server process only. A hosted
 * deployment needs shared storage (for example Cloudflare D1) behind these two functions.
 */
interface VoteFile {
  version: 1;
  polls: Record<string, Ballots>;
}

export function votesFile() {
  return process.env.HERALD_VOTES_FILE ?? ".data/votes.json";
}

async function load(file: string): Promise<VoteFile> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, polls: {} };
    }
    throw error;
  }
  // A damaged file must stop voting rather than be replaced by an empty one.
  const parsed = JSON.parse(text) as VoteFile;
  if (parsed?.version !== 1 || typeof parsed.polls !== "object") {
    throw new Error(`${file} is not a newspaper vote file`);
  }
  return parsed;
}

/** poll id → ballots. */
export async function readBallots(file = votesFile()) {
  return (await load(file)).polls;
}

// Writes queue behind each other so concurrent votes never overwrite one another.
const queues = new Map<string, Promise<unknown>>();

function serialize<T>(file: string, task: () => Promise<T>) {
  const run = (queues.get(file) ?? Promise.resolve()).then(task, task);
  queues.set(
    file,
    run.catch(() => undefined),
  );
  return run;
}

export type VoteResult = "ok" | "closed" | "invalid";

/** One choice per voter per poll; a voter may change it until the poll closes. */
export function castVote(
  file: string,
  poll: Poll,
  voter: string,
  option: string,
  now: number,
): Promise<VoteResult> {
  return serialize(file, async () => {
    if (!isPollOpen(poll, now)) return "closed";
    if (!poll.options.includes(option)) return "invalid";
    const data = await load(file);
    data.polls[poll.id] = { ...data.polls[poll.id], [voter]: option };
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
    await rename(temporary, file);
    return "ok";
  });
}
