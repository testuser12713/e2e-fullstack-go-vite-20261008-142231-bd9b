package main

import "net/http"

// deleteBook handles DELETE /api/books/{id}. The behaviour is implemented by the
// ticket "Implement deleting books (DELETE /api/books/{id})"; this scaffold only
// declares the route and answers 501 until it lands.
func deleteBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotImplemented, "not_implemented", "DELETE /api/books/{id} is not implemented yet")
	}
}
