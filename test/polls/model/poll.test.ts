import { describe, expect, it } from "vitest";
import {
  arrangePolls,
  isPollOpen,
  parseKoreaTime,
  parsePoll,
  pollView,
  type Poll,
} from "../../../app/features/polls/model/poll";

const file = (extra = "") =>
  [
    "question: Which club fair booth was best?",
    "date: 2026-11-10",
    "options:",
    "  - Robotics",
    "  - Debate",
    "  - Choir",
    extra,
  ].join("\n");

describe("Pages CMS polls", () => {
  it("reads a poll file keyed by its file name", () => {
    expect(parsePoll("club-fair", file("closes_at: 2026-12-01 18:00"))).toEqual(
      {
        id: "club-fair",
        question: "Which club fair booth was best?",
        options: ["Robotics", "Debate", "Choir"],
        closesAt: "2026-12-01T09:00:00.000Z",
        closed: false,
        postedOn: "2026-11-10",
      },
    );
  });

  it("keeps draft polls off the site", () => {
    expect(parsePoll("held", file("draft: true"))).toBeNull();
  });

  it("needs two to six distinct choices", () => {
    expect(() =>
      parsePoll("one", "question: Q\ndate: 2026-11-10\noptions:\n  - Only"),
    ).toThrow(/2 to 6/);
    expect(() =>
      parsePoll(
        "seven",
        `question: Q\ndate: 2026-11-10\noptions: [a, b, c, d, e, f, g]`,
      ),
    ).toThrow(/2 to 6/);
    expect(() =>
      parsePoll("same", "question: Q\ndate: 2026-11-10\noptions: [a, a]"),
    ).toThrow(/distinct/);
  });

  it("rejects an unreadable closing time", () => {
    expect(() => parsePoll("late", file("closes_at: next Friday"))).toThrow(
      /closes_at/,
    );
  });
});

describe("Korea time", () => {
  it("reads 24-hour KST and stores UTC", () => {
    expect(parseKoreaTime("2026-12-01 00:30")).toBe("2026-11-30T15:30:00.000Z");
  });

  it.each(["2026-02-30 10:00", "2026-12-01 24:00", "2026-12-01 9:5", ""])(
    "rejects %j",
    (value) => {
      expect(() => parseKoreaTime(value)).toThrow();
    },
  );
});

const poll: Poll = {
  id: "club-fair",
  question: "Which booth?",
  options: ["Robotics", "Debate"],
  closesAt: "2026-12-01T09:00:00.000Z",
  closed: false,
  postedOn: "2026-11-10",
};
const before = Date.parse("2026-12-01T08:59:59Z");
const after = Date.parse("2026-12-01T09:00:00Z");

describe("poll state", () => {
  it("stops taking votes at the closing time or when closed early", () => {
    expect(isPollOpen(poll, before)).toBe(true);
    expect(isPollOpen(poll, after)).toBe(false);
    expect(isPollOpen({ ...poll, closed: true }, before)).toBe(false);
    expect(isPollOpen({ ...poll, closesAt: undefined }, after)).toBe(true);
  });

  const ballots = { a: "Robotics", b: "Debate", c: "Debate", d: "Removed" };

  it("hides the totals from a reader who has not voted on an open poll", () => {
    expect(pollView(poll, ballots, "nobody", before)).toMatchObject({
      open: true,
      choice: null,
      results: null,
    });
    expect(pollView(poll, ballots, null, before).results).toBeNull();
  });

  it("shows totals and the reader's own choice once they have voted", () => {
    expect(pollView(poll, ballots, "a", before)).toMatchObject({
      choice: "Robotics",
      results: {
        total: 3,
        options: [
          { label: "Robotics", votes: 1 },
          { label: "Debate", votes: 2 },
        ],
      },
    });
  });

  it("shows totals to everyone after closing and ignores votes for removed choices", () => {
    expect(pollView(poll, ballots, null, after)).toMatchObject({
      open: false,
      results: { total: 3 },
    });
  });
});

describe("sidebar arrangement", () => {
  const view = (id: string, postedOn: string, open: boolean) =>
    pollView(
      { ...poll, id, postedOn, closed: !open, closesAt: undefined },
      {},
      null,
      before,
    );

  it("shows two current polls and four past polls, newest first, and keeps every poll in the archive", () => {
    const polls = [
      view("o1", "2026-11-01", true),
      view("o2", "2026-11-03", true),
      view("o3", "2026-11-02", true),
      ...["c1", "c2", "c3", "c4", "c5"].map((id, index) =>
        view(id, `2026-10-0${index + 1}`, false),
      ),
    ];
    const arranged = arrangePolls(polls);
    expect(arranged.current.map((item) => item.id)).toEqual(["o2", "o3"]);
    expect(arranged.past.map((item) => item.id)).toEqual([
      "c5",
      "c4",
      "c3",
      "c2",
    ]);
    expect(arranged.all).toHaveLength(8);
    expect(arranged.all[0].id).toBe("o2");
  });
});
