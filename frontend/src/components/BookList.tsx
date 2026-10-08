import { useBooks } from "../state/BooksContext";
import type { Book, Status, StatusFilter } from "../types";
import { BookActions } from "./BookActions";

const STATUS_LABELS: Record<Status, string> = {
  planned: "Geplant",
  reading: "Lese gerade",
  read: "Gelesen",
};

const STATUS_CHIP_CLASS: Record<Status, string> = {
  planned: "status-chip--planned",
  reading: "status-chip--reading",
  read: "status-chip--read",
};

const STAR_PATH =
  "M12 2.2l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.08l-5.84 3.09 1.11-6.5-4.72-4.6 6.53-.95L12 2.2z";

const EN_DASH = "\u2013";

function formatReadingDate(finishedAt: string | null): string {
  if (!finishedAt) return EN_DASH;
  const parsed = new Date(finishedAt);
  if (Number.isNaN(parsed.getTime())) return EN_DASH;
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${parsed.getUTCFullYear()}`;
}

function ratingText(rating: number | null): string {
  return rating !== null && rating > 0 ? `${rating} von 5 Sternen` : "Nicht bewertet";
}

function describeFilters(statusFilter: StatusFilter, search: string): string {
  const parts: string[] = [];
  if (statusFilter !== "all") parts.push(`Status: ${STATUS_LABELS[statusFilter]}`);
  if (search !== "") parts.push(`Suche: \u201E${search}\u201C`);
  return parts.length > 0 ? parts.join(" \u00B7 ") : "die aktuelle Auswahl";
}

function ReadOnlyStars({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  return (
    <span className="star-rating star-rating--readonly" role="img" aria-label={ratingText(rating)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <span
            key={star}
            className={`star-rating__star${filled ? " star-rating__star--filled" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={STAR_PATH}
                fill={filled ? "currentColor" : "none"}
                stroke={filled ? "none" : "currentColor"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        );
      })}
    </span>
  );
}

function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`status-chip ${STATUS_CHIP_CLASS[status]}`}>
      <span className="status-chip__dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function EmptyBookGlyph() {
  return (
    <svg
      className="empty-state__glyph"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function BookRow({ book }: { book: Book }) {
  return (
    <div className="book-row">
      <div className="book-row__text">
        <div className="book-row__title" title={book.title}>
          {book.title}
        </div>
        <div className="book-row__author">{book.author}</div>
      </div>
      <div className="book-row__meta">
        <StatusChip status={book.status} />
        <ReadOnlyStars rating={book.rating} />
        <span className="book-row__date">{formatReadingDate(book.finishedAt)}</span>
      </div>
      <div className="book-row__actions">
        <BookActions book={book} />
      </div>
    </div>
  );
}

/**
 * Renders the single list container: one BookRow per visible book, three
 * skeleton rows while loading, an inline retry banner on error, and the two
 * empty-state variants (no books at all / no matches for the active filters).
 */
export function BookList() {
  const {
    books,
    visibleBooks,
    loading,
    error,
    refresh,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
  } = useBooks();

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const hasBooks = books.length > 0;
  const hasMatches = visibleBooks.length > 0;

  return (
    <div className="book-list-region">
      {error !== null && (
        <div className="inline-feedback" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn--ghost" onClick={() => void refresh()}>
            Erneut versuchen
          </button>
        </div>
      )}

      <div className="book-list" aria-busy={loading} aria-label="Bücherliste">
        {loading ? (
          <>
            {[0, 1, 2].map((row) => (
              <div className="skeleton-row" key={row} aria-hidden="true">
                <div className="skeleton-row__block" />
              </div>
            ))}
          </>
        ) : !hasBooks ? (
          <div className="empty-state">
            <EmptyBookGlyph />
            <h3 className="empty-state__title">Noch keine Bücher</h3>
            <p className="empty-state__hint">Lege dein erstes Buch mit Titel und Autor an.</p>
          </div>
        ) : !hasMatches ? (
          <div className="empty-state">
            <EmptyBookGlyph />
            <h3 className="empty-state__title">Keine Treffer</h3>
            <p className="empty-state__hint">
              Keine Bücher für {describeFilters(statusFilter, search.trim())}.
            </p>
            <button type="button" className="btn btn--ghost" onClick={resetFilters}>
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          visibleBooks.map((book) => <BookRow key={book.id} book={book} />)
        )}
      </div>
    </div>
  );
}
