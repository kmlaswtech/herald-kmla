import { createHash, randomBytes } from "node:crypto";

/**
 * State-changing newspaper forms must come from the newspaper's own pages. The voter cookie
 * is SameSite=Lax as well; this blocks cross-site posts, including from the community host.
 * Hosts are compared, not schemes, because TLS ends at the proxy in front of the server.
 */
export function isSameSiteForm(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      return new URL(origin).host === new URL(request.url).host;
    } catch {
      return false;
    }
  }
  return request.headers.get("Sec-Fetch-Site") === "same-origin";
}

export function requireSameSiteForm(request: Request) {
  if (!isSameSiteForm(request)) {
    throw new Response("This form must be sent from the newspaper.", {
      status: 403,
    });
  }
}

/** A text field from a submitted form; files and missing fields read as empty. */
export function formText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

const tokenShape = /^[A-Za-z0-9_-]{43}$/;

export function hashSessionToken(token: string | null | undefined) {
  if (!token || !tokenShape.test(token)) return null;
  return createHash("sha256").update(token).digest("hex");
}

/** 256 random bits for the cookie; stored votes only ever see the SHA-256. */
export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashSessionToken(token)! };
}
