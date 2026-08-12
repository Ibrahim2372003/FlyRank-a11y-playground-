# NOTES.md — hand-built vs. shadcn/ui

## How this was actually produced (read this first)

This sandbox has no network access for `npm install` or `npx`, so I could
not literally run `npx shadcn@latest init` / `add dialog tabs` and read
the files it wrote to disk here. Rather than guess from memory or fake a
"generated" file, I fetched shadcn/ui's real, current source directly
from its GitHub repo and its own docs (both cited below) and read those.
Everything claimed about shadcn's/Radix's code in this document is
grounded in that real source, not invented.

**To reproduce this yourself** (needed to actually satisfy "add its
dialog and tabs" in your own environment):

```bash
npm create vite@latest shadcn-comparison -- --template react-ts
cd shadcn-comparison && npm install
npm install -D tailwindcss @tailwindcss/vite @types/node
# add the "@/*" path alias to tsconfig + vite.config.ts (shadcn docs, step-by-step)
npx shadcn@latest init
npx shadcn@latest add dialog tabs tooltip
```

Then open `src/components/ui/dialog.tsx`, `tabs.tsx`, and `tooltip.tsx`
and compare them against what's below — you should find the same shape
I describe here.

Sources read for this comparison:
- `apps/v4/registry/new-york-v4/ui/tabs.tsx` — shadcn/ui GitHub repo (main branch)
- `apps/v4/registry/new-york-v4/ui/_registry.ts` — confirms `dialog`/`tabs`/`accordion`/`tooltip` all declare `radix-ui` as their runtime dependency
- shadcn/ui changelog, "Unified Radix UI Package" (Feb 2026) — confirms the current `dialog.tsx` imports `{ Dialog as DialogPrimitive } from "radix-ui"`
- Radix Primitives docs — Dialog, Tabs, and Tooltip component pages — the authoritative description of what each underlying primitive actually does
- A published `@radix-ui/react-tooltip` type declaration file — confirms the exact `TooltipProvider` props (`delayDuration`, `skipDelayDuration`, `disableHoverableContent`) and their real default values

## The one-sentence version

shadcn's `dialog.tsx`, `tabs.tsx`, and `tooltip.tsx` are thin, styled
**wrappers around Radix UI primitives**. Nearly all of the APG-correct
behavior — focus trap, roving tabindex, arrow-key navigation, `Esc`
handling, hoverable/dismissible tooltip semantics — isn't shadcn's own
code at all. It's Radix's. What shadcn actually adds is Tailwind
classes, `data-slot` attributes for styling hooks, and a bit of
composition sugar. Reading the source didn't just show me finished
components — it showed me that "shadcn" and "the thing that makes this
accessible" are two different layers, and the second one is doing
almost all the work I did by hand.

## Concrete gaps — found, then closed

These four were found by reading real shadcn/Radix source and comparing
it to my first pass at `Modal` and `Tabs`. All four are now fixed in
this codebase (see "What changed" under each) — the *finding* is still
worth keeping on record, since the exercise was never really about
these four specific props, it was about learning to read library source
and notice what it does that you didn't.

### 1. My modal didn't lock body scroll; Radix's does

Radix's `Dialog.Root` pulls in scroll-locking behavior (via
`react-remove-scroll` internally) so that while the dialog is open, the
mouse wheel and trackpad can't scroll the page behind it — not just
keyboard/AT interaction, but the scroll itself. My original `Modal`
only made the background `inert`, which correctly removes it from the
keyboard and accessibility tree, but a sighted mouse user could still
scroll the page underneath the overlay.

**What changed:** `Modal` now locks `document.body` overflow while
open, compensating the width lost to the scrollbar with a matching
`padding-right` so the page doesn't visibly jump, and restores both to
their exact prior values on close (not just clears them, in case
something else on the page had already set inline styles there).

### 2. My modal had no accessible-description wiring; Radix has a dedicated slot for it

Radix ships a `Dialog.Description` part specifically so a dialog can
have *both* an accessible name (`Title`) *and* an accessible description
announced together when it opens — and Radix's own docs note that if you
deliberately don't want one, you're expected to pass
`aria-describedby={undefined}` rather than just omitting it, so the
absence is a decision, not an oversight. My original `Modal` only took a
`title` prop.

**What changed:** `Modal` now takes an optional `description` prop,
rendered as a `<p>` and wired to a second id via `aria-describedby`,
present only when a description is actually passed.

### 3. My tabs hardcoded automatic activation; Radix makes it a prop

I'd implemented only the "automatic activation" model — arrow keys move
focus *and* select the tab in the same action. That's a valid choice the
APG explicitly allows, but it's a choice, not the only option: the APG's
other model ("manual activation") moves focus with the arrows but
waits for `Enter`/`Space` to actually switch panels, which matters when
switching panels is expensive (a network request, a heavy re-render).
Radix's `Tabs.Root` exposes this as an `activationMode` prop
(`"automatic" | "manual"`).

**What changed:** `Tabs` now takes an `activationMode` prop. Internally
this meant splitting one piece of state into two — `selectedIndex`
(which panel shows, drives `aria-selected`) and `focusedIndex` (which
tab is in the Tab order) — since in manual mode a keyboard user can
arrow onto a tab without that tab being selected yet. Selecting on
`Enter`/`Space` needed no extra key-handling code at all: a real
`<button>` already fires `onClick` for both, so the same handler that
runs on a mouse click also runs on keyboard activation.

### 4. My tabs were horizontal-only; Radix's are orientation-aware

Radix's `Tabs.Root` takes an `orientation` prop that does two things at
once: it switches which arrow keys move focus (`Left`/`Right` for
horizontal, `Up`/`Down` for vertical) *and* sets `aria-orientation` on
the tablist so assistive tech announces it correctly. My original `Tabs`
only implemented the horizontal case.

**What changed:** `Tabs` now takes an `orientation` prop that swaps the
arrow-key mapping and always renders `aria-orientation` explicitly
(rather than relying on assistive tech to assume horizontal when it's
just missing).

## Tooltip — added after this comparison, so it gets its own

The original brief only asked for Modal, Tabs, and Disclosure. Once I
added a fourth component, it seemed dishonest to leave it out of the
comparison just because it came later — so here's the same exercise for
Tooltip against Radix's real `Tooltip.Root`/`TooltipProvider`.

**What I built:** the WAI-ARIA APG Tooltip pattern — `role="tooltip"`,
associated via `aria-describedby` (not `aria-labelledby` — a tooltip is
a description, not a name) only while visible, shown on hover after a
delay *or* on focus immediately, hidden on blur/mouseleave after a short
delay, dismissible with `Escape` without moving focus, and "hoverable"
per WCAG 1.4.13 — moving the pointer from the trigger onto the tooltip
itself cancels the pending hide instead of losing it mid-read.

**Two gaps, named up front rather than waiting to be asked:**

- **No collision-aware positioning.** Mine is pinned above the trigger
  with plain CSS, full stop. Radix's `Tooltip.Content` is built on
  `@radix-ui/react-popper` — it has `side`/`align` props and, more
  importantly, *automatically flips* to the other side when the pinned
  position would put it off-screen. A tooltip near the top of the
  viewport in my version just renders cut off.
- **No cross-tooltip "skip delay."** Radix's `TooltipProvider` has a
  `skipDelayDuration` (documented default: 300ms): hover one tooltip,
  then move to another trigger within 300ms, and the second tooltip
  skips its own opening delay — the assumption being you're already "in
  tooltip mode" from the first hover. Every tooltip in my version waits
  out its full `showDelay` independently, every time, which reads as
  noticeably laggier when scanning across a toolbar of icon buttons.

Neither of these is a correctness bug against the APG pattern itself —
both are refinements Radix added on top of an already-correct
foundation, which fits the same shape as the four gaps above: reading
real library source doesn't just teach you the pattern, it teaches you
what "done" looks like past the point where the accessibility tree is
already correct.

## What shadcn/Radix does *not* add beyond what I already had

Worth being honest about the other direction too: reading the source
didn't turn up some ARIA fundamental I'd completely missed. `role="dialog"`
+ `aria-modal`, initial focus moving into the dialog, the Tab/Shift+Tab
trap logic, `Esc` to close, focus returning to the trigger, roving
tabindex on the tabs, `aria-selected`/`aria-controls`/`aria-labelledby`
wiring, `aria-expanded` on the disclosure button, `aria-describedby` on
the tooltip trigger — all of that was present and correct in my first
pass, described in almost the same terms in Radix's own docs. The gaps
above are real, but they're refinements on a foundation that was already
sound, which is arguably the more useful thing to have confirmed:
building it by hand first meant I recognized every piece of Radix's own
description of itself, instead of reading it as a list of unfamiliar
features.

## Known gap still open

`Tooltip`'s `cloneElement` doesn't merge a `ref` the caller's own
trigger element might already carry — it only assigns the handlers and
`aria-describedby` it needs. Fine for a from-scratch demo where the
trigger is a plain `<button>`; a real component meant for reuse would
need proper ref-merging (or an `asChild`-style API like Radix's) so a
caller can still get their own ref to the trigger element.
