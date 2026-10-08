import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createBook,
  deleteBook,
  getApiBaseUrl,
  listBooks,
  setRating,
} from "./api";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the local backend default", () => {
    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });

  it("uses VITE_API_BASE_URL and strips a trailing slash", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://example.test:9000/");
    expect(getApiBaseUrl()).toBe("http://example.test:9000");
  });
});

describe("api error mapping", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws an ApiError carrying the backend message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(400, { error: { code: "invalid_input", message: "title is required" } }),
      ),
    );

    await expect(createBook("", "")).rejects.toMatchObject({
      name: "ApiError",
      code: "invalid_input",
      message: "title is required",
      status: 400,
    });
  });

  it("wraps a network failure in an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(listBooks()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("api requests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs the books list and returns its array", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        books: [
          {
            id: "1",
            title: "Der Process",
            author: "Franz Kafka",
            status: "planned",
            rating: null,
            finishedAt: null,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const books = await listBooks();

    expect(books).toHaveLength(1);
    expect(books[0].title).toBe("Der Process");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/books",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("PUTs a rating to the book's rating route", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { id: "7", rating: 4 }));
    vi.stubGlobal("fetch", fetchMock);

    await setRating("7", 4);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/books/7/rating",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("resolves delete on 204 without reading a body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 204 } as unknown as Response)));

    await expect(deleteBook("7")).resolves.toBeUndefined();
  });
});
