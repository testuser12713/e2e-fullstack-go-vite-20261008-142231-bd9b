package main

import (
	"encoding/json"
	"net/http"
	"time"
)

// setBookStatus handles PUT /api/books/{id}/status. It accepts exactly one of
// the three reading statuses. Entering "read" stamps finishedAt with the current
// UTC time; leaving "read" clears it back to null. The change is persisted
// atomically before the updated book is answered.
func setBookStatus(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req StatusRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_input", "invalid JSON body")
			return
		}

		switch req.Status {
		case StatusPlanned, StatusReading, StatusRead:
		default:
			writeError(w, http.StatusBadRequest, "invalid_input", "status must be one of planned, reading, read")
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

		if req.Status == StatusRead {
			// Only stamp the completion date on the transition into "read";
			// re-selecting "read" leaves an existing finishedAt untouched.
			if book.Status != StatusRead {
				now := time.Now().UTC().Format(time.RFC3339)
				book.FinishedAt = &now
			}
		} else {
			book.FinishedAt = nil
		}
		book.Status = req.Status

		if err := s.save(); err != nil {
			writeError(w, http.StatusInternalServerError, "internal_error", "could not persist book")
			return
		}

		writeJSON(w, http.StatusOK, *book)
	}
}
