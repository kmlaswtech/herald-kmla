import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Poll } from "../../../app/features/polls/model/poll";
import {
  castVote,
  readBallots,
} from "../../../app/features/polls/data/votes.server";

const poll: Poll = {
  id: "club-fair",
  question: "Which booth?",
  options: ["Robotics", "Debate"],
  closesAt: "2026-12-01T09:00:00.000Z",
  closed: false,
  postedOn: "2026-11-10",
};
const now = Date.parse("2026-11-20T00:00:00Z");

let dir: string;
let file: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "herald-votes-"));
  file = join(dir, "nested", "votes.json");
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("vote storage", () => {
  it("starts empty when nothing has been stored", async () => {
    expect(await readBallots(file)).toEqual({});
  });

  it("records one choice per voter and lets them change it while open", async () => {
    expect(await castVote(file, poll, "v1", "Robotics", now)).toBe("ok");
    expect(await castVote(file, poll, "v2", "Debate", now)).toBe("ok");
    expect(await castVote(file, poll, "v1", "Debate", now)).toBe("ok");
    expect((await readBallots(file))["club-fair"]).toEqual({
      v1: "Debate",
      v2: "Debate",
    });
  });

  it("refuses a choice the poll does not offer", async () => {
    expect(await castVote(file, poll, "v1", "Choir", now)).toBe("invalid");
    expect(await readBallots(file)).toEqual({});
  });

  it("refuses votes after closing, without changing earlier ones", async () => {
    await castVote(file, poll, "v1", "Robotics", now);
    const late = Date.parse("2026-12-01T09:00:00Z");
    expect(await castVote(file, poll, "v1", "Debate", late)).toBe("closed");
    expect(
      await castVote(file, { ...poll, closed: true }, "v2", "Debate", now),
    ).toBe("closed");
    expect((await readBallots(file))["club-fair"]).toEqual({ v1: "Robotics" });
  });

  it("does not lose votes cast at the same moment", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        castVote(file, poll, `v${index}`, "Robotics", now),
      ),
    );
    expect(Object.keys((await readBallots(file))["club-fair"])).toHaveLength(
      25,
    );
  });

  it("stores only what it needs in a readable file", async () => {
    await castVote(file, poll, "v1", "Robotics", now);
    expect(JSON.parse(await readFile(file, "utf8"))).toEqual({
      version: 1,
      polls: { "club-fair": { v1: "Robotics" } },
    });
  });

  it("refuses to overwrite a vote file it cannot read", async () => {
    await castVote(file, poll, "v1", "Robotics", now);
    await writeFile(file, "{ not json");
    await expect(castVote(file, poll, "v2", "Debate", now)).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("{ not json");
  });
});
