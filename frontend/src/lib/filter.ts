import type { Book, StatusFilter } from "../types";

/**
 * Filters the given books by status and a free-text search over title/author.
 * This is filled by the "Add the status filter and the title/author search"
 * ticket; until then it returns the list unchanged.
 */
export function filterBooks(books: Book[], _statusFilter: StatusFilter, _search: string): Book[] {
  return books;
}
