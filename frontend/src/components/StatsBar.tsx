import { useEffect, useState } from "react";
import { countReadThisYear } from "../lib/stats";
import { useBooks } from "../state/BooksContext";

/**
 * Yearly reading statistics card in the page header. Reads the books from
 * `useBooks()` so the count follows a status change. While a request is in
 * flight the previous value stays visible with a spinner; on failure the last
 * value stays and an inline error offers a retry.
 */
export function StatsBar() {
  const { books, loading, error, refresh } = useBooks();

  const now = new Date();
  const year = now.getUTCFullYear();
  const currentCount = countReadThisYear(books, now);

  const [lastCount, setLastCount] = useState(currentCount);

  useEffect(() => {
    if (!loading && !error) {
      setLastCount(currentCount);
    }
  }, [currentCount, loading, error]);

  const displayCount = loading || error ? lastCount : currentCount;

  return (
    <aside className="stat-card">
      <span className="stat-card__label">Gelesen im Jahr {year}</span>
      <div
        className={`stat-card__value${loading ? " stat-card__value--loading" : ""}`}
        aria-live="polite"
        aria-busy={loading}
      >
        <span className="stat-card__number">{displayCount}</span>
        <span className="stat-card__unit">Bücher</span>
        {loading ? <span className="stat-card__spinner" aria-hidden="true" /> : null}
      </div>
      {error ? (
        <div className="inline-feedback stat-card__error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void refresh();
            }}
          >
            Erneut versuchen
          </button>
        </div>
      ) : null}
    </aside>
  );
}
