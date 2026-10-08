package main

import "net/http"

// deleteBook handles DELETE /api/books/{id}. It removes the book with the id
// from the path, persists the store atomically and answers 204 with an empty
// body. An unknown id answers 404 with the uniform error body.
func deleteBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		s.mu.Lock()
		idx, _ := s.findLocked(id)
		if idx < 0 {
			s.mu.Unlock()
			writeError(w, http.StatusNotFound, "not_found", "book not found")
			return
		}

		s.books = append(s.books[:idx], s.books[idx+1:]...)
		if err := s.save(); err != nil {
			s.mu.Unlock()
			writeError(w, http.StatusInternalServerError, "internal_error", "could not persist books")
			return
		}
		s.mu.Unlock()

		w.WriteHeader(http.StatusNoContent)
	}
}
