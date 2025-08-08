# Goodreads Integration

This project can connect to Goodreads so users can import and export book data.

## OAuth Login
Visit `/goodreads/connect` to initiate authentication. The server redirects the user to Goodreads, and `/goodreads/callback` persists the access tokens for the current account.

## Importing a Bookshelf
`/goodreads/bookshelf` returns the authenticated user's `read` shelf with ratings. If the account isn't linked, it responds with `401` and code `GOODREADS_NOT_LINKED`.

## Exporting Reading History
Send a `POST` request to `/goodreads/export` with `{ books }` to add books to the user's `read` shelf.
