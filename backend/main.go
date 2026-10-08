package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

const defaultBooksFile = "data/books.json"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	booksFile := os.Getenv("BOOKS_FILE")
	if booksFile == "" {
		booksFile = defaultBooksFile
	}

	store := NewStore(booksFile)
	if err := store.Load(); err != nil {
		log.Fatalf("could not load books file %q: %v", booksFile, err)
	}

	log.Printf("listening on :%s (books file: %s)", port, booksFile)
	if err := http.ListenAndServe(":"+port, newRouter(store)); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

// newRouter wires every route of the API and wraps it in the CORS middleware.
func newRouter(store *Store) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", handleHealth)
	mux.HandleFunc("GET /api/books", handleListBooks(store))
	mux.HandleFunc("POST /api/books", createBook(store))
	mux.HandleFunc("PUT /api/books/{id}", updateBook(store))
	mux.HandleFunc("PUT /api/books/{id}/status", setBookStatus(store))
	mux.HandleFunc("PUT /api/books/{id}/rating", setBookRating(store))
	mux.HandleFunc("DELETE /api/books/{id}", deleteBook(store))
	return corsMiddleware(mux)
}

// handleHealth reports liveness. It touches no state so it stays cheap and
// always answers as long as the process serves requests.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleListBooks returns every stored book inside the {"books":[...]} envelope.
func handleListBooks(store *Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string][]Book{"books": store.List()})
	}
}

// corsMiddleware allows the Vite dev server origin, including the OPTIONS
// preflight, so the browser may call the API from http://localhost:5173. The
// allowed origin is read once per request from FRONTEND_ORIGIN and falls back to
// the documented dev default.
func corsMiddleware(next http.Handler) http.Handler {
	allowedOrigin := os.Getenv("FRONTEND_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:5173"
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Origin") == allowedOrigin {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", allowedOrigin)
			h.Set("Vary", "Origin")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Content-Type")
			h.Set("Access-Control-Max-Age", "86400")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// writeJSON writes payload as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

// writeError writes the uniform error body with the given status code.
func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, ErrorBody{Error: ErrorDetail{Code: code, Message: message}})
}
