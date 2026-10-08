import { useEffect, useRef, useState } from "react";
import * as api from "../api";
import { useBooks } from "../state/BooksContext";
import type { Book } from "../types";
import { EditBookDialog } from "./EditBookDialog";

export interface BookActionsProps {
  book: Book;
}

const EDIT_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TRASH_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

const CLOSE_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/**
 * Per-book edit and delete actions shown in a row. Edit opens the
 * "Buch bearbeiten" dialog; delete opens a "Buch löschen?" confirmation. Both
 * controls are disabled while their request is in flight.
 */
export function BookActions({ book }: BookActionsProps) {
  const { refresh } = useBooks();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  function closeEdit() {
    setEditing(false);
    editButtonRef.current?.focus();
  }

  function closeDelete() {
    if (busy) return;
    setConfirmingDelete(false);
    setError(null);
    deleteButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!confirmingDelete) return;
    confirmButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) {
          setConfirmingDelete(false);
          setError(null);
          deleteButtonRef.current?.focus();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmingDelete, busy]);

  async function handleConfirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteBook(book.id);
      setConfirmingDelete(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Das Buch konnte nicht gelöscht werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="book-row__actions">
        <button
          type="button"
          ref={editButtonRef}
          className="icon-button"
          aria-label={`Buch bearbeiten: ${book.title}`}
          title={`Buch bearbeiten: ${book.title}`}
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          {EDIT_ICON}
        </button>
        <button
          type="button"
          ref={deleteButtonRef}
          className="icon-button icon-button--danger"
          aria-label={`Buch löschen: ${book.title}`}
          title={`Buch löschen: ${book.title}`}
          disabled={busy}
          onClick={() => {
            setError(null);
            setConfirmingDelete(true);
          }}
        >
          {TRASH_ICON}
        </button>
      </div>

      {editing && (
        <EditBookDialog book={book} onClose={closeEdit} onSavingChange={setBusy} />
      )}

      {confirmingDelete && (
        <div className="modal__overlay">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            ref={dialogRef}
          >
            <div className="modal__header">
              <h2 id="delete-title" className="modal__title">
                Buch löschen?
              </h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Dialog schließen"
                title="Dialog schließen"
                onClick={closeDelete}
                disabled={busy}
              >
                {CLOSE_ICON}
              </button>
            </div>
            <p className="modal__text">Möchtest du „{book.title}“ wirklich löschen?</p>
            {error && (
              <p className="inline-feedback" role="alert">
                {error}
              </p>
            )}
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeDelete}
                disabled={busy}
              >
                Abbrechen
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                className="btn btn--danger"
                onClick={handleConfirmDelete}
                disabled={busy}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
