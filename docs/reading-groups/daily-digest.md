# Reading Group Daily Digest

Migration: `20261112120000_reading_group_daily_digest.sql`

- Daily at 08:00 UTC (13:30 IST) if pg_cron is installed.
- Opt-in only: requires `digest_enabled=true` and global notifications enabled.
- Aggregates recent `reading_group%` notifications into a single inbox item.
- Delivery ledger prevents duplicate digest per user/day.
- Inbox-only; no email, push or external provider.
- Requires the notification preferences migration (#1402) and notification schema.
- Validate cron job and migration order in Supabase before production use.