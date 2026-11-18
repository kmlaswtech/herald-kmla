import { describe, expect, it } from "vitest";
import { seasonInKorea } from "../../../app/features/publication/model/season";

describe("the newspaper's automatic season", () => {
  it.each([
    ["2027-02-28T14:59:59Z", "winter"],
    ["2027-02-28T15:00:00Z", "spring"],
    ["2027-05-31T14:59:59Z", "spring"],
    ["2027-05-31T15:00:00Z", "summer"],
    ["2027-08-31T14:59:59Z", "summer"],
    ["2027-08-31T15:00:00Z", "autumn"],
    ["2027-11-30T14:59:59Z", "autumn"],
    ["2027-11-30T15:00:00Z", "winter"],
    ["2028-02-29T14:59:59Z", "winter"],
    ["2028-02-29T15:00:00Z", "spring"],
  ])(
    "at %s it is %s, regardless of the reader's timezone",
    (instant, season) => {
      expect(seasonInKorea(new Date(instant))).toBe(season);
    },
  );
});
