import { useState } from "react";
import { Modal } from "./components/Modal";
import { Tabs } from "./components/Tabs";
import { Disclosure } from "./components/Disclosure";
import { Tooltip } from "./components/Tooltip";
import type { TabItem } from "./components/Tabs";

const accountTabItems: TabItem[] = [
  {
    id: "profile",
    label: "Profile",
    content: (
      <p>
        This is the profile panel. Try <kbd>Tab</kbd> from the tab above — focus lands
        here, on the panel itself, since the panel content has nothing else focusable.
      </p>
    ),
  },
  { id: "billing", label: "Billing", content: <p>Billing details would go here.</p> },
  { id: "team", label: "Team", content: <p>Team members would go here.</p> },
];

const notificationTabItems: TabItem[] = [
  { id: "email", label: "Email", content: <p>Email notification settings.</p> },
  { id: "sms", label: "SMS", content: <p>SMS notification settings.</p> },
  { id: "push", label: "Push", content: <p>Push notification settings.</p> },
];

export function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Everything except the modal (which portals to document.body)
          goes inert while the modal is open — the APG dialog pattern
          calls for the content underneath a modal to be inert. */}
      <main inert={modalOpen}>
        <h1>Accessible components playground</h1>
        <p className="intro">
          Four components, built by hand against their WAI-ARIA APG patterns — no
          component library. Try each one keyboard-only: <kbd>Tab</kbd>,{" "}
          <kbd>Shift+Tab</kbd>, <kbd>Enter</kbd>/<kbd>Space</kbd>, arrow keys, and{" "}
          <kbd>Escape</kbd>.
        </p>

        <section aria-labelledby="modal-heading">
          <h2 id="modal-heading">Modal dialog</h2>
          <p>
            Opens with focus moved inside, traps <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd>{" "}
            within it, closes on <kbd>Escape</kbd> or the Close button, returns focus
            to this button, and locks background scroll while open.
          </p>
          <button type="button" onClick={() => setModalOpen(true)}>
            Open modal
          </button>
        </section>

        <section aria-labelledby="tabs-heading">
          <h2 id="tabs-heading">Tabs</h2>
          <p>
            Focus a tab, then use <kbd>←</kbd>/<kbd>→</kbd> to move between tabs
            (wraps at each end), or <kbd>Home</kbd>/<kbd>End</kbd> to jump to the
            first/last tab. Moving focus also activates the tab (automatic
            activation).
          </p>
          <Tabs label="Account settings" items={accountTabItems} />

          <p style={{ marginTop: "1.5rem" }}>
            Same component, <code>orientation=&quot;vertical&quot;</code> and{" "}
            <code>activationMode=&quot;manual&quot;</code>: <kbd>↑</kbd>/<kbd>↓</kbd>{" "}
            only move focus here — the panel doesn&rsquo;t switch until you press{" "}
            <kbd>Enter</kbd> or <kbd>Space</kbd> on the tab you land on.
          </p>
          <Tabs
            label="Notification preferences"
            items={notificationTabItems}
            orientation="vertical"
            activationMode="manual"
          />
        </section>

        <section aria-labelledby="tooltip-heading">
          <h2 id="tooltip-heading">Tooltip</h2>
          <p>
            Hover or <kbd>Tab</kbd> to a trigger below. Focus shows it immediately;
            hover shows it after a short delay. <kbd>Escape</kbd> dismisses it without
            moving focus away from the trigger.
          </p>
          <p>
            <Tooltip content="Saves the current document">
              <button type="button">Save</button>
            </Tooltip>{" "}
            <Tooltip content="Permanently deletes this item — this can't be undone">
              <button type="button">Delete</button>
            </Tooltip>
          </p>
        </section>

        <section aria-labelledby="disclosure-heading">
          <h2 id="disclosure-heading">Disclosure</h2>
          <p>
            A single button that shows or hides a region. <kbd>Enter</kbd>/
            <kbd>Space</kbd> toggle it — for free, because it's a real{" "}
            <code>&lt;button&gt;</code>.
          </p>
          <Disclosure summary="What is this playground for?">
            <p>
              It's the hand-built half of a comparison against shadcn/ui's dialog and
              tabs — see <code>NOTES.md</code> at the project root.
            </p>
          </Disclosure>
          <Disclosure summary="Does this have arrow-key navigation?" defaultOpen={false}>
            <p>
              No — that's the separate Accordion pattern, for a connected group of
              disclosures. A lone disclosure only needs a button.
            </p>
          </Disclosure>
        </section>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example modal"
        description="A short description, announced alongside the title via aria-describedby."
      >
        <p>
          Focus is trapped in here. Try tabbing past the last field — it should loop
          back to the first one, not escape into the page. Try scrolling the page with
          the mouse wheel, too — it shouldn't move.
        </p>
        <label>
          Some field
          <input type="text" placeholder="Type here" />
        </label>
        <button type="button">Another focusable thing</button>
      </Modal>
    </>
  );
}
