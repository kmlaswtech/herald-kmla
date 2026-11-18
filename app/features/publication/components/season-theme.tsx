import { createContext, useContext, useEffect, useState } from "react";
import { saveSeasonPreference } from "../data/theme-preference";
import {
  seasonInKorea,
  type Season,
  type SeasonPreference,
} from "../model/season";

const seasonArtwork: Record<Season, { banner: string; paper: string }> = {
  spring: { banner: "/herald/banner.png", paper: "#f3ecdd" },
  summer: { banner: "/herald/themes/summer/banner.jpg", paper: "#ecf3e4" },
  autumn: { banner: "/herald/themes/autumn/banner.jpg", paper: "#f6e9cb" },
  winter: { banner: "/herald/themes/winter/banner.jpg", paper: "#f3f5f6" },
};

export function useSeasonState(initial: {
  preference: SeasonPreference;
  now: number;
}) {
  const [preference, setPreference] = useState(initial.preference);
  const [now, setNow] = useState(initial.now);

  useEffect(() => {
    if (preference !== "auto") {
      saveSeasonPreference(preference);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const current = Date.now();
      setNow(current);
      clearTimeout(timer);
      // Midnight in Korea, with a focus check for suspended/background tabs.
      const untilMidnight = 86_400_000 - ((current + 32_400_000) % 86_400_000);
      timer = setTimeout(refresh, untilMidnight);
    };
    timer = setTimeout(refresh, 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [preference]);

  const season =
    preference === "auto" ? seasonInKorea(new Date(now)) : preference;
  return {
    preference,
    season,
    ...seasonArtwork[season],
    choose: (next: SeasonPreference) => {
      setPreference(next);
      setNow(Date.now());
      saveSeasonPreference(next);
    },
  };
}

export const SeasonThemeContext = createContext<ReturnType<
  typeof useSeasonState
> | null>(null);

export function useSeasonTheme() {
  const theme = useContext(SeasonThemeContext);
  if (!theme)
    throw new Error("Season theme must be inside the newspaper document");
  return theme;
}
