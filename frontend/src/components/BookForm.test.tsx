import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../types";
import * as api from "../api";
import { BooksProvider } from "../state/BooksContext";
import { BookForm } from "./BookForm";

vi.mock("../api", () => ({
  ApiError: class ApiError extends Error {},
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
  listBooks: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  setStatus: vi.fn(),
  setRating: vi.fn(),
  deleteBook: vi.fn(),
}));

const mocked = vi.mocked(api);

const createdBook: Book = {
  id: "42",
  title: "Der Zauberberg",
  author: "Thomas Mann",
  status: "planned",
  rating: null,
  finishedAt: null,
};

function renderForm() {
  return render(
    <BooksProvider>
      <BookForm />
    </BooksProvider>,
  );
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Speichern" }) as HTMLButtonElement;
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listBooks.mockResolvedValue([]);
  mocked.createBook.mockResolvedValue(createdBook);
  mocked.setStatus.mockResolvedValue(createdBook);
});

describe("BookForm", () => {
  it("starts neutral with the submit button disabled", async () => {
    renderForm();

    expect(screen.queryByText("Titel ist erforderlich.")).toBeNull();
    expect(screen.queryByText("Autor ist erforderlich.")).toBeNull();
    expect(submitButton().disabled).toBe(true);

    await waitFor(() => expect(mocked.listBooks).toHaveBeenCalled());
  });

  it("shows a message per empty field on submit without calling the API", async () => {
    const { container } = renderForm();
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByText("Titel ist erforderlich.")).toBeTruthy();
    expect(screen.getByText("Autor ist erforderlich.")).toBeTruthy();
    expect(mocked.createBook).not.toHaveBeenCalled();
  });

  it("creates the book, refreshes the list, clears the fields and shows a hint", async () => {
    renderForm();
    await waitFor(() => expect(mocked.listBooks).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Titel"), {
      target: { value: "  Der Zauberberg  " },
    });
    fireEvent.change(screen.getByLabelText("Autor"), { target: { value: "Thomas Mann" } });

    expect(submitButton().disabled).toBe(false);
    fireEvent.click(submitButton());

    await waitFor(() => expect(mocked.createBook).toHaveBeenCalledWith("Der Zauberberg", "Thomas Mann"));
    await waitFor(() => expect(mocked.listBooks).toHaveBeenCalledTimes(2));

    expect((screen.getByLabelText("Titel") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Autor") as HTMLInputElement).value).toBe("");
    expect(await screen.findByText("Buch angelegt.")).toBeTruthy();
  });

  it("shows the API error message and keeps the entered values on failure", async () => {
    mocked.createBook.mockRejectedValueOnce(new Error("Titel ist bereits vorhanden."));
    renderForm();

    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Der Zauberberg" } });
    fireEvent.change(screen.getByLabelText("Autor"), { target: { value: "Thomas Mann" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText("Titel ist bereits vorhanden.")).toBeTruthy();
    expect((screen.getByLabelText("Titel") as HTMLInputElement).value).toBe("Der Zauberberg");
  });
});
