import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as api from "../api";
import { filterBooks } from "../lib/filter";
import type { Book, StatusFilter } from "../types";

export interface BooksContextValue {
  books: Book[];
  visibleBooks: Book[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  search: string;
  setSearch: (search: string) => void;
}

const BooksContext = createContext<BooksContextValue | undefined>(undefined);

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState<string>("");

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await api.listBooks();
      setBooks(loaded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Bücher konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleBooks = useMemo(
    () => filterBooks(books, statusFilter, search),
    [books, statusFilter, search],
  );

  const value = useMemo<BooksContextValue>(
    () => ({
      books,
      visibleBooks,
      loading,
      error,
      refresh,
      statusFilter,
      setStatusFilter,
      search,
      setSearch,
    }),
    [books, visibleBooks, loading, error, refresh, statusFilter, search],
  );

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks(): BooksContextValue {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error("useBooks must be used within a BooksProvider");
  }
  return context;
}
