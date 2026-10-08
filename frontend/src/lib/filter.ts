import type { Book, StatusFilter } from "../types";

/**
 * Filters the given books by status and a free-text search over title/author.
 *
 * A book is kept only when both conditions hold:
 * - the status matches when `statusFilter` is "all" or equals the book's status;
 * - the search term is a case-insensitive substring of the title or the author.
 *   A whitespace-only (or empty) search imposes no constraint.
 */
export function filterBooks(books: Book[], statusFilter: StatusFilter, search: string): Book[] {
  const query = search.trim().toLowerCase();

  return books.filter((book) => {
    if (statusFilter !== "all" && book.status !== statusFilter) {
      return false;
    }
    if (query === "") {
      return true;
    }
    return book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
  });
}
