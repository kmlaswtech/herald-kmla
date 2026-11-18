import { Link } from "react-router";
import type { HeraldEdition } from "~/features/publication/model/types";

export function EditionReader({ edition }: { edition: HeraldEdition }) {
  return (
    <main id="content" className="edition-reader">
      <header className="reader-toolbar">
        <div>
          <Link className="text-link" to="/editions">
            ← Edition archive
          </Link>
          <h1>{edition.title}</h1>
          <p className="small-note">
            {edition.issue} edition
            {edition.pages ? ` · ${edition.pages} pages` : ""} ·{" "}
            {edition.season}
          </p>
        </div>
        <div className="reader-actions">
          <a
            className="button primary"
            href={edition.pdf}
            target="_blank"
            rel="noreferrer"
          >
            Open PDF in new tab ↗
          </a>
          <a className="button" href={edition.pdf} download>
            Download PDF
          </a>
        </div>
      </header>
      <iframe
        title={`${edition.issue} edition PDF`}
        src={`${edition.pdf}#view=FitH`}
      />
      <p className="reader-fallback">
        If your browser cannot display PDFs, use “Open PDF in new tab” or
        download the edition.
      </p>
    </main>
  );
}
