import type { Book } from "../types";

/**
 * Counts the books marked as read within the calendar year of `now`.
 * A book counts when it has a non-null `finishedAt` whose UTC year equals
 * `now`'s UTC year. Books without a completion date never count.
 */
export function countReadThisYear(books: Book[], now: Date): number {
  const year = now.getUTCFullYear();
  return books.filter((book) => {
    if (book.finishedAt === null) {
      return false;
    }
    const finished = new Date(book.finishedAt);
    if (Number.isNaN(finished.getTime())) {
      return false;
    }
    return finished.getUTCFullYear() === year;
  }).length;
}
