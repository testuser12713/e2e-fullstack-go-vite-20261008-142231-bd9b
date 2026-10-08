package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

// updateBook handles PUT /api/books/{id}. It decodes {title,author}, trims both,
// rejects an empty title or author with the uniform 400 invalid_input body,
// answers 404 for an unknown id and otherwise sets the new title and author on
// the existing book in place — leaving status, rating and finishedAt untouched —
// persists the store atomically and answers 200 with the updated book.
func updateBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UpdateBookRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_input", "invalid JSON body")
			return
		}

		title := strings.TrimSpace(req.Title)
		author := strings.TrimSpace(req.Author)
		if title == "" || author == "" {
			writeError(w, http.StatusBadRequest, "invalid_input", "title and author must not be empty")
			return
		}

		id := r.PathValue("id")

		s.mu.Lock()
		defer s.mu.Unlock()

		_, book := s.findLocked(id)
		if book == nil {
			writeError(w, http.StatusNotFound, "not_found", "book not found")
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
