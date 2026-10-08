package main

import "net/http"

// setBookStatus handles PUT /api/books/{id}/status. The behaviour is implemented
// by the ticket "Implement changing the read status
// (PUT /api/books/{id}/status)"; this scaffold only declares the route and
// answers 501 until it lands.
func setBookStatus(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotImplemented, "not_implemented", "PUT /api/books/{id}/status is not implemented yet")
	}
}
