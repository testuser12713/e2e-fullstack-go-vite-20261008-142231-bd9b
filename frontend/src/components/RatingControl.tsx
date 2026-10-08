import { useRef, useState, type KeyboardEvent } from "react";
import * as api from "../api";
import { useBooks } from "../state/BooksContext";
import type { Book } from "../types";

export interface RatingControlProps {
  book: Book;
  /**
   * Render the non-interactive read-only variant DESIGN.md defines for the
   * list column (16px stars, no tap targets).
   */
  readOnly?: boolean;
}

const STARS = [1, 2, 3, 4, 5] as const;

const STAR_PATH =
  "M12 2.2l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.08l-5.84 3.09 1.11-6.5-4.72-4.6 6.53-.95L12 2.2z";

/** The single text equivalent every rating state carries. */
export function ratingText(rating: number | null): string {
  return rating && rating > 0 ? `${rating} von 5 Sternen` : "Nicht bewertet";
}

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={STAR_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReadOnlyStars({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  return (
    <span className="star-rating star-rating--readonly" role="img" aria-label={ratingText(rating)}>
      {STARS.map((star) => (
        <span
          key={star}
          className={
            star <= value ? "star-rating__star star-rating__star--filled" : "star-rating__star"
          }
          aria-hidden="true"
        >
          <StarGlyph filled={star <= value} />
        </span>
      ))}
    </span>
  );
}

/** Non-interactive rating for the list column; takes a full book like the control. */
export function ReadOnlyRating({ book }: RatingControlProps) {
  return <ReadOnlyStars rating={book.rating} />;
}

function InteractiveRating({ book }: { book: Book }) {
  const { refresh } = useBooks();
  const [pending, setPending] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(() =>
    book.rating && book.rating > 0 ? book.rating - 1 : 0,
  );
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const rating = book.rating ?? 0;
  // While hovering (or focusing) a star, preview 1..N; otherwise show the set value.
  const shown = hovered > 0 ? hovered : rating;

  async function commit(value: number) {
    if (pending) return;
    const next = rating === value ? null : value;
    setPending(true);
    setError(null);
    try {
      await api.setRating(book.id, next);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Bewertung konnte nicht gespeichert werden.");
      // Re-sync with the authoritative store so a failed write leaves no phantom value.
      await refresh();
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    let next = index + delta;
    if (next < 0) next = 0;
    if (next > STARS.length - 1) next = STARS.length - 1;
    setFocusIndex(next);
    buttons.current[next]?.focus();
  }

  return (
    <span className="star-rating" role="radiogroup" aria-label={`Bewertung: ${ratingText(book.rating)}`}>
      {STARS.map((star, index) => {
        const filled = star <= shown;
        return (
          <button
            key={star}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} von 5 Sternen`}
            className={filled ? "star-rating__star star-rating__star--filled" : "star-rating__star"}
            tabIndex={index === focusIndex ? 0 : -1}
            disabled={pending}
            onClick={() => void commit(star)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
          >
            <StarGlyph filled={filled} />
          </button>
        );
      })}
      {error ? (
        <span className="star-rating__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

/**
 * 1-5 star rating control. Interactive by default; pass `readOnly` (or use
 * `ReadOnlyRating`) for the non-interactive list-column variant.
 */
export function RatingControl({ book, readOnly = false }: RatingControlProps) {
  if (readOnly) {
    return <ReadOnlyStars rating={book.rating} />;
  }
  return <InteractiveRating book={book} />;
}
