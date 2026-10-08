package main

import "net/http"

// updateBook handles PUT /api/books/{id}. The behaviour is implemented by the
// ticket "Implement editing books (PUT /api/books/{id})"; this scaffold only
// declares the route and answers 501 until it lands.
func updateBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotImplemented, "not_implemented", "PUT /api/books/{id} is not implemented yet")
	}
}
