# Goodreads Integration

This project can connect to Goodreads so users can import and export book data.

## OAuth Login
Use the `/goodreads/connect` endpoint to initiate authentication. The server returns a URL that users should visit to grant access.
The callback handled on `/goodreads/callback` stores the access token for the user.

## Importing a Bookshelf
`/goodreads/bookshelf` returns the current user's `read` shelf with ratings.

## Exporting Reading History
Send a `POST` request to `/goodreads/export` with `{ books }` to add books to the user's `read` shelf.
