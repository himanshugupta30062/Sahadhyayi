#!/usr/bin/env bash
set -euo pipefail

issues=0

# 1. Check for duplicate type definitions of Book
mapfile -t book_defs < <(rg -l "^type\s+Book" --glob "*.ts" || true)
if [ "${#book_defs[@]}" -gt 1 ]; then
  echo "Duplicate 'Book' type definitions found:" >&2
  printf '%s\n' "${book_defs[@]}" >&2
  issues=1
fi

# 2. Check for duplicate type definitions of Author
mapfile -t author_defs < <(rg -l "^type\s+Author" --glob "*.ts" || true)
if [ "${#author_defs[@]}" -gt 1 ]; then
  echo "Duplicate 'Author' type definitions found:" >&2
  printf '%s\n' "${author_defs[@]}" >&2
  issues=1
fi

# 3. Search for TODO or conflict markers in library-related files
mapfile -t todo_conflicts < <(rg -n "TODO|CONFLICT|<<<<<<<|>>>>>>>" apps/web-next/src/lib || true)
if [ "${#todo_conflicts[@]}" -gt 0 ]; then
  echo "TODO/CONFLICT markers detected in library files:" >&2
  printf '%s\n' "${todo_conflicts[@]}" >&2
  issues=1
fi

# 4. Verify imports for lib/supabase/books.ts via TypeScript
if ! npx tsc --noEmit apps/web-next/src/lib/supabase/books.ts >/tmp/library_audit_tsc.log 2>&1; then
  echo "TypeScript import resolution errors in lib/supabase/books.ts:" >&2
  cat /tmp/library_audit_tsc.log >&2
  issues=1
fi
rm -f /tmp/library_audit_tsc.log

if [ "$issues" -ne 0 ]; then
  echo "Library merge audit found issues." >&2
  exit 1
fi

echo "Library merge audit passed."
