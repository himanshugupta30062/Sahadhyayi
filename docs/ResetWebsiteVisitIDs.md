# Resetting Website Visit IDs

If you need to clear out the visit history and start the `id` numbering from 1 again, run the following SQL commands against your Supabase database:

```sql
DELETE FROM public.website_visits;
ALTER SEQUENCE public.website_visits_id_seq RESTART WITH 1;
```

The first statement removes all existing rows. The second resets the `BIGSERIAL` sequence used by the `id` column so the next inserted visit will be assigned `id = 1`.
