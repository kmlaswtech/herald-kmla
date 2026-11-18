import { createSessionToken, hashSessionToken } from "./request.server";

// Anonymous, one vote per browser: clearing cookies allows another vote (a product decision).
const fourHundredDays = 60 * 60 * 24 * 400;

function isSecure(request: Request) {
  const forwarded = request.headers.get("X-Forwarded-Proto");
  return (
    forwarded?.split(",")[0]?.trim() === "https" ||
    new URL(request.url).protocol === "https:"
  );
}

// `__Host-` pins the cookie to this exact host over HTTPS, so the community domain can never
// read or overwrite it. Plain-HTTP local development cannot use that prefix.
function cookieName(request: Request) {
  return isSecure(request) ? "__Host-herald-voter" : "herald-voter";
}

function readToken(request: Request) {
  const name = `${cookieName(request)}=`;
  return request.headers
    .get("Cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name))
    ?.slice(name.length);
}

/** This browser's voter id (a token hash), if it has voted before. */
export function readVoter(request: Request) {
  return hashSessionToken(readToken(request));
}

/** The voter id for a vote, creating the browser's cookie on its first vote. */
export function voterFor(request: Request) {
  const existing = readVoter(request);
  if (existing) return { voter: existing };
  const { token, hash } = createSessionToken();
  const secure = isSecure(request) ? "; Secure" : "";
  return {
    voter: hash,
    setCookie: `${cookieName(request)}=${token}; Path=/; Max-Age=${fourHundredDays}; HttpOnly; SameSite=Lax${secure}`,
  };
}
