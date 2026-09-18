# Consolidate Reading Groups on Supabase

## Goal
Use one database-backed Reading Groups experience everywhere so group listings, memberships, admin changes, and chat access remain consistent across browsers and users.

## Implementation
1. **Create one shared groups directory**
   - Replace the Social tab’s mock/localStorage group state with the existing Supabase group and membership queries.
   - Reuse the same directory in both `/groups` and the Social Groups tab, with page-level presentation kept separate where needed.
   - Search only live group names and descriptions; remove unsupported mock-only fields such as fixed dates, locations, genres, privacy, and member limits.

2. **Complete persistent group actions**
   - Connect create, join, leave, edit, and delete controls to the existing Supabase mutations.
   - Show edit/delete only to authorized group creators/admins.
   - Keep chat and details actions available only to members.
   - Harden creation rollback and deletion behavior so partial operations do not leave orphaned data.

3. **Make data states reliable**
   - Add clear loading placeholders, retryable load-error messages, signed-out guidance, no-groups states, and no-search-results states.
   - Disable controls while actions are running and retain dialogs on failed saves so users can retry.
   - Keep query caches synchronized after every mutation and subscribe to group/membership changes where permitted.

4. **Verify the full flow**
   - Add focused regression coverage for filtering and membership/admin controls.
   - Run lint and the production build.
   - Exercise listing, search, join/leave, create, edit, delete, details, and chat entry in the browser; authenticated checks will use the available Supabase test session.

## Technical notes
- Canonical tables: `group_chats`, `group_chat_members`, and `group_messages`.
- No new mock fallback or localStorage persistence will remain in Reading Groups.
- A schema migration will only be added if live policy inspection shows the existing RLS rules cannot safely support these actions.
