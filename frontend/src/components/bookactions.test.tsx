import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BookActions } from "./BookActions";
import { BooksProvider } from "../state/BooksContext";
import type { Book } from "../types";

vi.mock("../api", () => ({
  listBooks: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}));

import { deleteBook, listBooks, updateBook } from "../api";

const listBooksMock = vi.mocked(listBooks);
const updateBookMock = vi.mocked(updateBook);
const deleteBookMock = vi.mocked(deleteBook);

const book: Book = {
  id: "1",
  title: "Der Process",
  author: "Franz Kafka",
  status: "reading",
  rating: 4,
  finishedAt: null,
};

function renderActions() {
  return render(
    <BooksProvider>
      <BookActions book={book} />
    </BooksProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listBooksMock.mockResolvedValue([]);
  updateBookMock.mockResolvedValue(book);
  deleteBookMock.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("BookActions", () => {
  it("renders edit and delete actions labelled with the book title", async () => {
    renderActions();

    expect(screen.getByRole("button", { name: "Buch bearbeiten: Der Process" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buch löschen: Der Process" })).toBeTruthy();
  });

  it("opens the edit dialog with the current title and author prefilled", async () => {
    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Buch bearbeiten: Der Process" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Buch bearbeiten");
    expect((screen.getByLabelText("Titel") as HTMLInputElement).value).toBe("Der Process");
    expect((screen.getByLabelText("Autor") as HTMLInputElement).value).toBe("Franz Kafka");
  });

  it("flags both empty fields on submit and does not send a request", async () => {
    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Buch bearbeiten: Der Process" }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Autor"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    expect(await screen.findByText("Titel ist erforderlich.")).toBeTruthy();
    expect(screen.getByText("Autor ist erforderlich.")).toBeTruthy();
    expect(updateBookMock).not.toHaveBeenCalled();
  });

  it("saves trimmed values, refreshes and closes on success", async () => {
    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Buch bearbeiten: Der Process" }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "  Der Prozess  " } });
    fireEvent.change(screen.getByLabelText("Autor"), { target: { value: "Kafka" } });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(updateBookMock).toHaveBeenCalledWith("1", "Der Prozess", "Kafka");
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(listBooksMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("asks for confirmation before deleting and removes the book on confirm", async () => {
    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Buch löschen: Der Process" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Buch löschen?")).toBeTruthy();
    expect(deleteBookMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    await waitFor(() => {
      expect(deleteBookMock).toHaveBeenCalledWith("1");
    });
  });

  it("closes the edit dialog on Escape and returns focus to the row action", async () => {
    renderActions();

    const trigger = screen.getByRole("button", { name: "Buch bearbeiten: Der Process" });
    fireEvent.click(trigger);
    await screen.findByRole("dialog");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
