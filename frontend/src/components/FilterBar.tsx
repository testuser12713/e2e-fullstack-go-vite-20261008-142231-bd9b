import { useRef, type ChangeEvent } from "react";
import { useBooks } from "../state/BooksContext";
import type { StatusFilter } from "../types";

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "planned", label: "Geplant" },
  { value: "reading", label: "Lese gerade" },
  { value: "read", label: "Gelesen" },
];

export function FilterBar() {
  const { statusFilter, setStatusFilter, search, setSearch } = useBooks();
  const searchRef = useRef<HTMLInputElement>(null);

  const isActive = statusFilter !== "all" || search.trim() !== "";
  const hasSearchTerm = search !== "";

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const resetSearch = () => {
    setSearch("");
    searchRef.current?.focus();
  };

  return (
    <div className="filter-bar" role="search" aria-label="Filter und Suche">
      <span className="select">
        <select
          className="select__control"
          aria-label="Status filtern"
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
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
      </span>

      <div className="search-input">
        <svg
          className="search-input__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={searchRef}
          className="field__input search-input__input"
          type="search"
          aria-label="Titel oder Autor suchen"
          placeholder="Titel oder Autor suchen"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
        />
        {hasSearchTerm && (
          <button
            type="button"
            className="icon-button search-input__clear"
            aria-label="Suche zurücksetzen"
            onClick={resetSearch}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <button
        type="button"
        className="btn btn--ghost"
        disabled={!isActive}
        onClick={resetFilters}
      >
        Filter zurücksetzen
      </button>
    </div>
  );
}
