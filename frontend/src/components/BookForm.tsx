import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import * as api from "../api";
import { useBooks } from "../state/BooksContext";
import type { Status } from "../types";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "planned", label: "Geplant" },
  { value: "reading", label: "Lese gerade" },
  { value: "read", label: "Gelesen" },
];

const fieldStackStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-1)",
};

const headingStyle: CSSProperties = {
  marginBottom: "var(--space-3)",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "var(--space-4)",
};

/**
 * Create form "Neues Buch anlegen". Starts neutral and only marks a field
 * invalid once it has been typed into and left empty, or on a submit attempt.
 */
export function BookForm() {
  const { refresh } = useBooks();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<Status>("planned");
  const [touched, setTouched] = useState({ title: false, author: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const titleId = useId();
  const authorId = useId();
  const statusId = useId();
  const titleErrorId = `${titleId}-error`;
  const authorErrorId = `${authorId}-error`;

  const titleTrimmed = title.trim();
  const authorTrimmed = author.trim();

  const titleError = touched.title && titleTrimmed === "" ? "Titel ist erforderlich." : null;
  const authorError = touched.author && authorTrimmed === "" ? "Autor ist erforderlich." : null;

  const canSubmit = titleTrimmed !== "" && authorTrimmed !== "" && !submitting;

  useEffect(() => {
    if (success === null) return;
    const timer = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    setServerError(null);
    setSuccess(null);
    setTouched({ title: true, author: true });

    if (titleTrimmed === "" || authorTrimmed === "") return;

    setSubmitting(true);
    try {
      const created = await api.createBook(titleTrimmed, authorTrimmed);
      if (created && created.status !== status) {
        await api.setStatus(created.id, status);
      }
      await refresh();
      setTitle("");
      setAuthor("");
      setStatus("planned");
      setTouched({ title: false, author: false });
      setSuccess("Buch angelegt.");
    } catch (cause) {
      setServerError(
        cause instanceof Error ? cause.message : "Das Buch konnte nicht angelegt werden.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card" aria-labelledby={`${titleId}-form-title`}>
      <h2 id={`${titleId}-form-title`} style={headingStyle}>
        Neues Buch anlegen
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div style={fieldStackStyle}>
          <div className={`field${titleError ? " field--error" : ""}`}>
            <label className="field__label" htmlFor={titleId}>
              Titel
            </label>
            <input
              id={titleId}
              className="field__input"
              type="text"
              value={title}
              placeholder="z. B. Der Zauberberg"
              autoComplete="off"
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? titleErrorId : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                setTouched((previous) => ({ ...previous, title: true }));
              }}
            />
            {titleError && (
              <p className="field__error" id={titleErrorId}>
                {titleError}
              </p>
            )}
          </div>

          <div className={`field${authorError ? " field--error" : ""}`}>
            <label className="field__label" htmlFor={authorId}>
              Autor
            </label>
            <input
              id={authorId}
              className="field__input"
              type="text"
              value={author}
              placeholder="z. B. Thomas Mann"
              autoComplete="off"
              aria-invalid={authorError ? true : undefined}
              aria-describedby={authorError ? authorErrorId : undefined}
              onChange={(event) => {
                setAuthor(event.target.value);
                setTouched((previous) => ({ ...previous, author: true }));
              }}
            />
            {authorError && (
              <p className="field__error" id={authorErrorId}>
                {authorError}
              </p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor={statusId}>
              Status
            </label>
            <div className="select">
              <select
                id={statusId}
                className="select__control"
                value={status}
                onChange={(event) => setStatus(event.target.value as Status)}
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
          </div>
        </div>

        {serverError && (
          <p className="inline-feedback" role="alert" style={{ marginTop: "var(--space-3)" }}>
            {serverError}
          </p>
        )}

        <div style={footerStyle}>
          <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
            Speichern
          </button>
        </div>
      </form>

      {success && (
        <div className="toast" role="status" aria-live="polite">
          {success}
        </div>
      )}
    </section>
  );
}
