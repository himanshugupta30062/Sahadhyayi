# Architecture: Readers Map & Location Privacy Guarantees

## 1. Privacy First Principles
Readers Map is Sahadhyayi's signature community discovery surface. Because physical safety and privacy are paramount:
- **No Exact Coordinates Stored**: Readers Map never records, persists, or transmits precise residential or GPS coordinates.
- **City-Level Resolution**: All user locations are mapped to city centroids or fuzzy clusters.
- **Coordinate Jitter**: When rendering clustered points, coordinates undergo randomized deterministic jitter of $\ge 1.5\text{km}$ to prevent triangulation.
- **Strict Opt-In**: Location sharing is off by default for all accounts.

## 2. Row Level Security & Access Control
- Table: `user_locations`
- `SELECT`: Only visible if `visibility = 'public'` OR (`visibility = 'friends'` AND `public.are_friends(auth.uid(), user_id)`).
- `INSERT/UPDATE/DELETE`: `auth.uid() = user_id`.
- Unauthenticated (`anon`) users are denied direct access to user location coordinates.
- Community Sequel Tallies & Reader Counts: Fetched via secure counts-only aggregate RPCs, never opening row-level visibility.

## 3. Opt-Out & Right to Deletion
When a user toggles location sharing off in settings:
1. The record in `user_locations` is immediately hard-deleted.
2. Cached spatial pins are invalidated in Redis/React Query.
3. No historical movement logs are retained.
