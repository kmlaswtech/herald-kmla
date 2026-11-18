import { readSeasonPreference } from "./theme-preference";

/** The first response renders the reader's saved season; HTML varies with the cookie. */
export function initialTheme(request: Request) {
  return {
    preference: readSeasonPreference(request.headers.get("Cookie")),
    now: Date.now(),
  };
}
