import type { CSSProperties } from "react";
import { Form, useLocation, useNavigation } from "react-router";
import { formatKoreaTime, type PollView } from "../model/poll";

export interface PollShelf {
  current: PollView[];
  past: PollView[];
  all: PollView[];
}

export interface PollError {
  poll: string;
  message: string;
}

/** Two current polls, four past ones, and every poll behind "View all polls". */
export function PollPanel({
  polls,
  error,
}: {
  polls: PollShelf;
  error?: PollError;
}) {
  const { current, past, all } = polls;
  const errorFor = (poll: PollView) =>
    error?.poll === poll.id ? error.message : undefined;
  return (
    <section className="poll-panel" aria-labelledby="polls-heading">
      <div className="section-heading wash-coral">
        <h2 id="polls-heading">Have your say</h2>
        <span aria-hidden="true">▥</span>
      </div>
      <div className="poll-panel-body">
        {all.length === 0 ? (
          <p>No polls at the moment.</p>
        ) : (
          <>
            {current.length ? (
              current.map((poll) => (
                <PollCard
                  key={poll.id}
                  id={`poll-${poll.id}`}
                  poll={poll}
                  error={errorFor(poll)}
                />
              ))
            ) : (
              <p>No polls are open right now.</p>
            )}
            {past.length > 0 && (
              <>
                <h3 className="past-polls-heading">Past polls</h3>
                <ul className="past-polls">
                  {past.map((poll) => (
                    <li key={poll.id}>
                      <details id={`poll-${poll.id}`}>
                        <summary>{poll.question}</summary>
                        <PollCard poll={poll} titled={false} />
                      </details>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {all.length > current.length + past.length && (
              <details className="poll-archive">
                <summary className="button">View all polls</summary>
                <ul>
                  {all.map((poll) => (
                    <li key={poll.id}>
                      <details open={error?.poll === poll.id || undefined}>
                        <summary>{poll.question}</summary>
                        <PollCard
                          poll={poll}
                          titled={false}
                          error={errorFor(poll)}
                        />
                      </details>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PollCard({
  poll,
  id,
  titled = true,
  error,
}: {
  poll: PollView;
  id?: string;
  titled?: boolean;
  error?: string;
}) {
  return (
    <article className="poll-card" id={id}>
      {titled && <h3>{poll.question}</h3>}
      <p className="small-note">
        {poll.open
          ? poll.closesAt
            ? `Closes ${formatKoreaTime(poll.closesAt)}`
            : "Open"
          : "Closed"}
      </p>
      {poll.results && <PollResults poll={poll} results={poll.results} />}
      {poll.open &&
        (poll.choice ? (
          <details className="change-vote" open={!!error || undefined}>
            <summary>Change your vote</summary>
            <VoteForm poll={poll} />
          </details>
        ) : (
          <VoteForm poll={poll} />
        ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

function VoteForm({ poll }: { poll: PollView }) {
  const navigation = useNavigation();
  const { search } = useLocation();
  const pending =
    navigation.state === "submitting" &&
    navigation.formData?.get("poll") === poll.id;
  return (
    <Form method="post" className="poll-form" preventScrollReset>
      <input type="hidden" name="poll" value={poll.id} />
      {/* Returns the reader to the same section and layout after voting. */}
      <input type="hidden" name="view" value={search} />
      <fieldset>
        <legend className="visually-hidden">{poll.question}</legend>
        {poll.options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="choice"
              value={option}
              required
              defaultChecked={option === poll.choice}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Saving…" : poll.choice ? "Change vote" : "Vote"}
      </button>
    </Form>
  );
}

function PollResults({
  poll,
  results,
}: {
  poll: PollView;
  results: NonNullable<PollView["results"]>;
}) {
  return (
    <>
      <ul className="poll-results">
        {results.options.map((option) => {
          const share = results.total
            ? Math.round((option.votes / results.total) * 100)
            : 0;
          return (
            <li
              key={option.label}
              style={{ "--share": `${share}%` } as CSSProperties}
            >
              <span className="poll-option">
                {option.label}
                {option.label === poll.choice && (
                  <span className="poll-mine"> · Your vote</span>
                )}
              </span>
              <span className="poll-count">
                {share}% ({option.votes})
              </span>
            </li>
          );
        })}
      </ul>
      <p className="small-note">
        {results.total} {results.total === 1 ? "vote" : "votes"}
      </p>
    </>
  );
}
