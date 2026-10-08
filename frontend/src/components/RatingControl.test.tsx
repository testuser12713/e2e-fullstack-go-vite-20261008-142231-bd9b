import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "../types";
import { RatingControl, ReadOnlyRating, ratingText } from "./RatingControl";

const mocks = vi.hoisted(() => ({
  setRating: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("../api", () => ({ setRating: mocks.setRating }));
vi.mock("../state/BooksContext", () => ({
  useBooks: () => ({ refresh: mocks.refresh }),
}));

const baseBook: Book = {
  id: "b1",
  title: "Der Process",
  author: "Franz Kafka",
  status: "planned",
  rating: null,
  finishedAt: null,
};

beforeEach(() => {
  mocks.setRating.mockReset();
  mocks.refresh.mockReset();
  mocks.setRating.mockResolvedValue(baseBook);
  mocks.refresh.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("ratingText", () => {
  it("names the value or the unrated state", () => {
    expect(ratingText(4)).toBe("4 von 5 Sternen");
    expect(ratingText(null)).toBe("Nicht bewertet");
  });
});

describe("RatingControl", () => {
  it("sets the rating to N and refreshes when star N is clicked", async () => {
    render(<RatingControl book={baseBook} />);
    const stars = screen.getAllByRole("radio") as HTMLButtonElement[];
    expect(stars).toHaveLength(5);

    fireEvent.click(stars[3]);

    await waitFor(() => expect(mocks.setRating).toHaveBeenCalledWith("b1", 4));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("clears the rating when the star that already is the rating is clicked", async () => {
    const rated: Book = { ...baseBook, rating: 4 };
    mocks.setRating.mockResolvedValue({ ...rated, rating: null });
    render(<RatingControl book={rated} />);

    fireEvent.click(screen.getAllByRole("radio")[3]);

    await waitFor(() => expect(mocks.setRating).toHaveBeenCalledWith("b1", null));
  });

  it("is disabled while a request is in flight", async () => {
    let resolveRequest!: (book: Book) => void;
    mocks.setRating.mockImplementation(
      () =>
        new Promise<Book>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<RatingControl book={baseBook} />);

    fireEvent.click(screen.getAllByRole("radio")[3]);

    await waitFor(() =>
      expect((screen.getAllByRole("radio")[0] as HTMLButtonElement).disabled).toBe(true),
    );

    await act(async () => {
      resolveRequest(baseBook);
    });

    await waitFor(() =>
      expect((screen.getAllByRole("radio")[0] as HTMLButtonElement).disabled).toBe(false),
    );
  });

  it("moves focus between stars with arrow keys", () => {
    render(<RatingControl book={baseBook} />);
    const stars = screen.getAllByRole("radio") as HTMLButtonElement[];

    stars[0].focus();
    fireEvent.keyDown(stars[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(stars[1]);

    fireEvent.keyDown(stars[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(stars[0]);
  });

  it("surfaces a failed write instead of throwing", async () => {
    mocks.setRating.mockRejectedValue(new Error("kaputt"));
    render(<RatingControl book={baseBook} />);

    fireEvent.click(screen.getAllByRole("radio")[2]);

    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("ReadOnlyRating", () => {
  it("exposes the rating as text for screen readers", () => {
    render(<ReadOnlyRating book={{ ...baseBook, rating: 4 }} />);
    expect(screen.getByRole("img", { name: "4 von 5 Sternen" })).toBeTruthy();
  });

  it("names an unrated book instead of leaving it visual-only", () => {
    render(<ReadOnlyRating book={baseBook} />);
    expect(screen.getByRole("img", { name: "Nicht bewertet" })).toBeTruthy();
  });
});
