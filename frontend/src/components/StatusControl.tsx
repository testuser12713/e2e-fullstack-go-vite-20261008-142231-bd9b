import type { Book } from "../types";

export interface StatusControlProps {
  book: Book;
}

/**
 * Per-book status control — filled by the "Add the per-book status control"
 * ticket.
 */
export function StatusControl(_props: StatusControlProps) {
  return null;
}
