# Books API Week 02 Spec - Version 1

## Feature 1: Book CRUD Operations and Author References

### Goal
Update the existing Week 01 book API so book documents include a reference to an author and the API supports all CRUD operations for books. Every book route must be documented and testable in Swagger.

### Data Model
Book documents will be stored in the `books` collection.

Required book fields:
- `id`: string, required, custom id such as `b1`
- `authorId`: string, required, references the `id` field of an author document
- `title`: string, required
- `publicationDate`: string, required, ISO calendar date in `YYYY-MM-DD` format

Validation and persistence rules:
- All four fields must be non-empty strings. Whitespace-only values, `null`, missing values, and other types are invalid.
- `id` must be unique and immutable. The database must enforce uniqueness with a unique index on `books.id`.
- The API must reject unknown request fields with `400` rather than persisting them.
- The API must not expose MongoDB's internal `_id` value in its documented responses.
- Implementations must enforce maximum lengths for `id` and `title` and document those limits in Swagger.
- `PUT /books/:id` is a full replacement of the editable fields (`authorId`, `title`, and `publicationDate`); all three are required. The path `id` remains unchanged.

Books will continue to use custom string ids instead of MongoDB `_id` values for route parameters.

### Relationship to Authors
Each book will identify its author with an `authorId` field. The value of `authorId` must match the custom `id` value of an existing author document.

When creating or updating a book, the API should reject the request with a `400` status code if the submitted `authorId` does not match an existing author.

The author `id` is also unique and immutable. An author cannot be deleted while books reference it; the API must return `409` until those books are reassigned or deleted. This prevents orphaned book references.

The database must enforce uniqueness with a unique index on `authors.id`. Author validation must use a targeted existence query and must not load the full authors collection.

## Common response contract

Successful book responses contain only the public fields `id`, `authorId`, `title`, and `publicationDate`.

Errors use this JSON shape:

    {
      "error": "VALIDATION_ERROR",
      "message": "authorId must reference an existing author",
      "field": "authorId"
    }

`field` is included for field-specific validation errors and omitted when it does not apply. Error responses must not include stack traces, database connection details, or request secrets.

Use these error codes consistently:
- `400` for malformed JSON, missing or invalid fields, invalid dates, unknown fields, and invalid author references
- `404` when the requested book or author does not exist
- `409` for a duplicate custom id or an author deletion blocked by referenced books
- `413` when the request body exceeds the configured size limit
- `500` for unexpected server or database errors

The API must return `Content-Type: application/json` for JSON responses. A successful `204` response has no response body.

### Routes

#### GET /books
Purpose: Return all books.

Query parameters:
- `page`: positive integer, default `1`
- `limit`: positive integer, default `20`, maximum `100`

Results are sorted by `id` ascending. The endpoint must return a bounded page rather than loading the complete collection into memory.

Success:
- Status code: `200`
- Response body:

      {
        "data": [
          {
            "id": "b1",
            "authorId": "a1",
            "title": "Example Book Title",
            "publicationDate": "2026-01-15"
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "totalItems": 1,
          "totalPages": 1
        }
      }

Errors:
- `400` if `page` or `limit` is invalid
- `500` if an unexpected server or database error occurs

#### GET /books/:id
Purpose: Return one book by its custom id.

Success:
- Status code: `200`
- Response body: the matching public book object, for example:

      {
        "id": "b1",
        "authorId": "a1",
        "title": "Example Book Title",
        "publicationDate": "2026-01-15"
      }

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### POST /books
Purpose: Create a new book.

Request body:

    {
      "id": "b4",
      "authorId": "a1",
      "title": "Example Book Title",
      "publicationDate": "2026-01-15"
    }

Success:
- Status code: `201`
- Response body: the newly created book object
- The response includes a `Location` header containing `/books/{id}`.

Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `400` if a field has the wrong type, an invalid date, or an unknown field is supplied
- `409` if the `id` already exists
- `500` if an unexpected server or database error occurs

#### PUT /books/:id
Purpose: Update an existing book.

Request body:

    {
      "authorId": "a2",
      "title": "Updated Book Title",
      "publicationDate": "2026-02-20"
    }

Success:
- Status code: `200`
- Response body: the updated book object

Errors:
- `400` if a required field is missing
- `400` if the `authorId` does not match an existing author
- `400` if a field has the wrong type, an invalid date, or an unknown field is supplied
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

#### DELETE /books/:id
Purpose: Delete an existing book.

Success:
- Status code: `204`
- Response body: none

Errors:
- `404` if no book exists with that id
- `500` if an unexpected server or database error occurs

### Swagger Documentation
Swagger must document every book route, including query parameters, request bodies, required fields, field formats and limits, success examples, and every documented error response. The OpenAPI document must define reusable `Book`, paginated-list, and error schemas. `swagger.json` must be regenerated as part of the deployment/build process so `/api-docs` cannot serve stale route documentation.

### Security and operational requirements
- Production access must use HTTPS, and database credentials must be supplied only through environment variables or the deployment secret manager.
- Configure a request-body size limit, rate limiting, and an explicit CORS policy for deployed clients.
- Do not log request bodies, credentials, database connection strings, or complete book collections. Unexpected errors may be logged server-side without being returned to clients.
- Validate and allow-list fields before database writes; never pass arbitrary request-body properties into MongoDB updates or dynamic queries.
- Authentication and authorization requirements must be specified before deployment. At minimum, create, update, and delete operations must not be publicly writable.

### Database indexes
The deployment must create or verify these indexes:
- unique index on `books.id`
- unique index on `authors.id`
- index on `books.authorId` for author-reference checks and future author book queries

### Deployment Expectations
After implementation, the book routes must work locally and from the deployed Render application. The deployed Swagger page at `/api-docs` must allow someone to test every book route from the browser.

## Feature 2: Author CRUD Operations

Authors are stored in the `authors` collection.

Required author fields:
- `id`: string, required, unique, custom id such as `a1`, immutable
- `name`: string, required, non-empty after trimming

Author request bodies must reject missing fields, invalid types, empty values, and unknown fields. Maximum field lengths must be documented in Swagger. Successful responses expose only `id` and `name`.

#### GET /authors
Return all authors with `200`. Use the same `page` and `limit` query parameters, default values, maximum limit, sorting rule, and paginated response shape as `GET /books`.

Errors are `400` for invalid pagination and `500` for unexpected errors.

#### GET /authors/:id
Return one author with `200`, or `404` if no author exists. Unexpected errors return `500`.

#### POST /authors
Create an author with a request body such as:

    {
      "id": "a1",
      "name": "Example Author"
    }

Return `201`, the created public author, and a `Location` header. Return `400` for invalid input, `409` for a duplicate id, and `500` for unexpected errors.

#### PUT /authors/:id
Replace the author's editable fields with a body such as:

    {
      "name": "Updated Author"
    }

Return `200` and the updated author. Return `400` for invalid input, `404` if the author does not exist, and `500` for unexpected errors. The path `id` remains unchanged.

#### DELETE /authors/:id
Delete an author and return `204` with no body. Return `404` if it does not exist, `409` if books reference it, and `500` for unexpected errors.

Swagger must document every author route with the same completeness requirements as the book routes.