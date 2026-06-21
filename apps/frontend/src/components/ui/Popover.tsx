import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type PopoverProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  align?: "start" | "center" | "end";
  side?: "bottom" | "right";
};

const focusableSelector =
  'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';

export const Popover = ({ trigger, children, open, onClose, align = "end", side = "bottom" }: PopoverProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex >= 0,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      const previous = previouslyFocusedRef.current;
      if (previous instanceof HTMLElement && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    if (side === "right") {
      top = triggerRect.top + triggerRect.height / 2 - panelRect.height / 2;
      if (align === "start") top = triggerRect.top;
      if (align === "end") top = triggerRect.bottom - panelRect.height;

      const maxTop = window.innerHeight - panelRect.height - gap;
      top = Math.max(gap, Math.min(top, maxTop));

      left = triggerRect.right + gap;
      const maxLeft = window.innerWidth - panelRect.width - gap;
      left = Math.min(left, maxLeft);
    } else {
      left = triggerRect.left + triggerRect.width / 2 - panelRect.width / 2;
      if (align === "start") left = triggerRect.left;
      if (align === "end") left = triggerRect.right - panelRect.width;

      const maxLeft = window.innerWidth - panelRect.width - gap;
      left = Math.max(gap, Math.min(left, maxLeft));

      top = triggerRect.bottom + gap;
      const maxTop = window.innerHeight - panelRect.height - gap;
      top = Math.min(top, maxTop);
    }

    panel.style.position = "fixed";
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }, [open, align, side]);

  return (
    <div className="relative inline-block">
      <div ref={triggerRef}>{trigger}</div>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="false"
              className="z-50 min-w-[12rem] rounded-3xl border border-anime-border bg-anime-surface/95 p-2 shadow-2xl shadow-black/35 backdrop-blur"
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
