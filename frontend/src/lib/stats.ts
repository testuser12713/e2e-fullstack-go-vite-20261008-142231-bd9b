import type { Book } from "../types";

/**
 * Counts the books marked as read within the calendar year of `now`.
 * This is filled by the "Add the yearly reading statistics" ticket; until then
 * it returns 0.
 */
export function countReadThisYear(_books: Book[], _now: Date): number {
  return 0;
}
