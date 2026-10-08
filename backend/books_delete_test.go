package main

import (
	"encoding/json"
	"net/http"
	"os"
	"testing"
)

const deleteTestContent = `[
	{"id":"1","title":"Dune","author":"Frank Herbert","status":"reading","rating":5,"finishedAt":null},
	{"id":"2","title":"1984","author":"George Orwell","status":"planned","rating":null,"finishedAt":null}
]`

func TestDeleteBookRemovesFromStoreAndFile(t *testing.T) {
	store := newTestStore(t, deleteTestContent)

	rec := doRequest(t, store, http.MethodDelete, "/api/books/1", "")

	if rec.Code != http.StatusNoContent {
		t.Fatalf("DELETE /api/books/1 status = %d, want 204 (body=%q)", rec.Code, rec.Body.String())
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("DELETE response body = %q, want empty", rec.Body.String())
	}

	books := store.List()
	if len(books) != 1 {
		t.Fatalf("store has %d books after delete, want 1", len(books))
	}
	if books[0].ID != "2" {
		t.Fatalf("remaining book id = %q, want %q", books[0].ID, "2")
	}

	data, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}
	var persisted []Book
	if err := json.Unmarshal(data, &persisted); err != nil {
		t.Fatalf("decode books file: %v (data=%q)", err, data)
	}
	if len(persisted) != 1 || persisted[0].ID != "2" {
		t.Fatalf("persisted books = %+v, want only id 2", persisted)
	}
}

func TestDeleteBookUnknownIDReturnsNotFound(t *testing.T) {
	store := newTestStore(t, deleteTestContent)

	rec := doRequest(t, store, http.MethodDelete, "/api/books/does-not-exist", "")

	if rec.Code != http.StatusNotFound {
		t.Fatalf("DELETE unknown id status = %d, want 404 (body=%q)", rec.Code, rec.Body.String())
	}

	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Error.Code != "not_found" {
		t.Fatalf("error code = %q, want %q", body.Error.Code, "not_found")
	}

	if books := store.List(); len(books) != 2 {
		t.Fatalf("store has %d books after failed delete, want 2", len(books))
	}
}
