package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

// updateBook handles PUT /api/books/{id}. It replaces the title and author of an
// existing book, persists the change atomically and answers with the updated
// book. An empty title or author is rejected with 400, an unknown id with 404.
func updateBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		var req UpdateBookRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_input", "request body must be valid JSON with title and author")
			return
		}

		title := strings.TrimSpace(req.Title)
		author := strings.TrimSpace(req.Author)
		if title == "" || author == "" {
			writeError(w, http.StatusBadRequest, "invalid_input", "title and author must not be empty")
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		_, book := s.findLocked(id)
		if book == nil {
			writeError(w, http.StatusNotFound, "not_found", "no book with id "+id)
			return
		}

		book.Title = title
		book.Author = author

		if err := s.save(); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not persist book")
			return
		}

		writeJSON(w, http.StatusOK, *book)
	}
}
