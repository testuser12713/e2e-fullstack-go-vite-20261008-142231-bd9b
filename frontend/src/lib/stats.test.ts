import { describe, expect, it } from "vitest";
import type { Book } from "../types";
import { countReadThisYear } from "./stats";

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "1",
    title: "Der Process",
    author: "Franz Kafka",
    status: "read",
    rating: null,
    finishedAt: null,
    ...overrides,
  };
}

describe("countReadThisYear", () => {
  it("counts books finished in the current year", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const books = [
      makeBook({ id: "1", finishedAt: "2026-01-01T00:00:00Z" }),
      makeBook({ id: "2", finishedAt: "2026-12-31T23:59:59Z" }),
    ];

    expect(countReadThisYear(books, now)).toBe(2);
  });

  it("does not count books finished in another year", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const books = [makeBook({ finishedAt: "2025-06-15T12:00:00Z" })];

    expect(countReadThisYear(books, now)).toBe(0);
  });

  it("does not count a book without a finishedAt", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const books = [makeBook({ finishedAt: null })];

    expect(countReadThisYear(books, now)).toBe(0);
  });

  it("resolves the year boundary in UTC", () => {
    const now = new Date("2026-01-01T00:00:00Z");

    expect(countReadThisYear([makeBook({ finishedAt: "2025-12-31T23:59:59Z" })], now)).toBe(0);
    expect(countReadThisYear([makeBook({ finishedAt: "2026-01-01T00:00:00Z" })], now)).toBe(1);
  });
});
