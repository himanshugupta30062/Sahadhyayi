# Reading Group event reminders

Migration: `20261112110000_reading_group_event_reminders.sql`

- Runs every five minutes via pg_cron when the extension is installed.
- Creates in-app reminders at 24 hours and 1 hour before a scheduled event for members RSVP'd `going`.
- Checks active membership, global notifications, event-reminder preference, group mute and quiet hours.
- A unique delivery ledger (`event_id,user_id,reminder_kind`) prevents duplicate reminders.
- No email, push or digest delivery.

Quiet-hour reminder windows are skipped (not queued for later delivery); reminder eligibility uses a ten-minute due window. Apply only after event and notification-preference migrations. Verify pg_cron installation and job status in the target Supabase project before relying on reminders.