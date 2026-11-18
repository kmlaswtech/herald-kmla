import { seasons, type SeasonPreference } from "../model/season";

const cookieName = "herald-season-v1";

export function readSeasonPreference(cookie: string | null): SeasonPreference {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  return seasons.find((season) => season === value) ?? "auto";
}

export function saveSeasonPreference(preference: SeasonPreference) {
  // A public, host-only display preference; never shared with community Auth.
  const maxAge = preference === "auto" ? 0 : 34_560_000;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  try {
    document.cookie = `${cookieName}=${preference}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // Cookie-disabled readers can still change the current page's appearance.
  }
}
