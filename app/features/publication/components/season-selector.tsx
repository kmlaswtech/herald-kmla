import { seasons, type SeasonPreference } from "../model/season";
import { useSeasonTheme } from "./season-theme";

const choices: readonly SeasonPreference[] = ["auto", ...seasons];

export function SeasonSelector() {
  const { preference, season, choose } = useSeasonTheme();
  const label =
    preference === "auto" ? `Auto · ${season} in Korea` : `${season} theme`;
  return (
    <div className="season-control">
      <div className="season-caption">
        <label htmlFor="season-theme">Season theme</label>
        <span aria-live="polite">{label}</span>
      </div>
      <input
        id="season-theme"
        name="season"
        type="range"
        min="0"
        max="4"
        step="1"
        value={choices.indexOf(preference)}
        aria-valuetext={label}
        onChange={(event) => choose(choices[Number(event.target.value)])}
      />
      <div className="season-labels">
        {choices.map((choice) => (
          <button
            type="button"
            key={choice}
            aria-pressed={preference === choice}
            onClick={() => choose(choice)}
          >
            {choice === "auto"
              ? "Auto"
              : choice[0].toUpperCase() + choice.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
