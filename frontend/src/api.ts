import type { Book, Status } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string = "error", status: number = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Resolves the backend base URL lazily from `VITE_API_BASE_URL` and falls back
 * to the local backend default. A trailing slash is normalised away so route
 * paths can be appended verbatim.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const base = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, "");
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = "error";
  let message = `Anfrage fehlgeschlagen (Status ${response.status})`;
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error?: unknown }).error;
      if (error && typeof error === "object") {
        const typed = error as { code?: unknown; message?: unknown };
        if (typeof typed.code === "string") code = typed.code;
        if (typeof typed.message === "string") message = typed.message;
      }
    }
  } catch {
    // A non-JSON body keeps the defaults above.
  }
  return new ApiError(message, code, response.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, init);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Netzwerkfehler";
    throw new ApiError(message, "network_error", 0);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function listBooks(): Promise<Book[]> {
  const data = await request<{ books: Book[] }>("/api/books", { method: "GET" });
  return data.books ?? [];
}

export async function createBook(title: string, author: string): Promise<Book> {
  return request<Book>("/api/books", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, author }),
  });
}

export async function updateBook(id: string, title: string, author: string): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, author }),
  });
}

export async function setStatus(id: string, status: Status): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ status }),
  });
}

export async function setRating(id: string, rating: number | null): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(id)}/rating`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ rating }),
  });
}

export async function deleteBook(id: string): Promise<void> {
  return request<void>(`/api/books/${encodeURIComponent(id)}`, { method: "DELETE" });
}
