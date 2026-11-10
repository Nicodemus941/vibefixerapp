"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible dialog: portal, focus trap, Escape to close, focus restored to
// the opener, body scroll locked. Bottom sheet on phones, centered card on
// larger screens.
export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
  labelHidden = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "sheet" | "fullscreen";
  labelHidden?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[60] flex bg-black/70 backdrop-blur-sm",
        variant === "fullscreen" ? "items-stretch justify-stretch" : "items-end sm:items-center justify-center sm:p-4",
      ].join(" ")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          variant === "fullscreen"
            ? "relative flex h-full w-full flex-col"
            : "relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl sm:max-w-lg sm:rounded-2xl safe-bottom"
        }
      >
        <div
          className={[
            "flex items-center justify-between gap-3",
            variant === "fullscreen" ? "absolute inset-x-0 top-0 z-10 p-3" : "border-b border-[var(--border)] px-4 py-3",
          ].join(" ")}
        >
          <h2
            id={titleId}
            className={labelHidden ? "sr-only" : "text-sm font-medium text-[var(--fg)]"}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`press-shrink ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] ${variant === "fullscreen" ? "bg-black/50" : ""} ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
