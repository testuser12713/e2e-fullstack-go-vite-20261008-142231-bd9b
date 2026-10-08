package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
)

// createBook handles POST /api/books. It decodes {title,author}, trims both,
// rejects an empty title or author with the uniform 400 invalid_input body and
// otherwise appends a fresh planned book, persists it atomically and answers
// 201 with the created book.
func createBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateBookRequest
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

		id, err := newBookID()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not generate a book id")
			return
		}

		book := Book{
			ID:         id,
			Title:      title,
			Author:     author,
			Status:     StatusPlanned,
			Rating:     nil,
			FinishedAt: nil,
		}

		s.mu.Lock()
		s.books = append(s.books, book)
		if err := s.save(); err != nil {
			s.books = s.books[:len(s.books)-1]
			s.mu.Unlock()
			writeError(w, http.StatusInternalServerError, "internal_error", "could not persist the book")
			return
		}
		s.mu.Unlock()

		writeJSON(w, http.StatusCreated, book)
	}
}

// newBookID returns a fresh opaque identifier backed by 128 bits of crypto
// randomness, so ids never collide and carry no meaning.
func newBookID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
