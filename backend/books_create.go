package main

import "net/http"

// createBook handles POST /api/books. The behaviour is implemented by the
// ticket "Implement creating books (POST /api/books)"; this scaffold only
// declares the route and answers 501 until it lands.
func createBook(s *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotImplemented, "not_implemented", "POST /api/books is not implemented yet")
	}
}
