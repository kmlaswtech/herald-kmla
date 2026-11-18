import { describe, expect, it } from "vitest";
import { frontPageSearch } from "../../../app/features/publication/model/front-page";

describe("returning to the front page after a vote", () => {
  it("keeps the reader's section and layout", () => {
    expect(frontPageSearch("?section=Editorial&layout=magazine")).toBe(
      "?section=Editorial&layout=magazine",
    );
    expect(frontPageSearch("layout=magazine")).toBe("?layout=magazine");
  });

  it("drops anything else, including React Router's index marker", () => {
    expect(frontPageSearch("?index&section=Sports&layout=wide&x=1")).toBe("");
    expect(frontPageSearch("")).toBe("");
    expect(frontPageSearch("//evil.example")).toBe("");
  });
});
