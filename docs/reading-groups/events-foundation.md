# Reading Groups — Events foundation

This migration introduces group-scoped events and RSVP primitives. It intentionally does not add calendar UI or notifications yet.

## Event types
- Book discussion
- Co-reading / live reading
- Reading marathon
- Author meetup
- Weekly session
- Other

## Authorization
- Authenticated active group members can read events and RSVP records.
- Event creation requires active membership; creator is automatically marked `going`.
- Event/participant table writes are revoked from browser roles.
- RSVP changes and event cancellation use SECURITY DEFINER RPCs deriving identity from `auth.uid()`.
- Event capacity is enforced while locking the event row, preventing concurrent RSVP overbooking.
- Organizer or group owner/admin can cancel; cancelled events cannot accept RSVPs.
- Membership removal immediately removes read access through RLS.

## RPCs
- `create_reading_group_event(...)`: create event and organizer RSVP atomically.
- `respond_to_reading_group_event(event_id, 'going'|'maybe'|'decline')`: RSVP / withdraw.
- `cancel_reading_group_event(event_id)`: organizer/admin cancellation.

## Next UI integration
1. Add Events tab to GroupDetails, only visible to active members.
2. Event cards with local timezone, type, RSVP counts and capacity.
3. Create-event dialog with validation and sensible timezone default.
4. RSVP buttons and cancellation state.
5. Upcoming events surfaced in Activity and linked to Reading Rooms for co-reading.
6. Notifications/reminders only after preferences and delivery limits are defined.

## Validation checklist
- Non-member cannot read event rows or participant lists.
- Inactive/banned member cannot create or RSVP.
- Concurrent RSVP cannot exceed capacity.
- Duplicate RSVP is idempotent.
- Decline removes RSVP; cancelled event rejects RSVP.
- Only organizer/admin can cancel.
- Event and creator RSVP rollback together on failure.
