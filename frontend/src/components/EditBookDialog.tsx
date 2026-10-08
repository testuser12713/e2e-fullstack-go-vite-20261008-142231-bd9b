import { useEffect, useRef, useState, type FormEvent } from "react";
import * as api from "../api";
import { useBooks } from "../state/BooksContext";
import type { Book } from "../types";
import { RatingControl } from "./RatingControl";
import { StatusControl } from "./StatusControl";

export interface EditBookDialogProps {
  book: Book;
  onClose: () => void;
  onSavingChange?: (saving: boolean) => void;
}

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
 * "Buch bearbeiten" modal opened from a book row's edit action. Title and
 * author are prefilled and start neutral; empty fields are only flagged after
 * a submit attempt. Status and rating are the shared per-book controls.
 */
export function EditBookDialog({ book, onClose, onSavingChange }: EditBookDialogProps) {
  const { refresh } = useBooks();
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const titleEmpty = title.trim() === "";
  const authorEmpty = author.trim() === "";

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (titleEmpty || authorEmpty) return;

    setSaving(true);
    onSavingChange?.(true);
    setError(null);
    let saved = false;
    try {
      await api.updateBook(book.id, title.trim(), author.trim());
      await refresh();
      saved = true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Die Änderungen konnten nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
    if (saved) {
      onClose();
    }
  }

  return (
    <div className="modal__overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        ref={dialogRef}
      >
        <div className="modal__header">
          <h2 id="edit-title" className="modal__title">
            Buch bearbeiten
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Dialog schließen"
            title="Dialog schließen"
            onClick={onClose}
            disabled={saving}
          >
            {CLOSE_ICON}
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal__fields">
            <div className={`field${submitted && titleEmpty ? " field--error" : ""}`}>
              <label className="field__label" htmlFor="edit-title-input">
                Titel
              </label>
              <input
                id="edit-title-input"
                ref={titleInputRef}
                className="field__input"
                type="text"
                autoComplete="off"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={submitted && titleEmpty}
                aria-describedby={submitted && titleEmpty ? "edit-title-error" : undefined}
                disabled={saving}
              />
              {submitted && titleEmpty && (
                <p className="field__error" id="edit-title-error">
                  Titel ist erforderlich.
                </p>
              )}
            </div>

            <div className={`field${submitted && authorEmpty ? " field--error" : ""}`}>
              <label className="field__label" htmlFor="edit-author-input">
                Autor
              </label>
              <input
                id="edit-author-input"
                className="field__input"
                type="text"
                autoComplete="off"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                aria-invalid={submitted && authorEmpty}
                aria-describedby={submitted && authorEmpty ? "edit-author-error" : undefined}
                disabled={saving}
              />
              {submitted && authorEmpty && (
                <p className="field__error" id="edit-author-error">
                  Autor ist erforderlich.
                </p>
              )}
            </div>

            <div className="field">
              <span className="field__label">Status</span>
              <StatusControl book={book} />
            </div>

            <div className="field">
              <span className="field__label">Bewertung</span>
              <RatingControl book={book} />
            </div>
          </div>

          {error && (
            <p className="inline-feedback" role="alert">
              {error}
            </p>
          )}

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
