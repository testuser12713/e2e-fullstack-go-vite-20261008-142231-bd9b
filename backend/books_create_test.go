package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// postBook sends a POST /api/books request with the given raw JSON body through
// the real router.
func postBook(t *testing.T, store *Store, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/api/books", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	newRouter(store).ServeHTTP(rec, req)
	return rec
}

func TestCreateBookValid(t *testing.T) {
	store := newTestStore(t, "")

	rec := postBook(t, store, `{"title":"  Dune  ","author":" Frank Herbert "}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("POST /api/books status = %d, want 201 (body=%q)", rec.Code, rec.Body.String())
	}

	book := decodeBook(t, rec)
	if book.ID == "" {
		t.Fatalf("created book has empty id (body=%q)", rec.Body.String())
	}
	if book.Title != "Dune" {
		t.Fatalf("title = %q, want %q (trimmed)", book.Title, "Dune")
	}
	if book.Author != "Frank Herbert" {
		t.Fatalf("author = %q, want %q (trimmed)", book.Author, "Frank Herbert")
	}
	if book.Status != StatusPlanned {
		t.Fatalf("status = %q, want %q", book.Status, StatusPlanned)
	}
	if book.Rating != nil {
		t.Fatalf("rating = %v, want null", *book.Rating)
	}
	if book.FinishedAt != nil {
		t.Fatalf("finishedAt = %v, want null", *book.FinishedAt)
	}

	stored := store.List()
	if len(stored) != 1 {
		t.Fatalf("store length = %d, want 1", len(stored))
	}
	if stored[0].ID != book.ID {
		t.Fatalf("stored id = %q, want %q", stored[0].ID, book.ID)
	}
}

func TestCreateBookGeneratesDistinctIDs(t *testing.T) {
	store := newTestStore(t, "")

	first := decodeBook(t, postBook(t, store, `{"title":"A","author":"B"}`))
	second := decodeBook(t, postBook(t, store, `{"title":"C","author":"D"}`))
	if first.ID == second.ID {
		t.Fatalf("two created books share id %q", first.ID)
	}
}

func TestCreateBookInvalidInput(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"empty title", `{"title":"","author":"Frank Herbert"}`},
		{"whitespace title", `{"title":"   ","author":"Frank Herbert"}`},
		{"empty author", `{"title":"Dune","author":""}`},
		{"whitespace author", `{"title":"Dune","author":"  "}`},
		{"both empty", `{"title":"","author":""}`},
		{"missing fields", `{}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			store := newTestStore(t, "")

			rec := postBook(t, store, tc.body)
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

			if len(store.List()) != 0 {
				t.Fatalf("store gained %d entries on invalid input, want 0", len(store.List()))
			}
		})
	}
}

func TestCreateBookInvalidJSON(t *testing.T) {
	store := newTestStore(t, "")

	rec := postBook(t, store, `{not json`)
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
}

func TestCreateBookPersistsToFile(t *testing.T) {
	store := newTestStore(t, "")

	rec := postBook(t, store, `{"title":"Dune","author":"Frank Herbert"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body=%q)", rec.Code, rec.Body.String())
	}
	created := decodeBook(t, rec)

	data, err := os.ReadFile(store.path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}

	var onDisk []Book
	if err := json.Unmarshal(data, &onDisk); err != nil {
		t.Fatalf("decode books file: %v (content=%q)", err, string(data))
	}
	if len(onDisk) != 1 {
		t.Fatalf("books file holds %d entries, want 1 (content=%q)", len(onDisk), string(data))
	}
	if onDisk[0].ID != created.ID || onDisk[0].Title != "Dune" || onDisk[0].Author != "Frank Herbert" {
		t.Fatalf("book on disk = %+v, want %+v", onDisk[0], created)
	}
}

func TestCreateBookSurvivesReload(t *testing.T) {
	store := newTestStore(t, "")

	rec := postBook(t, store, `{"title":"Dune","author":"Frank Herbert"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body=%q)", rec.Code, rec.Body.String())
	}
	created := decodeBook(t, rec)

	reloaded := NewStore(store.path)
	if err := reloaded.Load(); err != nil {
		t.Fatalf("reload store: %v", err)
	}
	books := reloaded.List()
	if len(books) != 1 {
		t.Fatalf("reloaded store holds %d books, want 1", len(books))
	}
	if books[0].ID != created.ID || books[0].Status != StatusPlanned {
		t.Fatalf("reloaded book = %+v, want id %q status %q", books[0], created.ID, StatusPlanned)
	}
}
