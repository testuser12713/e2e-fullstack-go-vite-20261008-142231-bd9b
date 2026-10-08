import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BooksContextValue } from "../state/BooksContext";
import type { Book } from "../types";

const useBooksMock = vi.hoisted(() => vi.fn<() => BooksContextValue>());

vi.mock("../state/BooksContext", () => ({
  useBooks: useBooksMock,
}));

import { BookList } from "./BookList";

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "1",
    title: "Der Process",
    author: "Franz Kafka",
    status: "read",
    rating: 4,
    finishedAt: "2025-03-07T00:00:00Z",
    ...overrides,
  };
}

function contextValue(overrides: Partial<BooksContextValue> = {}): BooksContextValue {
  return {
    books: [],
    visibleBooks: [],
    loading: false,
    error: null,
    refresh: vi.fn(async () => {}),
    statusFilter: "all",
    setStatusFilter: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  useBooksMock.mockReset();
});

describe("BookList loading", () => {
  it("shows three skeleton rows while loading", () => {
    useBooksMock.mockReturnValue(contextValue({ loading: true }));

    const { container } = render(<BookList />);

    expect(container.querySelectorAll(".skeleton-row")).toHaveLength(3);
  });
});

describe("BookList rows", () => {
  it("renders title, author, status, rating and reading date per book", () => {
    const book = makeBook();
    useBooksMock.mockReturnValue(contextValue({ books: [book], visibleBooks: [book] }));

    render(<BookList />);

    expect(screen.getByText("Der Process")).toBeDefined();
    expect(screen.getByText("Franz Kafka")).toBeDefined();
    expect(screen.getByText("Gelesen")).toBeDefined();
    expect(screen.getByText("07.03.2025")).toBeDefined();
    expect(screen.getByRole("img", { name: "4 von 5 Sternen" })).toBeDefined();
  });

  it("renders the en dash when no reading date is set", () => {
    const book = makeBook({ finishedAt: null });
    useBooksMock.mockReturnValue(contextValue({ books: [book], visibleBooks: [book] }));

    render(<BookList />);

    expect(screen.getByText("\u2013")).toBeDefined();
  });
});

describe("BookList empty states", () => {
  it("shows the no-books hint when the list is empty", () => {
    useBooksMock.mockReturnValue(contextValue({ books: [] }));

    render(<BookList />);

    expect(screen.getByText("Noch keine Bücher")).toBeDefined();
    expect(screen.getByText("Lege dein erstes Buch mit Titel und Autor an.")).toBeDefined();
  });

  it("shows no-matches with the active filters and resets them", () => {
    const setSearch = vi.fn();
    const setStatusFilter = vi.fn();
    const book = makeBook();
    useBooksMock.mockReturnValue(
      contextValue({
        books: [book],
        visibleBooks: [],
        statusFilter: "planned",
        search: "kafka",
        setSearch,
        setStatusFilter,
      }),
    );

    render(<BookList />);

    expect(screen.getByText("Keine Treffer")).toBeDefined();
    expect(screen.getByText(/Status: Geplant/)).toBeDefined();
    expect(screen.getByText(/kafka/)).toBeDefined();

    fireEvent.click(screen.getByText("Filter zurücksetzen"));

    expect(setStatusFilter).toHaveBeenCalledWith("all");
    expect(setSearch).toHaveBeenCalledWith("");
  });
});

describe("BookList error banner", () => {
  it("shows the error and retries via refresh", () => {
    const refresh = vi.fn(async () => {});
    const book = makeBook();
    useBooksMock.mockReturnValue(
      contextValue({ books: [book], visibleBooks: [book], error: "Laden fehlgeschlagen", refresh }),
    );

    render(<BookList />);

    expect(screen.getByText("Laden fehlgeschlagen")).toBeDefined();
    fireEvent.click(screen.getByText("Erneut versuchen"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
