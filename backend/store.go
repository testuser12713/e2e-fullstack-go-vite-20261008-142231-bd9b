package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Store holds the books and owns the single mutex that guards them. All file
// access goes through it; every mutation rewrites the whole file atomically.
type Store struct {
	mu    sync.RWMutex
	path  string
	books []Book
}

// NewStore returns an empty store backed by path. Call Load to read the file.
func NewStore(path string) *Store {
	return &Store{path: path, books: []Book{}}
}

// Load reads the JSON file into the store. A missing file is not an error: it
// means the store starts empty (first run). The caller holds no lock; Load takes
// the write lock itself.
func (s *Store) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			s.books = []Book{}
			return nil
		}
		return err
	}
	if len(data) == 0 {
		s.books = []Book{}
		return nil
	}

	var books []Book
	if err := json.Unmarshal(data, &books); err != nil {
		return err
	}
	if books == nil {
		books = []Book{}
	}
	s.books = books
	return nil
}

// List returns a copy of the books so callers never touch the slice the store
// may mutate concurrently.
func (s *Store) List() []Book {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]Book, len(s.books))
	copy(out, s.books)
	return out
}

// findLocked returns the index and a pointer to the book with the given id. The
// caller MUST hold the lock (read or write). It returns (-1, nil) when the book
// does not exist.
func (s *Store) findLocked(id string) (int, *Book) {
	for i := range s.books {
		if s.books[i].ID == id {
			return i, &s.books[i]
		}
	}
	return -1, nil
}

// save writes the whole store to disk atomically: encode to a temp file in the
// same directory, then rename it over the target. The caller MUST hold the write
// lock.
func (s *Store) save() error {
	data, err := json.MarshalIndent(s.books, "", "  ")
	if err != nil {
		return err
	}

	dir := filepath.Dir(s.path)
	if dir == "" {
		dir = "."
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	tmp, err := os.CreateTemp(dir, ".books-*.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, s.path)
}
