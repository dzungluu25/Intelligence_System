import { useCallback } from "react";

/**
 * Water-drop ripple, iOS 26 "Liquid Glass" style: expands from the touch
 * point and fades. Attach via onPointerDown on any element with
 * className="ripple-surface".
 */
export function useRipple() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    span.addEventListener("animationend", () => span.remove(), { once: true });
  }, []);
}
