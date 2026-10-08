import { describe, expect, it } from "vitest";
import { filterBooks } from "./filter";
import type { Book } from "../types";

function book(data: Pick<Book, "id" | "title" | "author" | "status">): Book {
  return { ...data, rating: null, finishedAt: null };
}

const kafka = book({ id: "1", title: "Der Process", author: "Franz Kafka", status: "read" });
const hesse = book({
  id: "2",
  title: "Der Steppenwolf",
  author: "Hermann Hesse",
  status: "reading",
});
const grass = book({
  id: "3",
  title: "Die Blechtrommel",
  author: "Günter Grass",
  status: "planned",
});
const books: Book[] = [kafka, hesse, grass];

describe("filterBooks", () => {
  it("returns every book for the 'all' filter and an empty search", () => {
    expect(filterBooks(books, "all", "")).toEqual(books);
  });

  it("filters by status only", () => {
    expect(filterBooks(books, "read", "")).toEqual([kafka]);
    expect(filterBooks(books, "planned", "")).toEqual([grass]);
  });

  it("filters by search over the title only", () => {
    expect(filterBooks(books, "all", "Process")).toEqual([kafka]);
  });

  it("filters by search over the author only", () => {
    expect(filterBooks(books, "all", "Hesse")).toEqual([hesse]);
  });

  it("combines a status filter and a search term", () => {
    expect(filterBooks(books, "read", "Kafka")).toEqual([kafka]);
    expect(filterBooks(books, "planned", "Kafka")).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterBooks(books, "all", "Tolstoi")).toEqual([]);
  });

  it("matches case-insensitively", () => {
    expect(filterBooks(books, "all", "pROcESS")).toEqual([kafka]);
    expect(filterBooks(books, "all", "hErMaNn")).toEqual([hesse]);
  });

  it("ignores a whitespace-only search term", () => {
    expect(filterBooks(books, "all", "   ")).toEqual(books);
    expect(filterBooks(books, "read", "\t")).toEqual([kafka]);
  });

  it("does not mutate the input list", () => {
    const input = [...books];
    filterBooks(input, "read", "");
    expect(input).toEqual(books);
  });
});
