package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

// setBookRating handles PUT /api/books/{id}/rating. The body is
// {"rating": <1..5|null>}. A null clears the rating, an integer 1..5 sets it.
// Anything else (out of range, wrong type, missing field, malformed body) is
// rejected with 400 and the uniform error body. An unknown id answers 404. On
// success the updated book is returned with 200 and the store is persisted
// atomically.
func setBookRating(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		var body map[string]json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_input", "request body must be a JSON object")
			return
		}

		raw, ok := body["rating"]
		if !ok {
			writeError(w, http.StatusBadRequest, "invalid_input", "field \"rating\" is required")
			return
		}

		var rating *int
		if !bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
			var value int
			if err := json.Unmarshal(raw, &value); err != nil || value < 1 || value > 5 {
				writeError(w, http.StatusBadRequest, "invalid_input", "rating must be an integer between 1 and 5 or null")
				return
			}
			rating = &value
		}

		s.mu.Lock()
		_, book := s.findLocked(id)
		if book == nil {
			s.mu.Unlock()
			writeError(w, http.StatusNotFound, "not_found", "book not found")
			return
		}

		previous := book.Rating
		book.Rating = rating
		if err := s.save(); err != nil {
			book.Rating = previous
			s.mu.Unlock()
			writeError(w, http.StatusInternalServerError, "internal_error", "could not persist books")
			return
		}
		updated := *book
		s.mu.Unlock()

		writeJSON(w, http.StatusOK, updated)
	}
}
