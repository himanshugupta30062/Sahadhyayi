

## Plan: Add Contact Me Button to Navbar + Make Articles Discoverable

### Problems Identified
1. No "Contact Me" button in the navigation bar — the only contact option is a small floating action button (FAB) in the bottom-right corner, easy to miss.
2. "Articles" page has no link in the main navigation — users can't easily find it.

### Changes

**1. `src/components/Navigation.tsx`**
- Add a **"Contact me"** styled button to the desktop navbar (next to Sign In / user actions area), similar to the reference image — outlined/bordered button style.
- Add **"Articles"** to the `navItems` array for both logged-in and logged-out users.
- Add "Contact me" and "Articles" links to the mobile menu as well.
- The Contact Me button will open the existing `ContactFormDialog` by lifting its open state or triggering it via a shared state/callback.

**2. `src/components/ContactFormDialog.tsx`**
- Accept optional `externalOpen` and `onOpenChange` props so the navbar can control it.
- Keep the existing FAB as a fallback, but allow external triggering from the nav.

**3. `src/pages/Index.tsx`**
- Pass open state control from nav to ContactFormDialog (or use a simpler approach: make the nav "Contact me" button link to `/about#contact` or directly open the dialog via a global event).

### Simpler Approach (Preferred)
Instead of complex state lifting, refactor `ContactFormDialog` to also export a trigger hook or simply:
- Add a dedicated **"Contact"** nav item that scrolls to `/about` contact section, OR
- Add a `ContactFormDialog` instance inside `Navigation.tsx` with a custom trigger button styled like the reference image.

### Technical Details
- Desktop: "Contact me" button placed after nav links, before auth buttons — styled with `border-2 border-orange-500 rounded-full` to match reference.
- Mobile: "Contact me" added as a menu item.
- "Articles" added to navItems for both auth states.
- No new dependencies needed.

### Files Modified
- `src/components/Navigation.tsx` — add Articles nav item + Contact Me button with inline ContactFormDialog
- `src/components/ContactFormDialog.tsx` — accept optional custom trigger prop

