import type { Book } from "../types";

export interface BookActionsProps {
  book: Book;
}

/**
 * Per-book edit and delete actions — filled by the "Add edit and delete
 * actions per book row" ticket.
 */
export function BookActions(_props: BookActionsProps) {
  return null;
}
