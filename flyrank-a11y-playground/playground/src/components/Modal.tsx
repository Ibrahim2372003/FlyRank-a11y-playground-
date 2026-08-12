import { useCallback, useEffect, useId, useRef } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Modal — implements the WAI-ARIA APG "Dialog (Modal)" pattern by hand.
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * What the pattern requires, and where it lives below:
 *  - role="dialog" + aria-modal="true"                -> on the dialog element
 *  - aria-labelledby pointing at the visible title      -> titleId
 *  - aria-describedby pointing at the description,
 *    when there is one                                  -> descriptionId
 *  - focus moves into the dialog on open                -> useEffect on `open`
 *  - Tab/Shift+Tab are trapped inside the dialog         -> handleKeyDown
 *  - Escape closes the dialog                            -> handleKeyDown
 *  - focus returns to the trigger on close                -> useEffect cleanup
 *  - background content is inert while open               -> `inert` prop from the parent
 *
 * Two things past the bare pattern, closing gaps a real shadcn/Radix
 * dialog covers that a first pass at this often misses (see NOTES.md):
 *  - body scroll is locked while open (inert alone stops keyboard/AT
 *    interaction with the background, but not the mouse wheel)
 *  - an optional `description`, wired to aria-describedby separately
 *    from the title, so a dialog can have both an accessible name and
 *    an accessible description announced together
 */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

// Elements a keyboard user can land on. Deliberately narrow — this is the
// exact set the APG focus-trap algorithm needs to walk.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Open: remember who had focus, then move focus into the dialog.
  // Close: give focus back to exactly that element.
  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialogNode = dialogRef.current;
    const focusable = dialogNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusable && focusable.length > 0 ? focusable[0] : null;

    // Prefer the first focusable control; fall back to the dialog
    // container itself (it carries tabIndex={-1} for exactly this case).
    (firstFocusable ?? dialogNode)?.focus();

    return () => {
      lastFocusedRef.current?.focus();
    };
  }, [open]);

  // Lock body scroll while open, and compensate for the scrollbar
  // disappearing so the page doesn't visibly shift width. Restored to
  // exactly what it was before, not just cleared, in case some other
  // piece of the page had already set an inline overflow/padding.
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialogNode = dialogRef.current;
      if (!dialogNode) return;

      const focusable = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) {
        // Nothing to tab to — keep focus pinned on the dialog itself.
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={() => onClose()}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="modal-description">
            {description}
          </p>
        ) : null}
        <div className="modal-body">{children}</div>
        <button type="button" className="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
