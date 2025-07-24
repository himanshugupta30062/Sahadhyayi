# Goodreads Integration

This project can connect to Goodreads so users can import and export book data.

## OAuth Login
Use the `/goodreads/request-token` endpoint to initiate authentication. The server returns a URL that users should visit to grant access.
The callback handled on `/goodreads/callback` stores the access token for the session.

## Importing a Bookshelf
`/goodreads/bookshelf?userId=<id>` returns the user's `read` shelf with ratings.

## Exporting Reading History
Send a `POST` request to `/goodreads/export` with `{ userId, books }` to add books to the user's `read` shelf.
