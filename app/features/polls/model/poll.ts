import {
  checkStem,
  flag,
  optionalText,
  parseYamlFields,
  requiredDate,
  requiredText,
} from "../../../shared/fields";

export interface Poll {
  id: string;
  question: string;
  /** The choice text is also its identity in stored votes. */
  options: string[];
  /** UTC ISO instant; editors enter it in Korea time. */
  closesAt?: string;
  /** Closed early by an editor. A closed poll never reopens. */
  closed: boolean;
  /** `yyyy-MM-dd`, for ordering. */
  postedOn: string;
}

/** voter token hash → chosen option, for one poll. */
export type Ballots = Record<string, string>;

const koreaTime = /^(\d{4}-\d{2}-\d{2}) ([01]\d|2[0-3]):([0-5]\d)$/;

/** `yyyy-MM-dd HH:mm` in KST (24-hour) to a UTC ISO instant. */
export function parseKoreaTime(value: string) {
  const match = koreaTime.exec(value.trim());
  if (!match) throw new Error("use a KST time like 2026-12-01 18:00");
  const [, day, hour, minute] = match;
  const instant = new Date(`${day}T${hour}:${minute}:00+09:00`);
  const korea = new Date(instant.getTime() + 9 * 3_600_000);
  if (
    !Number.isFinite(instant.getTime()) ||
    korea.toISOString().slice(0, 10) !== day
  ) {
    throw new Error("use a KST time like 2026-12-01 18:00");
  }
  return instant.toISOString();
}

/** A poll file (`polls/<id>.yml`); `null` while it is marked as a draft. */
export function parsePoll(stem: string, text: string): Poll | null {
  const id = checkStem(stem);
  const fields = parseYamlFields(text);
  if (flag(fields, "draft")) return null;
  const options = fields.options;
  if (
    !Array.isArray(options) ||
    options.length < 2 ||
    options.length > 6 ||
    options.some((option) => typeof option !== "string" || !option.trim())
  ) {
    throw new Error("options must list 2 to 6 choices");
  }
  const labels = options.map((option: string) => option.trim());
  if (new Set(labels).size !== labels.length) {
    throw new Error("options must be distinct");
  }
  const closesAt = optionalText(fields, "closes_at");
  let deadline: string | undefined;
  try {
    deadline = closesAt ? parseKoreaTime(closesAt) : undefined;
  } catch (error) {
    throw new Error(`closes_at: ${(error as Error).message}`);
  }
  return {
    id,
    question: requiredText(fields, "question"),
    options: labels,
    ...(deadline ? { closesAt: deadline } : {}),
    closed: flag(fields, "closed"),
    postedOn: requiredDate(fields, "date"),
  };
}

export function isPollOpen(poll: Poll, now: number) {
  return !poll.closed && !(poll.closesAt && Date.parse(poll.closesAt) <= now);
}

export interface PollView {
  id: string;
  question: string;
  options: string[];
  closesAt?: string;
  open: boolean;
  postedOn: string;
  /** This reader's choice, if they voted. */
  choice: string | null;
  /** Totals, only once this reader has voted or the poll has closed. */
  results: {
    total: number;
    options: { label: string; votes: number }[];
  } | null;
}

/** What one reader may see of a poll. Totals stay on the server until they may be shown. */
export function pollView(
  poll: Poll,
  ballots: Ballots,
  voter: string | null,
  now: number,
): PollView {
  const open = isPollOpen(poll, now);
  const stored = voter ? ballots[voter] : undefined;
  const choice = stored && poll.options.includes(stored) ? stored : null;
  let results: PollView["results"] = null;
  if (choice || !open) {
    const counts = new Map(poll.options.map((label) => [label, 0]));
    for (const option of Object.values(ballots)) {
      const count = counts.get(option);
      if (count !== undefined) counts.set(option, count + 1);
    }
    const options = [...counts].map(([label, votes]) => ({ label, votes }));
    results = {
      total: options.reduce((sum, option) => sum + option.votes, 0),
      options,
    };
  }
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    ...(poll.closesAt ? { closesAt: poll.closesAt } : {}),
    open,
    postedOn: poll.postedOn,
    choice,
    results,
  };
}

/** The sidebar shows two current polls and four past ones; the archive lists every poll. */
export function arrangePolls(polls: PollView[]) {
  const all = [...polls].sort(
    (a, b) =>
      Number(b.open) - Number(a.open) ||
      b.postedOn.localeCompare(a.postedOn) ||
      a.id.localeCompare(b.id),
  );
  return {
    current: all.filter((poll) => poll.open).slice(0, 2),
    past: all.filter((poll) => !poll.open).slice(0, 4),
    all,
  };
}

const kst = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: true,
  timeZone: "Asia/Seoul",
});

export const formatKoreaTime = (iso: string) =>
  `${kst.format(new Date(iso))} KST`;
