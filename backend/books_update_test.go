package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// putBook issues a PUT /api/books/{id} with the given raw JSON body through the
// real router.
func putBook(t *testing.T, store *Store, id, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodPut, "/api/books/"+id, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	newRouter(store).ServeHTTP(rec, req)
	return rec
}

// decodeBooksFile reads and decodes the store's backing JSON file.
func decodeBooksFile(t *testing.T, store *Store) []Book {
	t.Helper()

	data, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}
	var books []Book
	if err := json.Unmarshal(data, &books); err != nil {
		t.Fatalf("decode books file: %v (content=%q)", err, string(data))
	}
	return books
}

func TestUpdateBookValid(t *testing.T) {
	content := `[
		{"id":"1","title":"Dune","author":"Frank Herbert","status":"read","rating":5,"finishedAt":"2026-01-02T03:04:05Z"},
		{"id":"2","title":"1984","author":"George Orwell","status":"planned","rating":null,"finishedAt":null}
	]`
	store := newTestStore(t, content)

	rec := putBook(t, store, "1", `{"title":"Dune Messiah","author":"Frank Herbert"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT /api/books/{id} status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}

	book := decodeBook(t, rec)
	if book.ID != "1" {
		t.Fatalf("id = %q, want %q", book.ID, "1")
	}
	if book.Title != "Dune Messiah" || book.Author != "Frank Herbert" {
		t.Fatalf("updated title/author = %q/%q, want %q/%q", book.Title, book.Author, "Dune Messiah", "Frank Herbert")
	}
	if book.Status != StatusRead {
		t.Fatalf("status = %q, want %q (untouched)", book.Status, StatusRead)
	}
	if book.Rating == nil || *book.Rating != 5 {
		t.Fatalf("rating = %v, want 5 (untouched)", book.Rating)
	}
	if book.FinishedAt == nil || *book.FinishedAt != "2026-01-02T03:04:05Z" {
		t.Fatalf("finishedAt = %v, want 2026-01-02T03:04:05Z (untouched)", book.FinishedAt)
	}

	onDisk := decodeBooksFile(t, store)
	if len(onDisk) != 2 {
		t.Fatalf("books file holds %d entries, want 2", len(onDisk))
	}
	if onDisk[0].Title != "Dune Messiah" || onDisk[0].Author != "Frank Herbert" {
		t.Fatalf("book on disk = %+v, want updated title/author", onDisk[0])
	}
	if onDisk[0].Status != StatusRead || onDisk[0].Rating == nil || *onDisk[0].Rating != 5 {
		t.Fatalf("book on disk lost status/rating: %+v", onDisk[0])
	}
	if onDisk[0].FinishedAt == nil || *onDisk[0].FinishedAt != "2026-01-02T03:04:05Z" {
		t.Fatalf("book on disk lost finishedAt: %+v", onDisk[0])
	}

	if onDisk[1].ID != "2" || onDisk[1].Title != "1984" || onDisk[1].Author != "George Orwell" {
		t.Fatalf("sibling book changed: %+v", onDisk[1])
	}
}

func TestUpdateBookTrimsWhitespace(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := putBook(t, store, "1", `{"title":"  Dune  ","author":"  Frank Herbert  "}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}

	book := decodeBook(t, rec)
	if book.Title != "Dune" || book.Author != "Frank Herbert" {
		t.Fatalf("title/author = %q/%q, want trimmed values", book.Title, book.Author)
	}
}

func TestUpdateBookInvalidInput(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"empty title", `{"title":"","author":"Frank Herbert"}`},
		{"whitespace title", `{"title":"   ","author":"Frank Herbert"}`},
		{"empty author", `{"title":"Dune","author":""}`},
		{"whitespace author", `{"title":"Dune","author":"  "}`},
		{"missing fields", `{}`},
		{"invalid JSON", `{not json`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"reading","rating":3,"finishedAt":null}]`
			store := newTestStore(t, content)

			rec := putBook(t, store, "1", tc.body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
			}

			var body ErrorBody
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
			}
			if body.Error.Code != "invalid_input" {
				t.Fatalf("error code = %q, want %q", body.Error.Code, "invalid_input")
			}
			if body.Error.Message == "" {
				t.Fatalf("error message is empty (body=%q)", rec.Body.String())
			}

			got, err := os.ReadFile(store.path)
			if err != nil {
				t.Fatalf("read books file: %v", err)
			}
			if string(got) != content {
				t.Fatalf("books file changed on invalid input:\n got %q\nwant %q", string(got), content)
			}
		})
	}
}

func TestUpdateBookUnknownIDReturns404(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := putBook(t, store, "does-not-exist", `{"title":"New","author":"Author"}`)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("unknown id status = %d, want 404 (body=%q)", rec.Code, rec.Body.String())
	}

	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Error.Code != "not_found" {
		t.Fatalf("error code = %q, want %q", body.Error.Code, "not_found")
	}

	got, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}
	if string(got) != content {
		t.Fatalf("books file changed on unknown id:\n got %q\nwant %q", string(got), content)
	}
}
