import { useId, useState } from "react";
import type { ReactNode } from "react";

/**
 * Disclosure — implements the WAI-ARIA APG "Disclosure (Show/Hide)"
 * pattern by hand.
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * The pattern is deliberately small next to Dialog and Tabs:
 *  - a single real <button> carrying aria-expanded and aria-controls
 *    (a real button gives Enter/Space activation for free — no key
 *    handler needed, which is itself the point of using one)
 *  - the controlled region is only in the accessibility tree, and only
 *    in the Tab order, while it's open (`hidden` handles both at once)
 *  - no arrow-key navigation is required — that's the separate Accordion
 *    pattern, for a connected *group* of disclosures, which this isn't
 */

export interface DisclosureProps {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ summary, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="disclosure">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        className="disclosure-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden="true" className={open ? "disclosure-icon disclosure-icon-open" : "disclosure-icon"}>
          ▸
        </span>
        {summary}
      </button>
      <div id={contentId} className="disclosure-content" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
