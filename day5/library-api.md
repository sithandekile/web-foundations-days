# Library API Design

## Books Resource

The `books` resource represents books in the library catalog.

### Endpoints

#### 1. List all books
- Method: `GET`
- Path: `/api/books`
- Description: Returns a list of all books in the library.
- Success status: `200 OK`

Example response:

```json
[
  {
    "id": 1,
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "publishedYear": 1937
  },
  {
    "id": 2,
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "genre": "Classic",
    "publishedYear": 1813
  }
]
```

#### 2. Get one book by ID
- Method: `GET`
- Path: `/api/books/:id`
- Description: Returns a single book matching the given ID.
- Success status: `200 OK`

Example:

```http
GET /api/books/1
```

Example response:

```json
{
  "id": 1,
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "genre": "Fantasy",
  "publishedYear": 1937
}
```

#### 3. Create a new book
- Method: `POST`
- Path: `/api/books`
- Description: Creates a new book entry in the library.
- Success status: `201 Created`
- Example request body:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "genre": "Technology",
  "publishedYear": 2008
}
```

Example response:

```json
{
  "id": 3,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "genre": "Technology",
  "publishedYear": 2008
}
```

#### 4. Update an existing book
- Method: `PUT`
- Path: `/api/books/:id`
- Description: Replaces the full details of a book with the new book data.
- Success status: `200 OK`
- Example request body:

```json
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "genre": "Adventure",
  "publishedYear": 1937
}
```

Example:

```http
PUT /api/books/1
```

#### 5. Delete a book
- Method: `DELETE`
- Path: `/api/books/:id`
- Description: Removes a book from the library by ID.
- Success status: `200 OK` or `204 No Content`

Example:

```http
DELETE /api/books/2
```

Example response:

```json
{
  "message": "Book deleted successfully"
}
```

#### 6. List books by author
- Method: `GET`
- Path: `/api/books?author=Jane Austen`
- Description: Returns all books written by a specific author using a query parameter.
- Success status: `200 OK`

Example:

```http
GET /api/books?author=Jane%20Austen
```

Example response:

```json
[
  {
    "id": 2,
    "title": "Pride and Prejudice",
    "author": "Jane Austen",
    "genre": "Classic",
    "publishedYear": 1813
  }
]
```

## Error Codes

### 400 Bad Request
- Meaning: The client sent invalid or incomplete data.
- Example: A request body is missing required fields such as `title` or `author`.

Example request:

```json
{
  "author": "George Orwell"
}
```

Example response:

```json
{
  "error": "Bad Request",
  "message": "Title is required"
}
```

### 404 Not Found
- Meaning: The requested resource does not exist.
- Example: A client tries to fetch `/api/books/999`, but no book with ID 999 exists.

Example response:

```json
{
  "error": "Not Found",
  "message": "Book with ID 999 was not found"
}
```

## Summary

This API supports the full lifecycle of library books:
- list books
- get an individual book
- create a new book
- update a book
- delete a book
- filter books by author

It also handles common errors such as invalid input (`400`) and missing resources (`404`).
