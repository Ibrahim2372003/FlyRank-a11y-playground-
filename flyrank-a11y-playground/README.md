# Accessible components playground

FlyRank Internship · Foundations · Modal, Tabs, Tooltip, and Disclosure
built by hand against their WAI-ARIA APG patterns, then compared against
shadcn/ui.

## Structure

```
playground/     the four components + a demo app (React + TypeScript, no libraries)
NOTES.md         the shadcn/ui comparison — the core deliverable
```

## Run it

```bash
cd playground
npm install
npm run dev
```

Then open the printed local URL. To type-check without starting the dev
server:

```bash
npm run typecheck
```

## Keyboard-only test checklist

Everything below should work with a mouse never touching the page.

**Modal**
- [ ] `Tab` to "Open modal", `Enter`/`Space` opens it
- [ ] Focus lands inside the dialog immediately on open
- [ ] `Tab` cycles only through controls inside the dialog — it never
      reaches the page behind it
- [ ] `Shift+Tab` from the first control wraps to the last one
- [ ] `Escape` closes the dialog
- [ ] Focus lands back on "Open modal" after closing (both via `Escape`
      and via the Close button)
- [ ] Scrolling the page with the mouse wheel does nothing while open

**Tabs (horizontal, automatic — "Account settings")**
- [ ] `Tab` reaches the tablist and lands on the *active* tab only —
      the other tabs are skipped
- [ ] `ArrowRight`/`ArrowLeft` move between tabs and wrap at each end
- [ ] `Home`/`End` jump to the first/last tab
- [ ] Moving focus with an arrow key also shows that tab's panel
- [ ] `Tab` from the active tab moves into its panel

**Tabs (vertical, manual — "Notification preferences")**
- [ ] `ArrowUp`/`ArrowDown` move focus (not `Left`/`Right`) — the panel
      does *not* change yet
- [ ] `Enter` or `Space` on the focused tab switches the panel
- [ ] `Home`/`End` still jump to the first/last tab

**Tooltip**
- [ ] `Tab` to a trigger — the tooltip appears immediately, no delay
- [ ] `Shift+Tab` away (or `Tab` past it) — the tooltip disappears
- [ ] `Escape` while it's visible hides it without moving focus off the trigger
- [ ] Hovering a trigger with the mouse shows it after a short delay,
      and moving the pointer onto the tooltip itself keeps it open

**Disclosure**
- [ ] `Tab` reaches the disclosure button
- [ ] `Enter` and `Space` both toggle it
- [ ] The hidden content is skipped entirely by `Tab` while collapsed

## How the TypeScript check was actually verified

This sandbox has no network access, so `npm install` was never run here
against the real `@types/react`. Every component was instead checked
with a hand-written, deliberately minimal ambient shim standing in for
`@types/react` (covering exactly the hooks, event types, and per-tag
JSX intrinsic elements the components use, with `strict` +
`noImplicitAny` on) — real `tsc`, real errors, just against a stand-in
for the types package rather than the genuine one. It compiled clean.
Run `npm run typecheck` after `npm install` in your own environment to
confirm against the real `@types/react`.

## The comparison

See [`NOTES.md`](./NOTES.md) — it names concrete, cited gaps between
this implementation and shadcn/ui's (four closed in this codebase, two
more named for the newly-added Tooltip), not just a features list.
