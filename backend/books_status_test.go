package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// statusRequest issues a PUT /api/books/{id}/status with the given status value
// as its JSON body.
func statusRequest(t *testing.T, store *Store, id, status string) *httptest.ResponseRecorder {
	t.Helper()

	body := `{"status":"` + status + `"}`
	req := httptest.NewRequest(http.MethodPut, "/api/books/"+id+"/status", strings.NewReader(body))
	rec := httptest.NewRecorder()
	newRouter(store).ServeHTTP(rec, req)
	return rec
}

func decodeBook(t *testing.T, rec *httptest.ResponseRecorder) Book {
	t.Helper()

	var book Book
	if err := json.Unmarshal(rec.Body.Bytes(), &book); err != nil {
		t.Fatalf("decode book body: %v (body=%q)", err, rec.Body.String())
	}
	return book
}

func TestSetStatusReadStoresFinishedAt(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"reading","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := statusRequest(t, store, "1", StatusRead)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT status status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}

	book := decodeBook(t, rec)
	if book.Status != StatusRead {
		t.Fatalf("status = %q, want %q", book.Status, StatusRead)
	}
	if book.FinishedAt == nil {
		t.Fatalf("finishedAt must be set when a book becomes %q", StatusRead)
	}
	parsed, err := time.Parse(time.RFC3339, *book.FinishedAt)
	if err != nil {
		t.Fatalf("finishedAt %q is not RFC3339: %v", *book.FinishedAt, err)
	}
	if _, offset := parsed.Zone(); offset != 0 {
		t.Fatalf("finishedAt %q is not in UTC (offset %d)", *book.FinishedAt, offset)
	}
}

func TestSetStatusReadPersistsAcrossReload(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := statusRequest(t, store, "1", StatusRead)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT status status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	written := decodeBook(t, rec)
	if written.FinishedAt == nil {
		t.Fatalf("finishedAt must be set when a book becomes %q", StatusRead)
	}

	reloaded := NewStore(store.path)
	if err := reloaded.Load(); err != nil {
		t.Fatalf("reload store: %v", err)
	}
	books := reloaded.List()
	if len(books) != 1 {
		t.Fatalf("reloaded books length = %d, want 1", len(books))
	}
	if books[0].Status != StatusRead {
		t.Fatalf("reloaded status = %q, want %q", books[0].Status, StatusRead)
	}
	if books[0].FinishedAt == nil {
		t.Fatalf("reloaded finishedAt must still be set")
	}
	if *books[0].FinishedAt != *written.FinishedAt {
		t.Fatalf("reloaded finishedAt = %q, want %q", *books[0].FinishedAt, *written.FinishedAt)
	}
}

func TestSetStatusLeavingReadClearsFinishedAt(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"read","rating":null,"finishedAt":"2026-01-02T03:04:05Z"}]`
	store := newTestStore(t, content)

	rec := statusRequest(t, store, "1", StatusPlanned)
	if rec.Code != http.StatusOK {
		t.Fatalf("PUT status status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	book := decodeBook(t, rec)
	if book.Status != StatusPlanned {
		t.Fatalf("status = %q, want %q", book.Status, StatusPlanned)
	}
	if book.FinishedAt != nil {
		t.Fatalf("finishedAt must be cleared when a book leaves %q, got %q", StatusRead, *book.FinishedAt)
	}

	reloaded := NewStore(store.path)
	if err := reloaded.Load(); err != nil {
		t.Fatalf("reload store: %v", err)
	}
	books := reloaded.List()
	if len(books) != 1 {
		t.Fatalf("reloaded books length = %d, want 1", len(books))
	}
	if books[0].FinishedAt != nil {
		t.Fatalf("reloaded finishedAt must be cleared, got %q", *books[0].FinishedAt)
	}
}

func TestSetStatusInvalidValueReturns400(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := statusRequest(t, store, "1", "done")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("invalid status code = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
	}

	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Error.Code != "invalid_input" {
		t.Fatalf("error code = %q, want %q", body.Error.Code, "invalid_input")
	}

	books := store.List()
	if books[0].Status != StatusPlanned {
		t.Fatalf("invalid status must not change the book, got status %q", books[0].Status)
	}
}

func TestSetStatusUnknownIDReturns404(t *testing.T) {
	content := `[{"id":"1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}]`
	store := newTestStore(t, content)

	rec := statusRequest(t, store, "does-not-exist", StatusRead)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("unknown id code = %d, want 404 (body=%q)", rec.Code, rec.Body.String())
	}

	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Error.Code != "not_found" {
		t.Fatalf("error code = %q, want %q", body.Error.Code, "not_found")
	}
}
