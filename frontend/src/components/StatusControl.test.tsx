import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api";
import { BooksProvider } from "../state/BooksContext";
import type { Book } from "../types";
import { StatusControl } from "./StatusControl";

vi.mock("../api", () => ({
  listBooks: vi.fn(async () => []),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  setStatus: vi.fn(),
  setRating: vi.fn(),
  deleteBook: vi.fn(),
}));

const setStatusMock = vi.mocked(api.setStatus);
const listBooksMock = vi.mocked(api.listBooks);

const BOOK: Book = {
  id: "b1",
  title: "Der Process",
  author: "Franz Kafka",
  status: "planned",
  rating: null,
  finishedAt: null,
};

function renderControl(props: { book?: Book; variant?: "chip" | "select" } = {}) {
  return render(
    <BooksProvider>
      <StatusControl book={props.book ?? BOOK} variant={props.variant} />
    </BooksProvider>,
  );
}

function combo(): HTMLSelectElement {
  return screen.getByRole("combobox") as HTMLSelectElement;
}

describe("StatusControl", () => {
  beforeEach(() => {
    setStatusMock.mockReset();
    listBooksMock.mockReset();
    listBooksMock.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("offers exactly the three German status labels", () => {
    renderControl();

    const labels = screen.getAllByRole("option").map((o) => o.textContent);
    expect(labels).toEqual(["Geplant", "Lese gerade", "Gelesen"]);
    expect(combo().value).toBe("planned");
  });

  it("changes the status through api.setStatus and then refreshes", async () => {
    setStatusMock.mockResolvedValue({ ...BOOK, status: "reading" });
    renderControl();
    const callsBefore = listBooksMock.mock.calls.length;

    fireEvent.change(combo(), { target: { value: "reading" } });

    await waitFor(() => expect(setStatusMock).toHaveBeenCalledWith("b1", "reading"));
    await waitFor(() => expect(listBooksMock.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("disables the control while the request is in flight", async () => {
    let resolveRequest: (value: Book) => void = () => undefined;
    setStatusMock.mockImplementation(
      () =>
        new Promise<Book>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderControl();

    fireEvent.change(combo(), { target: { value: "read" } });

    await waitFor(() => expect(combo().disabled).toBe(true));
    resolveRequest({ ...BOOK, status: "read" });
    await waitFor(() => expect(combo().disabled).toBe(false));
  });

  it("reverts the selection and shows a short message when the call fails", async () => {
    setStatusMock.mockRejectedValue(new Error("Status konnte nicht geändert werden."));
    renderControl();

    fireEvent.change(combo(), { target: { value: "reading" } });

    await waitFor(() =>
      expect(screen.getByText("Status konnte nicht geändert werden.")).toBeTruthy(),
    );
    expect(combo().value).toBe("planned");
  });

  it("renders the modal select variant with the same three labels", () => {
    renderControl({ variant: "select" });

    const labels = screen.getAllByRole("option").map((o) => o.textContent);
    expect(labels).toEqual(["Geplant", "Lese gerade", "Gelesen"]);
    expect(combo().value).toBe("planned");
  });
});
