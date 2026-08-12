import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

/**
 * Tabs — implements the WAI-ARIA APG "Tabs" pattern by hand.
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 *  - tablist / tab / tabpanel roles                    -> below
 *  - aria-selected + roving tabindex (only one tab
 *    is ever in the Tab order; the rest are tabIndex=-1) -> render below
 *  - Home/End jump to the first/last tab
 *  - each panel is aria-labelledby its tab, and vice versa via aria-controls
 *
 * Two axes the pattern allows and a first pass often hardcodes away
 * (see NOTES.md) are exposed as props here instead:
 *
 *  - `orientation`: "horizontal" (default) uses ArrowLeft/ArrowRight and
 *    sets aria-orientation="horizontal"; "vertical" swaps to
 *    ArrowUp/ArrowDown and aria-orientation="vertical".
 *  - `activationMode`: "automatic" (default) — moving focus with an
 *    arrow key also shows that tab's panel immediately. "manual" —
 *    arrow keys only move focus; the panel only switches once the
 *    focused tab is actually activated (Enter/Space, which a real
 *    <button> already does natively — no extra key handling needed).
 *    Manual mode matters when switching panels is expensive.
 *
 * Both arrows always wrap at the ends; both Home and End always work
 * regardless of orientation.
 */

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivationMode = "automatic" | "manual";

export interface TabsProps {
  label: string; // accessible name for the tablist, e.g. "Account settings"
  items: TabItem[];
  orientation?: TabsOrientation;
  activationMode?: TabsActivationMode;
}

export function Tabs({
  label,
  items,
  orientation = "horizontal",
  activationMode = "automatic",
}: TabsProps) {
  const baseId = useId();
  // selectedIndex drives aria-selected and which panel is shown.
  // focusedIndex drives which tab is in the Tab order (roving tabindex).
  // They're the same thing in automatic mode; in manual mode they can
  // diverge while a keyboard user is arrowing through tabs before
  // committing to one.
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (index: number) => {
    setFocusedIndex(index);
    tabRefs.current[index]?.focus();
    if (activationMode === "automatic") {
      setSelectedIndex(index);
    }
  };

  // A real <button> already fires this on click *and* on Enter/Space
  // while focused — so this one function is both "mouse click" and
  // "commit the focused tab in manual mode", with no extra key handler.
  const selectTab = (index: number) => {
    setFocusedIndex(index);
    setSelectedIndex(index);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = items.length - 1;
    const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        moveFocus(index === lastIndex ? 0 : index + 1);
        break;
      case prevKey:
        event.preventDefault();
        moveFocus(index === 0 ? lastIndex : index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(lastIndex);
        break;
      default:
        break;
    }
  };

  return (
    <div className={orientation === "vertical" ? "tabs tabs-vertical" : "tabs"}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className="tabs-list"
      >
        {items.map((item, index) => {
          const tabId = `${baseId}-tab-${item.id}`;
          const panelId = `${baseId}-panel-${item.id}`;
          const selected = index === selectedIndex;
          const focusable = index === focusedIndex;

          return (
            <button
              key={item.id}
              ref={(node: HTMLButtonElement | null) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              id={tabId}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={focusable ? 0 : -1}
              className={selected ? "tab tab-active" : "tab"}
              onClick={() => selectTab(index)}
              onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item, index) => {
        const tabId = `${baseId}-tab-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;
        const selected = index === selectedIndex;

        return (
          <div
            key={item.id}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
            tabIndex={0}
            className="tab-panel"
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
