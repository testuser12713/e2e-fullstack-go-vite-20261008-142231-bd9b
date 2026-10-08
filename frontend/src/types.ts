export type Status = "planned" | "reading" | "read";

export type StatusFilter = "all" | Status;

export interface Book {
  id: string;
  title: string;
  author: string;
  status: Status;
  rating: number | null;
  finishedAt: string | null;
}
