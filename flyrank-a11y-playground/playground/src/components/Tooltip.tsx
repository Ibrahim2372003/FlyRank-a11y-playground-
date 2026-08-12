import { cloneElement, useId, useRef, useState } from "react";
import type { FocusEvent, HTMLAttributes, KeyboardEvent, MouseEvent, ReactElement, ReactNode } from "react";

/**
 * Tooltip — implements the WAI-ARIA APG "Tooltip" widget pattern by hand.
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * This is the one pattern here where "keyboard-only" isn't the whole
 * story — WCAG 1.4.13 (Content on Hover or Focus) applies too, and the
 * APG pattern is written to satisfy it. A tooltip must be:
 *
 *  - Dismissible: Escape hides it without moving focus, and without
 *    swallowing that Escape if a dialog behind it also wants it — see
 *    `event.stopPropagation()` below.
 *  - Hoverable: moving the pointer from the trigger onto the tooltip
 *    itself must not hide it (so a user can read a long tooltip, or
 *    click a link inside one) — handled with a short hide delay that
 *    the tooltip's own mouseenter cancels.
 *  - Persistent: it stays open until the trigger loses focus/hover or
 *    the user dismisses it — not on a fixed timer.
 *
 * It also has to work identically for a keyboard user as a mouse user:
 * the trigger shows it on focus (immediately — a keyboard user
 * shouldn't have to wait out a hover delay they never triggered) and
 * hides it on blur, exactly mirroring hover/unhover.
 *
 * The association to assistive tech is aria-describedby, not
 * aria-labelledby — a tooltip is supplementary description, not the
 * element's name — and it's only present while the tooltip is
 * actually showing, matching how sighted users experience it.
 *
 * This wraps a single trigger element (`children`) with `cloneElement`
 * rather than requiring a render-prop, so callers can write
 * `<Tooltip content="...">                                  <button>Save</button></Tooltip>`
 * the way most tooltip implementations expect. The trade-off, worth
 * naming plainly: if the trigger element already carries its own ref,
 * this doesn't merge it — only reasonable for a from-scratch demo, not
 * for a real component library.
 */

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  /** Hover show delay in ms. Focus always shows immediately, no delay. */
  showDelay?: number;
  /** Hover hide delay in ms — gives a pointer time to reach the tooltip itself. */
  hideDelay?: number;
}

export function Tooltip({ content, children, showDelay = 400, hideDelay = 150 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleShow = () => {
    clearTimers();
    showTimerRef.current = window.setTimeout(() => setVisible(true), showDelay);
  };

  const scheduleHide = () => {
    clearTimers();
    hideTimerRef.current = window.setTimeout(() => setVisible(false), hideDelay);
  };

  const hideNow = () => {
    clearTimers();
    setVisible(false);
  };

  const trigger = cloneElement(children, {
    "aria-describedby": visible ? tooltipId : undefined,
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(event);
      scheduleShow();
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(event);
      scheduleHide();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      children.props.onFocus?.(event);
      clearTimers();
      setVisible(true);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(event);
      hideNow();
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      children.props.onKeyDown?.(event);
      if (event.key === "Escape" && visible) {
        // Stop here so a tooltip inside our Modal doesn't also trigger
        // the modal's own Escape-to-close on the same keypress.
        event.stopPropagation();
        hideNow();
      }
    },
  });

  return (
    <span className="tooltip-wrapper">
      {trigger}
      {visible ? (
        <span
          role="tooltip"
          id={tooltipId}
          className="tooltip-bubble"
          onMouseEnter={clearTimers}
          onMouseLeave={scheduleHide}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
