package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

// ratingTestStore seeds a store with a single known book (id "b1") so the
// rating handler can be exercised without depending on the create route.
func ratingTestStore(t *testing.T) *Store {
	t.Helper()
	content := `[
		{"id":"b1","title":"Dune","author":"Frank Herbert","status":"planned","rating":null,"finishedAt":null}
	]`
	return newTestStore(t, content)
}

// putRating drives the rating handler directly and returns the recorder. The
// path value is set explicitly because httptest does not run the ServeMux
// pattern matching that normally populates it.
func putRating(t *testing.T, store *Store, id, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPut, "/api/books/"+id+"/rating", strings.NewReader(body))
	req.SetPathValue("id", id)
	rec := httptest.NewRecorder()
	setBookRating(store)(rec, req)
	return rec
}

func TestSetBookRatingTo1(t *testing.T) {
	store := ratingTestStore(t)
	rec := putRating(t, store, "b1", `{"rating":1}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	book := decodeBook(t, rec)
	if book.Rating == nil || *book.Rating != 1 {
		t.Fatalf("rating = %v, want 1", book.Rating)
	}
	if book.ID != "b1" {
		t.Fatalf("returned book id = %q, want b1", book.ID)
	}
}

func TestSetBookRatingTo5(t *testing.T) {
	store := ratingTestStore(t)
	rec := putRating(t, store, "b1", `{"rating":5}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	book := decodeBook(t, rec)
	if book.Rating == nil || *book.Rating != 5 {
		t.Fatalf("rating = %v, want 5", book.Rating)
	}
}

func TestClearBookRatingWithNull(t *testing.T) {
	content := `[
		{"id":"b1","title":"Dune","author":"Frank Herbert","status":"reading","rating":4,"finishedAt":null}
	]`
	store := newTestStore(t, content)
	rec := putRating(t, store, "b1", `{"rating":null}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}
	book := decodeBook(t, rec)
	if book.Rating != nil {
		t.Fatalf("rating = %v, want nil", *book.Rating)
	}
}

func TestSetBookRatingPersistsToFile(t *testing.T) {
	store := ratingTestStore(t)
	rec := putRating(t, store, "b1", `{"rating":4}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%q)", rec.Code, rec.Body.String())
	}

	onDisk := readBooksFile(t, store.path)
	if onDisk[0].Rating == nil || *onDisk[0].Rating != 4 {
		t.Fatalf("persisted rating = %v, want 4", onDisk[0].Rating)
	}

	clear := putRating(t, store, "b1", `{"rating":null}`)
	if clear.Code != http.StatusOK {
		t.Fatalf("clear status = %d, want 200 (body=%q)", clear.Code, clear.Body.String())
	}
	onDisk = readBooksFile(t, store.path)
	if onDisk[0].Rating != nil {
		t.Fatalf("persisted rating after clear = %v, want nil", *onDisk[0].Rating)
	}
}

func TestSetBookRatingRejectsOutOfRange(t *testing.T) {
	for _, body := range []string{`{"rating":0}`, `{"rating":6}`, `{"rating":-1}`, `{"rating":100}`} {
		t.Run(body, func(t *testing.T) {
			store := ratingTestStore(t)
			rec := putRating(t, store, "b1", body)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
			}
			assertUniformError(t, rec, "invalid_input")
		})
	}
}

func TestSetBookRatingRejectsMissingField(t *testing.T) {
	store := ratingTestStore(t)
	rec := putRating(t, store, "b1", `{}`)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
	}
	assertUniformError(t, rec, "invalid_input")
}

func TestSetBookRatingRejectsWrongType(t *testing.T) {
	for _, body := range []string{`{"rating":"4"}`, `{"rating":4.5}`, `{"rating":true}`, `not json`} {
		t.Run(body, func(t *testing.T) {
			store := ratingTestStore(t)
			rec := putRating(t, store, "b1", body)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body=%q)", rec.Code, rec.Body.String())
			}
			assertUniformError(t, rec, "invalid_input")
		})
	}
}

func TestSetBookRatingUnknownID(t *testing.T) {
	store := ratingTestStore(t)
	rec := putRating(t, store, "missing", `{"rating":3}`)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (body=%q)", rec.Code, rec.Body.String())
	}
	assertUniformError(t, rec, "not_found")
}

func readBooksFile(t *testing.T, path string) []Book {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read books file: %v", err)
	}
	var books []Book
	if err := json.Unmarshal(data, &books); err != nil {
		t.Fatalf("decode books file: %v (data=%q)", err, string(data))
	}
	return books
}

func assertUniformError(t *testing.T, rec *httptest.ResponseRecorder, wantCode string) {
	t.Helper()
	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error body: %v (body=%q)", err, rec.Body.String())
	}
	if body.Error.Code != wantCode {
		t.Fatalf("error code = %q, want %q", body.Error.Code, wantCode)
	}
	if body.Error.Message == "" {
		t.Fatalf("error message must not be empty")
	}
}
