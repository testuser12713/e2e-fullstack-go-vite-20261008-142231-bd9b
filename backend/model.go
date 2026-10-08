package main

// Book is the central domain type of the reading list. It is serialised to the
// JSON file on disk and to every API response.
type Book struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Author     string  `json:"author"`
	Status     string  `json:"status"`
	Rating     *int    `json:"rating"`
	FinishedAt *string `json:"finishedAt"`
}

// Reading status constants. These are the only values a Book.Status may hold.
const (
	StatusPlanned = "planned"
	StatusReading = "reading"
	StatusRead    = "read"
)

// CreateBookRequest is the body of POST /api/books.
type CreateBookRequest struct {
	Title  string `json:"title"`
	Author string `json:"author"`
}

// UpdateBookRequest is the body of PUT /api/books/{id}.
type UpdateBookRequest struct {
	Title  string `json:"title"`
	Author string `json:"author"`
}

// StatusRequest is the body of PUT /api/books/{id}/status.
type StatusRequest struct {
	Status string `json:"status"`
}

// RatingRequest is the body of PUT /api/books/{id}/rating. A nil Rating clears
// the rating.
type RatingRequest struct {
	Rating *int `json:"rating"`
}

// ErrorBody is the uniform failure envelope: {"error":{"code":...,"message":...}}
type ErrorBody struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail carries a machine-readable code and a human-readable message.
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
