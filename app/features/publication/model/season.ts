export const seasons = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof seasons)[number];
export type SeasonPreference = "auto" | Season;

export function seasonInKorea(date: Date): Season {
  const month = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      month: "numeric",
    }).format(date),
  );
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
