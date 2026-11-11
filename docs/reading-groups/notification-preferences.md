# Reading Groups — Notification preferences

This document defines the preference and delivery contract for group notifications. It is the prerequisite for enabling event reminders and activity digests without creating noisy or unwanted alerts.

## Reader controls

- **Per-group mute:** mute/unmute one group without leaving it or changing global notification settings.
- **Global group-notification switch:** pause all reading-group notifications while retaining membership and event RSVPs.
- **Category toggles:** independently enable/disable:
  - New group posts/discussions
  - Replies and mentions
  - Event announcements and event changes
  - RSVP updates (organizers only)
  - Event reminders
  - Member join/leave activity (optional; default off)
- **Digest cadence:** off (default), weekly summary. No daily digest by default.
- **Quiet hours:** optional user-local start/end; reminders and digests must respect quiet hours and be deferred to the next allowed window.

## Data model proposal

### `reading_group_notification_preferences`

One row per user, with global switches and category settings:

- `user_id` UUID primary key, references auth.users
- `enabled` boolean not null default true
- `discussion_notifications` boolean not null default true
- `reply_mention_notifications` boolean not null default true
- `event_notifications` boolean not null default true
- `rsvp_notifications` boolean not null default true
- `event_reminders` boolean not null default true
- `membership_activity_notifications` boolean not null default false
- `digest_frequency` text not null default 'off' (off|weekly)
- `quiet_hours_start` time nullable
- `quiet_hours_end` time nullable
- `timezone` text nullable (IANA identifier; validate server-side)

### `reading_group_notification_mutes`

- `user_id` UUID references auth.users
- `group_id` UUID references reading_groups
- `muted_at` timestamptz not null default now()
- Primary key (`user_id`, `group_id`)

Use RLS so users can select/insert/update/delete only their own preferences and mute rows. Never accept a user_id from the client as identity: mutation RPCs derive it from `auth.uid()`. Validate group existence and membership when muting; unmuting should remain possible after leaving a group to clean up stale settings.

## Delivery contract

Every notification producer must use one shared eligibility helper before enqueueing/delivering:

1. Resolve recipient from trusted server-side context.
2. Skip self-notifications.
3. Check global enabled switch and category toggle.
4. Check per-group mute.
5. Apply quiet hours and timezone for non-urgent deliveries.
6. Deduplicate by stable event key (recipient + source + notification type).
7. Enforce per-user rate limits; batch repeated discussion activity.
8. Never expose private group content to non-members or include sensitive reading activity in digests without consent.

Event reminders should be scheduled at most once per event/recipient/reminder offset, only for RSVP status `going` (and optionally `maybe` if explicitly chosen). Event cancellation/time changes must invalidate pending reminders and generate a preference-aware update.

## UI integration

- Group details: bell control with clear muted/unmuted state; do not conflate mute with leave.
- Profile/settings: global switch, category toggles, digest cadence, quiet-hours controls.
- Events: reminder preference and RSVP state shown separately.
- Use optimistic UI only with rollback on persistence failure; accessible labels and mobile-friendly hit targets are required.
- Explain that muting a group does not remove membership or change RSVP.

## Rollout sequence

1. Add schema, RLS policies, and authenticated preference RPCs.
2. Add typed client helpers and a settings UI with persisted state.
3. Route all group notification producers through the eligibility helper.
4. Add idempotent scheduled event reminders.
5. Add weekly digest job only after batching, opt-out, and privacy tests pass.

## Acceptance criteria

- Preferences persist across sessions and devices.
- Muting one group suppresses its notifications only.
- Global pause suppresses every group notification without changing group membership.
- Disabled categories are not delivered, including from event flows.
- Self-notifications and duplicate deliveries are suppressed.
- Quiet hours defer eligible notifications correctly across midnight and daylight-saving transitions.
- Non-members cannot read or modify another user's preferences.
- Failed preference saves visibly roll back; controls never silently claim success.
- Reminder jobs are idempotent, cancel-aware, and respect RSVP changes.
- Weekly digest is opt-in and contains only groups the reader can currently access.
