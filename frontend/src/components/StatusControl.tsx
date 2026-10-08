import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import * as api from "../api";
import { useBooks } from "../state/BooksContext";
import type { Book, Status } from "../types";

export interface StatusControlProps {
  book: Book;
  /**
   * Presentation of the control. `"chip"` (default) renders the compact
   * StatusChip used inside a BookRow; `"select"` renders the full Select used
   * inside the "Buch bearbeiten" modal. Both are changeable.
   */
  variant?: "chip" | "select";
}

interface StatusOption {
  value: Status;
  label: string;
}

const STATUS_OPTIONS: readonly StatusOption[] = [
  { value: "planned", label: "Geplant" },
  { value: "reading", label: "Lese gerade" },
  { value: "read", label: "Gelesen" },
];

const STATUS_LABELS: Record<Status, string> = {
  planned: "Geplant",
  reading: "Lese gerade",
  read: "Gelesen",
};

/**
 * Per-book status control. Shows the current status and, when changed, calls
 * `api.setStatus` followed by `refresh()` so the BooksContext state reflects
 * the persisted value. The control is disabled while the request is in flight
 * and shows a short message if the call fails.
 */
export function StatusControl({ book, variant = "chip" }: StatusControlProps) {
  const { refresh } = useBooks();
  const [selected, setSelected] = useState<Status>(book.status);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(book.status);
  }, [book.status]);

  const changeStatus = useCallback(
    async (next: Status): Promise<void> => {
      if (next === book.status) {
        setSelected(next);
        return;
      }
      setSelected(next);
      setSaving(true);
      setError(null);
      try {
        await api.setStatus(book.id, next);
        await refresh();
      } catch (cause) {
        setSelected(book.status);
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Status konnte nicht geändert werden.",
        );
      } finally {
        setSaving(false);
      }
    },
    [book.id, book.status, refresh],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      void changeStatus(event.target.value as Status);
    },
    [changeStatus],
  );

  const label = STATUS_LABELS[book.status];
  const errorMessage = error ? (
    <p className="field__error" role="status">
      {error}
    </p>
  ) : null;

  if (variant === "select") {
    return (
      <div>
        <div className="select">
          <select
            className="select__control"
            value={selected}
            disabled={saving}
            aria-label={`Status von „${book.title}“`}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="select__chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {errorMessage}
      </div>
    );
  }

  return (
    <div>
      <select
        className={`status-chip status-chip--${book.status} status-chip--control`}
        value={selected}
        disabled={saving}
        aria-label={`Status von „${book.title}“ ändern (aktuell: ${label})`}
        title={`Status: ${label} — klicken zum Ändern`}
        onChange={handleChange}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMessage}
    </div>
  );
}
