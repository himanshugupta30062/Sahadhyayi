# Reading Groups notification preferences — backend

Migration: `20261111190000_reading_group_notification_preferences.sql`

## Scope
- Store one global preference row per reader (defaults are notification-enabled, digest-disabled).
- Store per-group mute overrides; `muted_until = NULL` means mute indefinitely.
- RLS restricts preference rows to their owner and group mute rows to their owner while they are an active member of that group.
- User identity is always checked against `auth.uid()`; clients cannot write preferences or mutes for another reader.
- Quiet-hours values are persisted as local wall-clock times with an explicit IANA timezone.

## Deployment prerequisite
Apply the Reading Groups lifecycle migration chain first. This migration depends on `group_chat_members.status = 'active'` and `group_chats.id`. The repository's Phase 1–6 migrations are not yet recorded as applied in production (see Phase 7 migration note); do not apply this migration alone to production.

## Deliberately not included
No notification dispatcher, email/push delivery, event reminder scheduler, digest job, or delivery deduplication is enabled here. Those require a separate, rate-limited delivery implementation and operational configuration.

## Validation
- Preference defaults are conservative (digest off); user rows are owner-only.
- Mutes cannot be created/edited/read by a different user.
- Mute operations require active group membership.
- Deleting a user or group cascades preference/mute records.
- Quiet hours require both endpoints when enabled.
