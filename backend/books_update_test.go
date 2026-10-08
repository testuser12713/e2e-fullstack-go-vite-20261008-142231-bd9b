package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// doJSON sends a request with a JSON body through the full router so the route
// registration and CORS wrapper are exercised too.
func doJSON(t *testing.T, store *Store, method, target, body string) *httptest.ResponseRecorder {
	t.Helper()

	var reader io.Reader
	if body != "" {
		reader = bytes.NewBufferString(body)
	}
	req := httptest.NewRequest(method, target, reader)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	newRouter(store).ServeHTTP(rec, req)
	return rec
}

func TestUpdateBookChangesTitleAndAuthor(t *testing.T) {
	content := `[
		{"id":"1","title":"Dune","author":"Frank Herbert","status":"reading","rating":5,"finishedAt":null},
		{"id":"2","title":"1984","author":"George Orwell","status":"planned","rating":null,"finishedAt":null}
	]`
	store := newTestStore(t, content)

	rec := doJSON(t, store, http.MethodPut, "/api/books/1", `{"title":"Dune Messiah","author":"Frank Herbert"}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("PUT /api/books/1 status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}

	var updated Book
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode response: %v (body=%q)", err, rec.Body.String())
	}
	if updated.ID != "1" {
		t.Fatalf("response id = %q, want %q", updated.ID, "1")
	}
	if updated.Title != "Dune Messiah" {
		t.Fatalf("response title = %q, want %q", updated.Title, "Dune Messiah")
	}
	if updated.Author != "Frank Herbert" {
		t.Fatalf("response author = %q, want %q", updated.Author, "Frank Herbert")
	}
	if updated.Status != "reading" || updated.Rating == nil || *updated.Rating != 5 {
		t.Fatalf("update must not touch status/rating, got %+v", updated)
	}

	// The change must be persisted to the JSON file on disk.
	data, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}
	var persisted []Book
	if err := json.Unmarshal(data, &persisted); err != nil {
		t.Fatalf("decode books file: %v (data=%q)", err, string(data))
	}
	if len(persisted) != 2 {
		t.Fatalf("books file length = %d, want 2", len(persisted))
	}
	if persisted[0].Title != "Dune Messiah" || persisted[0].Author != "Frank Herbert" {
		t.Fatalf("books file not updated: %+v", persisted[0])
	}
	if persisted[1].Title != "1984" {
		t.Fatalf("sibling book must be unchanged, got %+v", persisted[1])
	}
}

func TestUpdateBookTrimsValues(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := doJSON(t, store, http.MethodPut, "/api/books/1", `{"title":"  Neu  ","author":"  Autor  "}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	var updated Book
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if updated.Title != "Neu" || updated.Author != "Autor" {
		t.Fatalf("values must be trimmed, got %+v", updated)
	}
}

func TestUpdateBookRejectsEmptyField(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`

	cases := map[string]string{
		"empty title":  `{"title":"","author":"Frank Herbert"}`,
		"blank title":  `{"title":"   ","author":"Frank Herbert"}`,
		"empty author": `{"title":"Dune","author":""}`,
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			store := newTestStore(t, content)
			rec := doJSON(t, store, http.MethodPut, "/api/books/1", body)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
			}

			var errBody ErrorBody
			if err := json.Unmarshal(rec.Body.Bytes(), &errBody); err != nil {
				t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
			}
			if errBody.Error.Code != "invalid_input" {
				t.Fatalf("error code = %q, want %q", errBody.Error.Code, "invalid_input")
			}
			if errBody.Error.Message == "" {
				t.Fatalf("error message must not be empty")
			}

			// The rejected request must not have altered the file.
			data, err := os.ReadFile(store.path)
			if err != nil {
				t.Fatalf("read books file: %v", err)
			}
			var persisted []Book
			if err := json.Unmarshal(data, &persisted); err != nil {
				t.Fatalf("decode books file: %v", err)
			}
			if persisted[0].Title != "Dune" || persisted[0].Author != "Frank Herbert" {
				t.Fatalf("invalid update must not modify the book, got %+v", persisted[0])
			}
		})
	}
}

func TestUpdateBookUnknownIDReturns404(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := doJSON(t, store, http.MethodPut, "/api/books/nope", `{"title":"X","author":"Y"}`)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body=%q)", rec.Code, rec.Body.String())
	}

	var errBody ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &errBody); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if errBody.Error.Code != "not_found" {
		t.Fatalf("error code = %q, want %q", errBody.Error.Code, "not_found")
	}
}
