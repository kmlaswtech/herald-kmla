import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashSessionToken,
  isSameSiteForm,
} from "../../../app/features/polls/data/request.server";

function post(url: string, headers: Record<string, string>) {
  return new Request(url, { method: "POST", headers });
}

describe("same-site form check", () => {
  it("accepts a form posted from the newspaper itself", () => {
    expect(
      isSameSiteForm(
        post("http://news.kmla.online/", {
          Origin: "https://news.kmla.online",
        }),
      ),
    ).toBe(true);
  });

  it("rejects a form posted from another site", () => {
    expect(
      isSameSiteForm(
        post("http://news.kmla.online/", {
          Origin: "https://evil.example",
        }),
      ),
    ).toBe(false);
  });

  it("rejects the main site posting to the newspaper", () => {
    expect(
      isSameSiteForm(
        post("http://news.kmla.online/", {
          Origin: "https://kmla.online",
        }),
      ),
    ).toBe(false);
  });

  it("falls back to Sec-Fetch-Site when Origin is missing", () => {
    expect(
      isSameSiteForm(
        post("http://127.0.0.1:5174/", {
          "Sec-Fetch-Site": "same-origin",
        }),
      ),
    ).toBe(true);
    expect(
      isSameSiteForm(
        post("http://127.0.0.1:5174/", { "Sec-Fetch-Site": "cross-site" }),
      ),
    ).toBe(false);
  });

  it("rejects a form with neither header", () => {
    expect(isSameSiteForm(post("http://127.0.0.1:5174/", {}))).toBe(false);
  });
});

describe("anonymous voter tokens", () => {
  it("creates a random token and stores only its SHA-256", () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.token).not.toBe(second.token);
    expect(first.hash).toBe(
      createHash("sha256").update(first.token).digest("hex"),
    );
    expect(hashSessionToken(first.token)).toBe(first.hash);
  });

  it("refuses to hash a malformed cookie value", () => {
    expect(hashSessionToken("short")).toBeNull();
    expect(hashSessionToken(undefined)).toBeNull();
  });
});
