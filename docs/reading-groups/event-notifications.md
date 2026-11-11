# Reading Group event notifications

Migration: `20261112100000_reading_group_event_notifications.sql`

When a scheduled group event is inserted, an after-insert trigger writes an in-app notification to active group members (excluding its organizer). It honors global notification enablement, the membership/activity preference, and group mute expiry. Missing preference rows use defaults (enabled); indefinite mutes suppress notifications. Notifications are transactional with event creation.

This is inbox-only: no email, push, reminders, recurring jobs, or digest dispatch. Apply after the group events migration and notification preference migration (#1402).