package main

import "net/http"

// setBookRating handles PUT /api/books/{id}/rating. The behaviour is implemented
// by the ticket "Implement book ratings (PUT /api/books/{id}/rating)"; this
// scaffold only declares the route and answers 501 until it lands.
func setBookRating(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotImplemented, "not_implemented", "PUT /api/books/{id}/rating is not implemented yet")
	}
}
