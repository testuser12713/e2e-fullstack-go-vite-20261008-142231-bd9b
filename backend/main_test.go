package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

// newTestStore builds a store whose file lives in the test's temp directory and
// loads it. When content is non-empty it is written first, simulating an
// existing books file.
func newTestStore(t *testing.T, content string) *Store {
	t.Helper()

	path := filepath.Join(t.TempDir(), "books.json")
	if content != "" {
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatalf("write books file: %v", err)
		}
	}

	store := NewStore(path)
	if err := store.Load(); err != nil {
		t.Fatalf("load store: %v", err)
	}
	return store
}

func doRequest(t *testing.T, store *Store, method, target, origin string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, target, nil)
	if origin != "" {
		req.Header.Set("Origin", origin)
	}
	rec := httptest.NewRecorder()
	newRouter(store).ServeHTTP(rec, req)
	return rec
}

func TestHealthReturnsOK(t *testing.T) {
	rec := doRequest(t, newTestStore(t, ""), http.MethodGet, "/api/health", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/health status = %d, want 200", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode health body: %v (body=%q)", err, rec.Body.String())
	}
	if body["status"] != "ok" {
		t.Fatalf("health status field = %q, want %q", body["status"], "ok")
	}
}

func TestListBooksEmptyWhenFileMissing(t *testing.T) {
	rec := doRequest(t, newTestStore(t, ""), http.MethodGet, "/api/books", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/books status = %d, want 200", rec.Code)
	}

	var body struct {
		Books []Book `json:"books"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode list body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Books == nil {
		t.Fatalf("books field must be an empty array, got null (body=%q)", rec.Body.String())
	}
	if len(body.Books) != 0 {
		t.Fatalf("books length = %d, want 0", len(body.Books))
	}
}

func TestListBooksFromPrewrittenFile(t *testing.T) {
	content := `[
		{"id":"1","title":"Dune","author":"Frank Herbert","status":"reading","rating":5,"finishedAt":null},
		{"id":"2","title":"1984","author":"George Orwell","status":"planned","rating":null,"finishedAt":null}
	]`
	rec := doRequest(t, newTestStore(t, content), http.MethodGet, "/api/books", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /api/books status = %d, want 200", rec.Code)
	}

	var body struct {
		Books []Book `json:"books"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode list body: %v (body=%q)", err, rec.Body.String())
	}
	if len(body.Books) != 2 {
		t.Fatalf("books length = %d, want 2 (body=%q)", len(body.Books), rec.Body.String())
	}
	if body.Books[0].Title != "Dune" || body.Books[1].Author != "George Orwell" {
		t.Fatalf("unexpected book contents: %+v", body.Books)
	}
}

func TestCORSHeadersOnPreflight(t *testing.T) {
	req := httptest.NewRequest(http.MethodOptions, "/api/books", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	rec := httptest.NewRecorder()
	newRouter(newTestStore(t, "")).ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want http://localhost:5173", got)
	}
}

func TestCORSHeaderOnActualRequest(t *testing.T) {
	rec := doRequest(t, newTestStore(t, ""), http.MethodGet, "/api/books", "http://localhost:5173")

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want http://localhost:5173", got)
	}
}
